-- Function to cleanup orphaned users from auth.users
-- This function removes users from auth.users that don't exist in public.profiles
CREATE OR REPLACE FUNCTION cleanup_orphaned_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    orphaned_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Log the start of cleanup process
    RAISE LOG 'Starting cleanup of orphaned users from auth.users...';
    
    -- Count orphaned users first
    SELECT COUNT(*) INTO orphaned_count
    FROM auth.users au
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = au.id
    );
    
    RAISE LOG 'Found % orphaned users to cleanup', orphaned_count;
    
    -- Delete orphaned users
    FOR user_record IN 
        SELECT au.id, au.email
        FROM auth.users au
        WHERE NOT EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = au.id
        )
    LOOP
        -- Log each user being deleted
        RAISE LOG 'Deleting orphaned user: ID=%, Email=%', user_record.id, user_record.email;
        
        -- Delete from auth.users
        DELETE FROM auth.users WHERE id = user_record.id;
        
        -- Log successful deletion
        RAISE LOG 'Successfully deleted orphaned user: ID=%, Email=%', user_record.id, user_record.email;
    END LOOP;
    
    -- Log completion
    RAISE LOG 'Cleanup completed. Deleted % orphaned users from auth.users', orphaned_count;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log any errors
        RAISE LOG 'Error during cleanup: %', SQLERRM;
        RAISE;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION cleanup_orphaned_users() TO service_role;

-- Create a scheduled job using pg_cron (if available)
-- This will run every 24 hours at 2:00 AM
SELECT cron.schedule(
    'cleanup-orphaned-users',
    '0 2 * * *', -- Every day at 2:00 AM
    'SELECT cleanup_orphaned_users();'
);

-- Alternative: Create a manual trigger function that can be called manually
CREATE OR REPLACE FUNCTION trigger_cleanup_orphaned_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Call the cleanup function
    PERFORM cleanup_orphaned_users();
    RETURN NEW;
END;
$$;

-- Create a trigger that runs the cleanup when profiles table is modified
-- This ensures cleanup happens when profiles are deleted
CREATE OR REPLACE FUNCTION trigger_cleanup_on_profile_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If a profile was deleted, cleanup orphaned users
    IF TG_OP = 'DELETE' THEN
        -- Schedule cleanup for 1 minute later to avoid blocking the current transaction
        PERFORM pg_sleep(1);
        PERFORM cleanup_orphaned_users();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS cleanup_orphaned_users_trigger ON public.profiles;
CREATE TRIGGER cleanup_orphaned_users_trigger
    AFTER DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_on_profile_delete();

-- Manual cleanup function that can be called via API
CREATE OR REPLACE FUNCTION manual_cleanup_orphaned_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    orphaned_count INTEGER := 0;
    result JSON;
BEGIN
    -- Count orphaned users
    SELECT COUNT(*) INTO orphaned_count
    FROM auth.users au
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = au.id
    );
    
    -- Perform cleanup
    PERFORM cleanup_orphaned_users();
    
    -- Return result
    result := json_build_object(
        'success', true,
        'message', 'Cleanup completed successfully',
        'orphaned_users_deleted', orphaned_count,
        'timestamp', NOW()
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'timestamp', NOW()
        );
        RETURN result;
END;
$$;

-- Grant execute permission for manual cleanup
GRANT EXECUTE ON FUNCTION manual_cleanup_orphaned_users() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_cleanup_orphaned_users() TO anon; 
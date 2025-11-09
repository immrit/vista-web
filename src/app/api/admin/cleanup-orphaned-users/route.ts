import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        console.log('=== CLEANUP ORPHANED USERS API ===')

        // Check if service role key is available
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
            return NextResponse.json(
                { error: 'Service role key not configured' },
                { status: 500 }
            )
        }

        // Create admin client with service role key
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        console.log('Executing manual cleanup of orphaned users...')

        // Call the manual cleanup function
        const { data: result, error } = await adminSupabase.rpc('manual_cleanup_orphaned_users')

        if (error) {
            console.error('Error executing cleanup:', error)
            return NextResponse.json(
                { error: 'Failed to execute cleanup', details: error.message },
                { status: 500 }
            )
        }

        console.log('Cleanup result:', result)

        return NextResponse.json({
            message: 'Cleanup executed successfully',
            result: result
        })

    } catch (error) {
        console.error('Error in cleanup orphaned users:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        console.log('=== CHECK ORPHANED USERS API ===')

        // Check if service role key is available
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
            return NextResponse.json(
                { error: 'Service role key not configured' },
                { status: 500 }
            )
        }

        // Create admin client with service role key
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        console.log('Checking for orphaned users...')

        // Count orphaned users without deleting them
        const { data: orphanedUsers, error } = await adminSupabase
            .from('auth.users')
            .select('id, email, created_at')
            .not('id', 'in', `(SELECT id FROM public.profiles)`)

        if (error) {
            console.error('Error checking orphaned users:', error)
            return NextResponse.json(
                { error: 'Failed to check orphaned users', details: error.message },
                { status: 500 }
            )
        }

        console.log('Found orphaned users:', orphanedUsers?.length || 0)

        return NextResponse.json({
            message: 'Orphaned users check completed',
            orphaned_count: orphanedUsers?.length || 0,
            orphaned_users: orphanedUsers || []
        })

    } catch (error) {
        console.error('Error in check orphaned users:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 
-- Create delete_codes table for storing email verification codes
CREATE TABLE IF NOT EXISTS public.delete_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delete_codes_user_id ON public.delete_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_delete_codes_code ON public.delete_codes(code);
CREATE INDEX IF NOT EXISTS idx_delete_codes_expires_at ON public.delete_codes(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.delete_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own codes
CREATE POLICY "Users can manage their own delete codes" ON public.delete_codes
    FOR ALL USING (auth.uid()::text = user_id);

-- Create function to clean up expired codes (optional)
CREATE OR REPLACE FUNCTION clean_expired_delete_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.delete_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired codes (optional)
-- This requires pg_cron extension to be enabled
-- SELECT cron.schedule('clean-expired-delete-codes', '0 */1 * * *', 'SELECT clean_expired_delete_codes();'); 
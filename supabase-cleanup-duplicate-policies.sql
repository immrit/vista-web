-- ============================================
-- حذف Policy های جدید و نگه داشتن Policy های قدیمی
-- ============================================
-- این فایل Policy های جدید (با نام‌های انگلیسی) را حذف می‌کند
-- و Policy های قدیمی شما را نگه می‌دارد که در نسخه موبایل کار می‌کنند

-- حذف Policy های جدید (با نام‌های انگلیسی)
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.active_sessions;

-- ============================================
-- بررسی نهایی Policies
-- ============================================
-- بعد از حذف، این کوئری را اجرا کنید تا مطمئن شوید فقط Policy های قدیمی باقی مانده‌اند:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'active_sessions';
-- 
-- باید فقط این 4 Policy را ببینید:
-- - view_own_sessions (SELECT)
-- - insert_own_sessions (INSERT)
-- - update_own_sessions (UPDATE)
-- - delete_own_sessions (DELETE)

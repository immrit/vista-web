-- ============================================
-- RLS Policies for active_sessions table
-- ============================================
-- ⚠️ توجه: این فایل فقط برای مرجع است
-- Policy های قدیمی شما از قبل وجود دارند و کار می‌کنند:
--   - view_own_sessions
--   - insert_own_sessions
--   - update_own_sessions
--   - delete_own_sessions
--
-- اگر Policy های جدید (با نام‌های انگلیسی) ایجاد کرده‌اید و می‌خواهید آن‌ها را حذف کنید،
-- از فایل supabase-cleanup-duplicate-policies.sql استفاده کنید.

-- ============================================
-- بررسی Policies موجود
-- ============================================
-- برای بررسی Policy های موجود، این کوئری را اجرا کنید:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'active_sessions';
--
-- باید این 4 Policy را ببینید:
--   - view_own_sessions (SELECT)
--   - insert_own_sessions (INSERT)
--   - update_own_sessions (UPDATE)
--   - delete_own_sessions (DELETE)

-- ============================================
-- اگر Policy های قدیمی وجود ندارند، این دستورات را اجرا کنید:
-- ============================================

-- 1. فعال‌سازی امنیت روی جدول
-- ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- 2. ایجاد Policy های قدیمی (اگر وجود ندارند)
-- CREATE POLICY "view_own_sessions"
-- ON public.active_sessions FOR SELECT
-- TO authenticated
-- USING (auth.uid() = user_id);

-- CREATE POLICY "insert_own_sessions"
-- ON public.active_sessions FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "update_own_sessions"
-- ON public.active_sessions FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = user_id);

-- CREATE POLICY "delete_own_sessions"
-- ON public.active_sessions FOR DELETE
-- TO authenticated
-- USING (auth.uid() = user_id);

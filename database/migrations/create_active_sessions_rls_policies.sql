-- Policy های RLS برای جدول active_sessions

-- خواندن sessions خودش
CREATE POLICY "Users can view own sessions"
ON active_sessions FOR SELECT
USING (auth.uid() = user_id);

-- ایجاد session جدید
CREATE POLICY "Users can create own sessions"
ON active_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- بروزرسانی sessions خودش
CREATE POLICY "Users can update own sessions"
ON active_sessions FOR UPDATE
USING (auth.uid() = user_id);



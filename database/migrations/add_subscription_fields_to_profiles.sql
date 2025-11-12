-- اضافه کردن فیلدهای subscription به جدول profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- ایندکس برای جستجوی سریع‌تر اشتراک‌های در حال انقضا
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at ON profiles(subscription_expires_at) 
WHERE subscription_expires_at IS NOT NULL;

-- ایندکس برای جستجوی کاربران با اشتراک فعال
CREATE INDEX IF NOT EXISTS idx_profiles_active_subscription ON profiles(verification_type, subscription_expires_at) 
WHERE verification_type = 'goldTick' AND subscription_expires_at > NOW();


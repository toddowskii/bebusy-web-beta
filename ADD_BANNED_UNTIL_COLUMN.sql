-- Add banned_until column to profiles table for temporary bans
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.banned_until IS 'Timestamp when a temporary ban expires. NULL means permanent ban or not banned.';

-- Create index for efficient queries on expired bans
CREATE INDEX IF NOT EXISTS idx_profiles_banned_until 
ON profiles(banned_until) 
WHERE role = 'banned' AND banned_until IS NOT NULL;

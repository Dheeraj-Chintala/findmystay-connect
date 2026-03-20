
-- Add account_status column to profiles for blocking users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.account_status IS 'User account status: active, blocked, suspended';

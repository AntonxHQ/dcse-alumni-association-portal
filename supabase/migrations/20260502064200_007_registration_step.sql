-- Add registration_step column to track multi-step registration progress
-- 0 = not started, 1-6 = last completed step
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_step smallint NOT NULL DEFAULT 0;

-- Backfill existing profiles to step 6 (fully registered)
UPDATE public.profiles SET registration_step = 6 WHERE registration_step = 0 AND status != 'pending_email';

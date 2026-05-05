-- Make intake_year and graduation_year nullable (batch is optional for MS/PhD, graduation removed from form)
ALTER TABLE public.degrees
  ALTER COLUMN intake_year DROP NOT NULL,
  ALTER COLUMN graduation_year DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS degrees_grad_after_intake_check;

-- Add OTP verification columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_otp_code text,
  ADD COLUMN IF NOT EXISTS email_otp_expires_at timestamptz;

-- Mark existing active/pending_admin profiles as email verified
UPDATE public.profiles
  SET email_verified = true
  WHERE status IN ('active', 'pending_admin');

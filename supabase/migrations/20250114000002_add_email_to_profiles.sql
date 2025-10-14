-- Add Email to Profiles Table
--
-- PROBLEM:
-- - Members page shows user_id instead of email
-- - auth.users.email cannot be queried directly from frontend (security)
-- - profiles table doesn't have email field
--
-- SOLUTION:
-- - Add email column to profiles table
-- - Update handle_new_user() trigger to populate email
-- - Backfill existing profiles with email from auth.users
--
-- This allows the frontend to display emails via profiles join

-- ============================================================================
-- PART 1: Add email column to profiles
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

COMMENT ON COLUMN profiles.email IS
'User email address, copied from auth.users.email for easy frontend access.
Updated automatically by handle_new_user trigger on user creation.';

-- ============================================================================
-- PART 2: Update trigger to populate email
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,  -- Add email from auth.users
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger function to auto-create profile when user signs up.
Copies first_name, last_name from user_metadata and email from auth.users.';

-- ============================================================================
-- PART 3: Backfill existing profiles with email
-- ============================================================================

-- Update all existing profiles that don't have email
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
  AND (p.email IS NULL OR p.email = '');

-- ============================================================================
-- PART 4: Verification
-- ============================================================================

-- Verify all profiles now have emails
DO $$
DECLARE
  profiles_without_email INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_without_email
  FROM profiles
  WHERE email IS NULL OR email = '';

  IF profiles_without_email > 0 THEN
    RAISE NOTICE 'Warning: % profiles still missing email', profiles_without_email;
  ELSE
    RAISE NOTICE 'Success: All profiles have email addresses';
  END IF;
END $$;

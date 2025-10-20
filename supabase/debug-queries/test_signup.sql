-- Test signup by simulating what Supabase Auth does
-- This will trigger both on_auth_user_created and zzz_create_default_workspace_after_profile

BEGIN;

-- Insert a test user (this will trigger both triggers)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test-' || floor(random() * 10000)::text || '@example.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Test","last_name":"User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
RETURNING id, email;

-- Check if profile was created
SELECT 'Profile created:' as status, id, email, first_name, last_name
FROM profiles
WHERE email LIKE 'test-%@example.com'
ORDER BY created_at DESC
LIMIT 1;

-- Check if workspace was created
SELECT 'Workspace created:' as status, w.id, w.name, w.slug, w.owner_id
FROM workspaces w
JOIN profiles p ON w.owner_id = p.id
WHERE p.email LIKE 'test-%@example.com'
ORDER BY w.created_at DESC
LIMIT 1;

-- Check if workspace membership was created
SELECT 'Workspace membership:' as status, wm.workspace_id, wm.user_id, wm.role, wm.status
FROM workspace_members wm
JOIN profiles p ON wm.user_id = p.id
WHERE p.email LIKE 'test-%@example.com'
ORDER BY wm.joined_at DESC
LIMIT 1;

ROLLBACK;

-- Bootstrap Super Admin for SelfDiscovery
-- Run once in Supabase SQL Editor after migration 03.
-- Admin email: theolencer@gmail.com

-- 1) Promote profile (must already exist in auth.users from signup)
UPDATE public.user_profiles
SET
  role = 'admin',
  approval_status = 'approved',
  approved_at = NOW(),
  auth_provider = COALESCE(auth_provider, 'email'),
  rejection_reason = NULL
WHERE lower(email) = lower('theolencer@gmail.com');

-- 2) Grant all modules with super_admin role
INSERT INTO public.user_module_access (user_id, module_id, role_id, granted_by)
SELECT
  up.id,
  m.id,
  'super_admin',
  up.id
FROM public.user_profiles up
CROSS JOIN public.modules m
WHERE lower(up.email) = lower('theolencer@gmail.com')
ON CONFLICT (user_id, module_id) DO UPDATE
SET role_id = EXCLUDED.role_id,
    granted_by = EXCLUDED.granted_by,
    granted_at = NOW();

-- 3) Link auth provider row
INSERT INTO public.auth_providers (user_id, provider, email)
SELECT up.id, 'email', up.email
FROM public.user_profiles up
WHERE lower(up.email) = lower('theolencer@gmail.com')
ON CONFLICT (user_id, provider) DO NOTHING;

-- 4) Audit log
INSERT INTO public.audit_logs (actor_id, target_user_id, action, resource_type, metadata)
SELECT
  up.id,
  up.id,
  'bootstrap.admin',
  'user_profiles',
  jsonb_build_object('email', up.email, 'role', 'admin')
FROM public.user_profiles up
WHERE lower(up.email) = lower('theolencer@gmail.com');

-- Verify
SELECT
  id,
  email,
  role,
  approval_status,
  approved_at
FROM public.user_profiles
WHERE lower(email) = lower('theolencer@gmail.com');

SELECT
  uma.module_id,
  uma.role_id
FROM public.user_module_access uma
JOIN public.user_profiles up ON up.id = uma.user_id
WHERE lower(up.email) = lower('theolencer@gmail.com')
ORDER BY uma.module_id;

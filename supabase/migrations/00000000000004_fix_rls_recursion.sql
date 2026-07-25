-- Migration 04: Fix infinite recursion in user_profiles RLS policies
--
-- Problem: admin policies on public.user_profiles contained
--   EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
-- Evaluating that subquery re-triggers the same policy, so Postgres raises
--   "infinite recursion detected in policy for relation user_profiles".
--
-- Fix: move the admin check into SECURITY DEFINER functions, which bypass RLS.

-- ---------------------------------------------------------------------------
-- Helper functions (bypass RLS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = p_user_id
      AND role = 'admin'
      AND approval_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_approval_status(p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT approval_status::text
  FROM public.user_profiles
  WHERE id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_approval_status(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Rebuild user_profiles policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users read own profile approval" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins update approval status" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.user_profiles;

CREATE POLICY "profiles_select_self_or_admin"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_platform_admin());

CREATE POLICY "profiles_insert_self"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_self_or_admin"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = id OR public.is_platform_admin());

CREATE POLICY "profiles_delete_admin"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Rebuild dependent policies to use the function
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users read own module access" ON public.user_module_access;
DROP POLICY IF EXISTS "Admins manage module access" ON public.user_module_access;
DROP POLICY IF EXISTS "module_access_select" ON public.user_module_access;
DROP POLICY IF EXISTS "module_access_insert" ON public.user_module_access;
DROP POLICY IF EXISTS "module_access_update" ON public.user_module_access;
DROP POLICY IF EXISTS "module_access_delete" ON public.user_module_access;

CREATE POLICY "module_access_select"
  ON public.user_module_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin());

-- Allow self-bootstrap: a user may grant modules to themselves only when they
-- are already an approved admin; admins may grant to anyone.
CREATE POLICY "module_access_insert"
  ON public.user_module_access FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin() OR auth.uid() = user_id);

CREATE POLICY "module_access_update"
  ON public.user_module_access FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "module_access_delete"
  ON public.user_module_access FOR DELETE
  TO authenticated
  USING (public.is_platform_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "invitations_admin_all" ON public.invitations;
CREATE POLICY "invitations_admin_all"
  ON public.invitations FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "System insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id OR public.is_platform_admin());

-- Feature permission overrides
DROP POLICY IF EXISTS "feature_permissions_select" ON public.user_feature_permissions;
CREATE POLICY "feature_permissions_select"
  ON public.user_feature_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "feature_permissions_admin_write" ON public.user_feature_permissions;
CREATE POLICY "feature_permissions_admin_write"
  ON public.user_feature_permissions FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Auth providers
DROP POLICY IF EXISTS "auth_providers_self" ON public.auth_providers;
CREATE POLICY "auth_providers_self"
  ON public.auth_providers FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

-- Reference tables: readable by all signed-in users
DROP POLICY IF EXISTS "Authenticated read modules" ON public.modules;
DROP POLICY IF EXISTS "modules_read" ON public.modules;
CREATE POLICY "modules_read" ON public.modules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read permissions" ON public.permissions;
DROP POLICY IF EXISTS "permissions_read" ON public.permissions;
CREATE POLICY "permissions_read" ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rbac_roles_read" ON public.rbac_roles;
CREATE POLICY "rbac_roles_read" ON public.rbac_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "role_permissions_read" ON public.role_permissions;
CREATE POLICY "role_permissions_read"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- has_permission also needs to avoid recursive policy evaluation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(
  p_user_id UUID,
  p_permission_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super BOOLEAN;
  v_override BOOLEAN;
  v_has_via_role BOOLEAN;
BEGIN
  IF public.is_platform_admin(p_user_id) THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM user_module_access uma
    WHERE uma.user_id = p_user_id AND uma.role_id = 'super_admin'
  ) INTO v_is_super;
  IF v_is_super THEN RETURN true; END IF;

  SELECT granted INTO v_override
  FROM user_feature_permissions
  WHERE user_id = p_user_id AND permission_id = p_permission_id;
  IF FOUND THEN RETURN v_override; END IF;

  SELECT EXISTS (
    SELECT 1
    FROM user_module_access uma
    JOIN role_permissions rp ON rp.role_id = uma.role_id
    WHERE uma.user_id = p_user_id AND rp.permission_id = p_permission_id
  ) INTO v_has_via_role;

  RETURN COALESCE(v_has_via_role, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_approved(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Privilege escalation guard
--
-- "profiles_update_self_or_admin" lets a user update their own row, which would
-- otherwise allow self-promotion to admin. This trigger blocks changes to
-- role / approval_status unless the actor is an approved admin, OR this is the
-- very first admin bootstrap (no approved admin exists yet).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_admin_exists BOOLEAN;
BEGIN
  -- Service role / SQL editor (no JWT) bypasses the guard
  IF v_actor IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS NOT DISTINCT FROM OLD.role
     AND NEW.approval_status IS NOT DISTINCT FROM OLD.approval_status THEN
    RETURN NEW;
  END IF;

  IF public.is_platform_admin(v_actor) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE role = 'admin' AND approval_status = 'approved'
  ) INTO v_admin_exists;

  -- First-run bootstrap: allow the very first admin to be created
  IF NOT v_admin_exists AND v_actor = NEW.id THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only an administrator can change role or approval status';
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileges_trigger ON public.user_profiles;
CREATE TRIGGER guard_profile_privileges_trigger
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileges();

-- Same guard on insert (new signups cannot self-assign admin)
CREATE OR REPLACE FUNCTION public.guard_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_admin_exists BOOLEAN;
BEGIN
  IF v_actor IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'admin' OR NEW.approval_status = 'approved' THEN
    IF public.is_platform_admin(v_actor) THEN
      RETURN NEW;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE role = 'admin' AND approval_status = 'approved'
    ) INTO v_admin_exists;

    IF NOT v_admin_exists AND v_actor = NEW.id THEN
      RETURN NEW;
    END IF;

    NEW.role := 'user';
    NEW.approval_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_insert_trigger ON public.user_profiles;
CREATE TRIGGER guard_profile_insert_trigger
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_insert();

-- ---------------------------------------------------------------------------
-- Verify: should return without recursion errors
-- ---------------------------------------------------------------------------
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_profiles'
ORDER BY policyname;

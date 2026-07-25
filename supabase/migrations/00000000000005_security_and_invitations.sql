-- Migration 05: login throttling, account lockout, device/session history,
-- security events, email outbox, and invitation redemption.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Profile columns for security preferences
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS notify_on_new_login BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  -- False means "never configured by an admin", which is treated as unrestricted
  -- so the RBAC rollout does not lock out accounts that predate it.
  ADD COLUMN IF NOT EXISTS modules_configured BOOLEAN NOT NULL DEFAULT false;

UPDATE public.user_profiles p
SET modules_configured = true
WHERE modules_configured = false
  AND EXISTS (SELECT 1 FROM public.user_module_access a WHERE a.user_id = p.id);

-- ---------------------------------------------------------------------------
-- Login attempts + lockouts
--
-- These tables are written only through SECURITY DEFINER functions so that a
-- signed-out visitor can be throttled without granting anyone table access.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  successful BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email
  ON public.login_attempts (lower(email), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip
  ON public.login_attempts (ip_address, created_at DESC);

CREATE TABLE IF NOT EXISTS public.account_lockouts (
  email TEXT PRIMARY KEY,
  failed_count INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "login_attempts_admin_read" ON public.login_attempts;
CREATE POLICY "login_attempts_admin_read"
  ON public.login_attempts FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "account_lockouts_admin_read" ON public.account_lockouts;
CREATE POLICY "account_lockouts_admin_read"
  ON public.account_lockouts FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Security events (login, logout, password change, MFA, suspicious activity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  location TEXT,
  is_suspicious BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user
  ON public.security_events (user_id, created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_events_select" ON public.security_events;
CREATE POLICY "security_events_select"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "security_events_insert_self" ON public.security_events;
CREATE POLICY "security_events_insert_self"
  ON public.security_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Known devices (one row per user + device fingerprint)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  label TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, fingerprint)
);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_devices_self" ON public.user_devices;
CREATE POLICY "user_devices_self"
  ON public.user_devices FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Email outbox — every message the platform tries to send is recorded here,
-- whether or not a provider is configured.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued',
  provider TEXT,
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_created
  ON public.email_outbox (created_at DESC);

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_outbox_admin_read" ON public.email_outbox;
CREATE POLICY "email_outbox_admin_read"
  ON public.email_outbox FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "email_outbox_insert" ON public.email_outbox;
CREATE POLICY "email_outbox_insert"
  ON public.email_outbox FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "email_outbox_update" ON public.email_outbox;
CREATE POLICY "email_outbox_update"
  ON public.email_outbox FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Throttling: how many failures before lockout, and for how long
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_login_lockout(
  p_email TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_attempts CONSTANT INT := 5;
  v_window CONSTANT INTERVAL := INTERVAL '15 minutes';
  v_lock RECORD;
  v_recent INT;
  v_ip_recent INT;
BEGIN
  SELECT * INTO v_lock FROM account_lockouts WHERE email = lower(p_email);

  IF FOUND AND v_lock.locked_until IS NOT NULL AND v_lock.locked_until > NOW() THEN
    RETURN jsonb_build_object(
      'locked', true,
      'locked_until', v_lock.locked_until,
      'retry_after_seconds', CEIL(EXTRACT(EPOCH FROM (v_lock.locked_until - NOW())))
    );
  END IF;

  SELECT COUNT(*) INTO v_recent
  FROM login_attempts
  WHERE lower(email) = lower(p_email)
    AND successful = false
    AND created_at > NOW() - v_window;

  -- A single IP hammering many accounts is throttled independently
  IF p_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_recent
    FROM login_attempts
    WHERE ip_address = p_ip
      AND successful = false
      AND created_at > NOW() - v_window;

    IF v_ip_recent >= v_max_attempts * 4 THEN
      RETURN jsonb_build_object(
        'locked', true,
        'reason', 'ip',
        'retry_after_seconds', 900
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'locked', false,
    'remaining_attempts', GREATEST(0, v_max_attempts - v_recent)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.register_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_attempts CONSTANT INT := 5;
  v_window CONSTANT INTERVAL := INTERVAL '15 minutes';
  v_failures INT;
  v_lock_minutes INT;
  v_locked_until TIMESTAMPTZ;
BEGIN
  INSERT INTO login_attempts (email, ip_address, user_agent, successful)
  VALUES (lower(p_email), p_ip, p_user_agent, p_success);

  IF p_success THEN
    DELETE FROM account_lockouts WHERE email = lower(p_email);
    RETURN jsonb_build_object('locked', false);
  END IF;

  SELECT COUNT(*) INTO v_failures
  FROM login_attempts
  WHERE lower(email) = lower(p_email)
    AND successful = false
    AND created_at > NOW() - v_window;

  IF v_failures >= v_max_attempts THEN
    -- Each additional block of failures doubles the wait, capped at 60 minutes
    v_lock_minutes := LEAST(60, 15 * POWER(2, GREATEST(0, (v_failures - v_max_attempts) / v_max_attempts))::INT);
    v_locked_until := NOW() + make_interval(mins => v_lock_minutes);

    INSERT INTO account_lockouts (email, failed_count, locked_until, updated_at)
    VALUES (lower(p_email), v_failures, v_locked_until, NOW())
    ON CONFLICT (email) DO UPDATE
      SET failed_count = EXCLUDED.failed_count,
          locked_until = EXCLUDED.locked_until,
          updated_at = NOW();

    RETURN jsonb_build_object(
      'locked', true,
      'locked_until', v_locked_until,
      'retry_after_seconds', v_lock_minutes * 60
    );
  END IF;

  RETURN jsonb_build_object(
    'locked', false,
    'remaining_attempts', GREATEST(0, v_max_attempts - v_failures)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_account_lockout(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM account_lockouts WHERE email = lower(p_email);
  DELETE FROM login_attempts
  WHERE lower(email) = lower(p_email) AND successful = false;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_login_lockout(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_login_attempt(TEXT, BOOLEAN, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_account_lockout(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Invitation redemption
--
-- Runs as definer because the invited user is not yet approved and cannot
-- change their own approval status. A valid, unexpired token addressed to the
-- caller's own email is the authorisation.
--
-- The privilege guard from migration 04 would normally reject a non-admin
-- changing approval_status, so it now honours a transaction-local bypass flag
-- that only this function can set.
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

  -- Set only inside redeem_invitation, and only for that transaction
  IF COALESCE(current_setting('app.privilege_guard_bypass', true), '') = 'on' THEN
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

CREATE OR REPLACE FUNCTION public.redeem_invitation(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
  v_inv RECORD;
  v_module TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  SELECT * INTO v_inv FROM invitations WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  IF v_inv.status = 'accepted' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_accepted');
  END IF;

  IF v_inv.status = 'revoked' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'revoked');
  END IF;

  IF v_inv.expires_at < NOW() THEN
    UPDATE invitations SET status = 'expired' WHERE id = v_inv.id;
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF lower(v_inv.email) <> lower(v_email) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'email_mismatch',
                              'invited_email', v_inv.email);
  END IF;

  PERFORM set_config('app.privilege_guard_bypass', 'on', true);

  UPDATE user_profiles
  SET approval_status = 'approved',
      approved_at = NOW(),
      approved_by = v_inv.invited_by,
      rejection_reason = NULL,
      modules_configured = true,
      role = CASE WHEN v_inv.role_id IN ('super_admin', 'admin') THEN 'admin'
                  WHEN v_inv.role_id = 'manager' THEN 'manager'
                  ELSE role END
  WHERE id = v_user_id;

  FOREACH v_module IN ARRAY v_inv.module_ids LOOP
    INSERT INTO user_module_access (user_id, module_id, role_id, granted_by)
    VALUES (v_user_id, v_module, v_inv.role_id, v_inv.invited_by)
    ON CONFLICT (user_id, module_id) DO UPDATE
      SET role_id = EXCLUDED.role_id,
          granted_by = EXCLUDED.granted_by,
          granted_at = NOW();
  END LOOP;

  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW(), accepted_by = v_user_id
  WHERE id = v_inv.id;

  INSERT INTO audit_logs (actor_id, target_user_id, action, resource_type, resource_id, metadata)
  VALUES (v_user_id, v_user_id, 'invitation.accept', 'invitations', v_inv.id::TEXT,
          jsonb_build_object('email', v_inv.email, 'role', v_inv.role_id,
                             'modules', v_inv.module_ids));

  PERFORM set_config('app.privilege_guard_bypass', 'off', true);

  RETURN jsonb_build_object('ok', true, 'modules', v_inv.module_ids, 'role', v_inv.role_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_invitation(TEXT) TO authenticated;

-- Anyone holding a token may look up its basic details (email + status) so the
-- accept page can prefill and explain itself before the user signs in.
CREATE OR REPLACE FUNCTION public.invitation_preview(p_token TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN i.id IS NULL THEN jsonb_build_object('found', false)
    ELSE jsonb_build_object(
      'found', true,
      'email', i.email,
      'status', i.status,
      'role_id', i.role_id,
      'module_ids', i.module_ids,
      'expired', i.expires_at < NOW(),
      'expires_at', i.expires_at
    )
  END
  FROM (SELECT 1) dummy
  LEFT JOIN invitations i ON i.token = p_token;
$$;

GRANT EXECUTE ON FUNCTION public.invitation_preview(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admins may edit the role catalogue and its permission matrix
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "rbac_roles_admin_write" ON public.rbac_roles;
CREATE POLICY "rbac_roles_admin_write"
  ON public.rbac_roles FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "role_permissions_admin_write" ON public.role_permissions;
CREATE POLICY "role_permissions_admin_write"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- The super admin role must always hold every permission
CREATE OR REPLACE FUNCTION public.protect_super_admin_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role_id = 'super_admin' THEN
      RAISE EXCEPTION 'The Super Admin role always holds every permission';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.role_id = 'super_admin' THEN
    RAISE EXCEPTION 'The Super Admin role always holds every permission';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_super_admin_permissions_trigger ON public.role_permissions;
CREATE TRIGGER protect_super_admin_permissions_trigger
  BEFORE UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_super_admin_permissions();

-- ---------------------------------------------------------------------------
-- Audit log read for admins is already covered; add an index for the viewer
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs (target_user_id);

-- ---------------------------------------------------------------------------
-- Per-session listing and revocation, backed by Supabase's own session table.
--
-- auth.sessions is managed by Supabase and its columns have changed across
-- versions, so this block is optional: if it cannot be created the app hides
-- per-session controls and everything above still applies.
-- ---------------------------------------------------------------------------
DO $do$
BEGIN
  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.list_my_sessions()
    RETURNS TABLE (
      id UUID,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ,
      user_agent TEXT,
      ip TEXT,
      aal TEXT
    )
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = auth, public
    AS $body$
      SELECT s.id,
             s.created_at,
             s.updated_at,
             s.user_agent,
             host(s.ip)::TEXT,
             s.aal::TEXT
      FROM auth.sessions s
      WHERE s.user_id = auth.uid()
      ORDER BY s.updated_at DESC NULLS LAST;
    $body$;
  $fn$;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.revoke_my_session(p_session_id UUID)
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = auth, public
    AS $body$
    BEGIN
      DELETE FROM auth.sessions WHERE id = p_session_id AND user_id = auth.uid();
      RETURN FOUND;
    END;
    $body$;
  $fn$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.list_my_sessions() TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.revoke_my_session(UUID) TO authenticated';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping per-session helpers: %', SQLERRM;
END
$do$;

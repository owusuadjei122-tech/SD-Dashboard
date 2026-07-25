-- Migration 03: Admin approval, RBAC, invitations, audit logs
-- Run after 00000000000002_user_profiles_and_activity.sql

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auth_provider AS ENUM ('email', 'google', 'invitation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Extend user_profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS approval_status approval_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS auth_provider auth_provider NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS google_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_source_preference TEXT NOT NULL DEFAULT 'platform'
    CHECK (avatar_source_preference IN ('google', 'platform')),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS department TEXT;

-- Existing accounts stay approved so migration does not lock anyone out.
-- New signups after this migration default to pending via the column default + trigger.
UPDATE public.user_profiles
SET approval_status = 'approved', approved_at = COALESCE(approved_at, NOW())
WHERE approval_status = 'pending';

-- ---------------------------------------------------------------------------
-- Modules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.modules (id, name, description, is_private, sort_order) VALUES
  ('workspace', 'Team Workspace', 'Internal collaboration', true, 1),
  ('wear', 'SelfDiscovery Wear', 'Products, sales, inventory', false, 2),
  ('library', 'SelfDiscovery Library', 'Books and library ops', false, 3)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Permissions (atomic keys)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
  id TEXT PRIMARY KEY,
  module_id TEXT REFERENCES public.modules(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.permissions (id, module_id, action, description) VALUES
  ('workspace.access', 'workspace', 'access', 'Access workspace module'),
  ('workspace.tasks.view', 'workspace', 'view', 'View tasks'),
  ('workspace.tasks.create', 'workspace', 'create', 'Create tasks'),
  ('workspace.tasks.edit', 'workspace', 'edit', 'Edit tasks'),
  ('workspace.tasks.delete', 'workspace', 'delete', 'Delete tasks'),
  ('workspace.tasks.assign', 'workspace', 'assign', 'Assign tasks'),
  ('workspace.members.manage', 'workspace', 'manage', 'Manage members'),
  ('workspace.channels.create', 'workspace', 'create', 'Create channels'),
  ('workspace.channels.delete', 'workspace', 'delete', 'Delete channels'),
  ('wear.access', 'wear', 'access', 'Access wear module'),
  ('wear.products.view', 'wear', 'view', 'View products'),
  ('wear.products.create', 'wear', 'create', 'Create products'),
  ('wear.products.edit', 'wear', 'edit', 'Edit products'),
  ('wear.products.delete', 'wear', 'delete', 'Delete products'),
  ('wear.products.publish', 'wear', 'publish', 'Publish products'),
  ('wear.orders.manage', 'wear', 'manage', 'Manage orders'),
  ('wear.inventory.manage', 'wear', 'manage', 'Manage inventory'),
  ('wear.data.export', 'wear', 'export', 'Export wear data'),
  ('library.access', 'library', 'access', 'Access library module'),
  ('library.books.view', 'library', 'view', 'View books'),
  ('library.books.upload', 'library', 'create', 'Upload books'),
  ('library.books.delete', 'library', 'delete', 'Delete books'),
  ('library.books.approve', 'library', 'approve', 'Approve books'),
  ('library.data.export', 'library', 'export', 'Export library data'),
  ('platform.admin', NULL, 'manage', 'Platform administration'),
  ('platform.users.approve', NULL, 'approve', 'Approve/reject users'),
  ('platform.users.invite', NULL, 'invite', 'Invite users'),
  ('platform.roles.manage', NULL, 'manage', 'Manage roles and permissions')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Roles (extend existing roles table from init migration if present)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rbac_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.rbac_roles (id, name, description, is_system) VALUES
  ('super_admin', 'Super Admin', 'Full platform access', true),
  ('admin', 'Admin', 'Organization administrator', true),
  ('manager', 'Manager', 'Module manager', true),
  ('team_member', 'Team Member', 'Standard contributor', true),
  ('viewer', 'Viewer', 'Read-only access', true),
  ('guest', 'Guest', 'Limited invited access', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Role → permission mapping
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id TEXT NOT NULL REFERENCES public.rbac_roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Super admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- Admin: all module access + platform admin (not super)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'admin', id FROM public.permissions
WHERE id != 'platform.admin' OR id IN ('platform.users.approve', 'platform.users.invite', 'platform.roles.manage')
ON CONFLICT DO NOTHING;

-- Viewer: view-only per module
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'viewer', id FROM public.permissions
WHERE action = 'view' OR id LIKE '%.access'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- User module access (which modules + role per module)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES public.rbac_roles(id),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);

-- ---------------------------------------------------------------------------
-- User feature permission overrides
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status invitation_status NOT NULL DEFAULT 'pending',
  role_id TEXT NOT NULL REFERENCES public.rbac_roles(id),
  module_ids TEXT[] NOT NULL DEFAULT '{}',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);

-- ---------------------------------------------------------------------------
-- Audit logs (immutable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- Auth providers linkage
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider auth_provider NOT NULL,
  provider_user_id TEXT,
  email TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

-- ---------------------------------------------------------------------------
-- Helper: check permission
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
  -- Super admin shortcut
  SELECT EXISTS (
    SELECT 1 FROM user_module_access uma
    JOIN rbac_roles r ON r.id = uma.role_id
    WHERE uma.user_id = p_user_id AND uma.role_id = 'super_admin'
  ) INTO v_is_super;
  IF v_is_super THEN RETURN true; END IF;

  -- Explicit override
  SELECT granted INTO v_override
  FROM user_feature_permissions
  WHERE user_id = p_user_id AND permission_id = p_permission_id;
  IF FOUND THEN RETURN v_override; END IF;

  -- Role-based
  SELECT EXISTS (
    SELECT 1
    FROM user_module_access uma
    JOIN role_permissions rp ON rp.role_id = uma.role_id
    WHERE uma.user_id = p_user_id AND rp.permission_id = p_permission_id
  ) INTO v_has_via_role;

  RETURN COALESCE(v_has_via_role, false);
END;
$$;

-- ---------------------------------------------------------------------------
-- Helper: is user approved
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_user_approved(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT approval_status = 'approved'
  FROM user_profiles
  WHERE id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- Update handle_new_user trigger for pending approval
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, email, first_name, last_name, role, approval_status, auth_provider, google_avatar_url
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1)),
    NEW.raw_user_meta_data->>'last_name',
    'user',
    'pending',
    CASE
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'google'::auth_provider
      ELSE 'email'::auth_provider
    END,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    google_avatar_url = COALESCE(EXCLUDED.google_avatar_url, user_profiles.google_avatar_url);

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_providers ENABLE ROW LEVEL SECURITY;

-- Users read own module access
CREATE POLICY "Users read own module access"
  ON public.user_module_access FOR SELECT
  USING (auth.uid() = user_id);

-- Admins manage all (via platform permission checked in app layer)
CREATE POLICY "Admins manage module access"
  ON public.user_module_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin') AND approval_status = 'approved'
    )
  );

CREATE POLICY "Users read own profile approval"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins read all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin' AND up.approval_status = 'approved'
    )
  );

CREATE POLICY "Admins update approval status"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin' AND up.approval_status = 'approved'
    )
  );

CREATE POLICY "Authenticated read modules"
  ON public.modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage invitations"
  ON public.invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin' AND approval_status = 'approved'
    )
  );

CREATE POLICY "Admins read audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin' AND approval_status = 'approved'
    )
  );

CREATE POLICY "System insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

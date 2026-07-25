"use server";

import { createClient } from "@/lib/supabase/server";
import type { AccessProfile, ApprovalStatus, AuthProvider, ModuleId } from "./types";
import { homePathForModules } from "./modules";

const ALL_MODULES: ModuleId[] = ["workspace", "wear", "library"];

function isMissingColumnError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("column") ||
    msg.includes("schema cache")
  );
}

function toAccessProfile(
  row: Record<string, unknown>,
  modules: ModuleId[],
  schemaReady: boolean
): AccessProfile {
  const role = String(row.role || "user");
  const approval = (row.approval_status as ApprovalStatus | undefined) || "approved";
  const isAdmin = role === "admin";

  return {
    id: String(row.id),
    email: String(row.email || ""),
    first_name: (row.first_name as string | null) ?? null,
    last_name: (row.last_name as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    google_avatar_url: (row.google_avatar_url as string | null) ?? null,
    avatar_source_preference:
      (row.avatar_source_preference as "google" | "platform" | undefined) || "platform",
    role,
    approval_status: schemaReady ? approval : "approved",
    auth_provider: (row.auth_provider as AuthProvider | undefined) || "email",
    department: (row.department as string | null) ?? null,
    last_login_at: (row.last_login_at as string | null) ?? null,
    created_at: String(row.created_at || new Date().toISOString()),
    rejection_reason: (row.rejection_reason as string | null) ?? null,
    mfa_enabled: Boolean(row.mfa_enabled),
    notify_on_new_login: row.notify_on_new_login !== false,
    modules: isAdmin ? ALL_MODULES : modules,
    isAdmin,
  };
}

/**
 * Load the current user's access profile (approval + modules).
 * Gracefully degrades if Migration 03 has not been applied yet.
 */
export async function getAccessProfile(): Promise<AccessProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let schemaReady = true;
  let profile: Record<string, unknown> | null = null;
  let error: { message?: string; code?: string } | null = null;

  const full = await supabase
    .from("user_profiles")
    .select(
      "id, email, first_name, last_name, avatar_url, google_avatar_url, avatar_source_preference, role, approval_status, auth_provider, department, last_login_at, created_at, rejection_reason, mfa_enabled, notify_on_new_login, modules_configured"
    )
    .eq("id", user.id)
    .maybeSingle();

  profile = (full.data as Record<string, unknown> | null) ?? null;
  error = full.error;

  if (error && isMissingColumnError(error)) {
    schemaReady = false;
    const fallback = await supabase
      .from("user_profiles")
      .select("id, email, first_name, last_name, avatar_url, role, created_at")
      .eq("id", user.id)
      .maybeSingle();
    profile = (fallback.data as Record<string, unknown> | null) ?? null;
    error = fallback.error;
  }

  if (error || !profile) {
    // Profile missing — treat as pending once schema is ready, else approved for legacy
    return {
      id: user.id,
      email: user.email || "",
      first_name: user.user_metadata?.first_name ?? null,
      last_name: user.user_metadata?.last_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      google_avatar_url: user.user_metadata?.avatar_url ?? null,
      avatar_source_preference: "platform",
      role: "user",
      approval_status: schemaReady ? "pending" : "approved",
      auth_provider: "email",
      department: null,
      last_login_at: null,
      created_at: user.created_at || new Date().toISOString(),
      rejection_reason: null,
      mfa_enabled: false,
      notify_on_new_login: true,
      modules: schemaReady ? [] : ALL_MODULES,
      isAdmin: false,
    };
  }

  let modules: ModuleId[] = [];
  if (schemaReady) {
    const { data: accessRows, error: accessError } = await supabase
      .from("user_module_access")
      .select("module_id")
      .eq("user_id", user.id);

    if (accessError && isMissingColumnError(accessError)) {
      modules = ALL_MODULES;
      schemaReady = false;
    } else if (profile.role === "admin") {
      modules = ALL_MODULES;
    } else if (profile.modules_configured === false) {
      // Predates the RBAC rollout, or no admin has chosen modules yet
      modules = ALL_MODULES;
    } else {
      modules = (accessRows || []).map((r) => r.module_id as ModuleId);
    }
  } else {
    modules = ALL_MODULES;
  }

  return toAccessProfile(profile as Record<string, unknown>, modules, schemaReady);
}

export async function getPostAuthRedirect(): Promise<string> {
  const profile = await getAccessProfile();
  if (!profile) return "/login";

  switch (profile.approval_status) {
    case "pending":
      return "/pending-approval";
    case "rejected":
    case "suspended":
      return "/access-denied";
    case "approved":
      return homePathForModules(profile.modules);
    default:
      return "/dashboard";
  }
}

export async function requireApprovedAdmin(): Promise<AccessProfile> {
  const profile = await getAccessProfile();
  if (!profile) throw new Error("Not authenticated");
  if (profile.approval_status !== "approved") throw new Error("Account not approved");
  if (!profile.isAdmin) throw new Error("Admin access required");
  return profile;
}

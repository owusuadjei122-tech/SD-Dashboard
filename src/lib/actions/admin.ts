"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireApprovedAdmin } from "@/lib/rbac/access";
import { ALL_MODULES, type ApprovalStatus, type ModuleId, type RbacRoleId } from "@/lib/rbac/types";
import { sendEmail } from "@/lib/email/send";

export interface ModuleGrant {
  moduleId: ModuleId;
  roleId: RbacRoleId;
}

export interface AdminMemberRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  google_avatar_url: string | null;
  avatar_source_preference: "google" | "platform";
  role: string;
  approval_status: ApprovalStatus;
  auth_provider: string;
  department: string | null;
  last_login_at: string | null;
  created_at: string;
  rejection_reason: string | null;
  mfa_enabled: boolean;
  modules_configured: boolean;
  grants: ModuleGrant[];
  modules: ModuleId[];
}

const MEMBER_COLUMNS =
  "id, email, first_name, last_name, avatar_url, google_avatar_url, avatar_source_preference, role, approval_status, auth_provider, department, last_login_at, created_at, rejection_reason, mfa_enabled, modules_configured";

export async function writeAuditLog(input: {
  actorId: string;
  targetUserId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      actor_id: input.actorId,
      target_user_id: input.targetUserId ?? null,
      action: input.action,
      resource_type: input.resourceType ?? "user_profiles",
      resource_id: input.resourceId ?? input.targetUserId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Audit logging must never block an administrative action
  }
}

function displayNameOf(row: { first_name: string | null; last_name: string | null; email: string }) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.email;
}

export async function listMembers(filters?: {
  status?: ApprovalStatus | "all";
  search?: string;
}): Promise<AdminMemberRow[]> {
  await requireApprovedAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("user_profiles")
    .select(MEMBER_COLUMNS)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("approval_status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const userIds = (data || []).map((r) => r.id);
  const grantMap = new Map<string, ModuleGrant[]>();

  if (userIds.length > 0) {
    const { data: accessRows } = await supabase
      .from("user_module_access")
      .select("user_id, module_id, role_id")
      .in("user_id", userIds);

    for (const row of accessRows || []) {
      const list = grantMap.get(row.user_id) || [];
      list.push({ moduleId: row.module_id as ModuleId, roleId: row.role_id as RbacRoleId });
      grantMap.set(row.user_id, list);
    }
  }

  let rows: AdminMemberRow[] = (data || []).map((row) => {
    const grants = grantMap.get(row.id) || [];
    const isAdmin = row.role === "admin";
    const configured = Boolean(row.modules_configured);

    // Admins always hold every module; unconfigured accounts stay unrestricted
    const modules: ModuleId[] = isAdmin
      ? [...ALL_MODULES]
      : configured
        ? grants.map((g) => g.moduleId)
        : [...ALL_MODULES];

    return {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      avatar_url: row.avatar_url,
      google_avatar_url: row.google_avatar_url,
      avatar_source_preference: row.avatar_source_preference || "platform",
      role: row.role,
      approval_status: (row.approval_status || "approved") as ApprovalStatus,
      auth_provider: row.auth_provider || "email",
      department: row.department,
      last_login_at: row.last_login_at,
      created_at: row.created_at,
      rejection_reason: row.rejection_reason,
      mfa_enabled: Boolean(row.mfa_enabled),
      modules_configured: configured,
      grants,
      modules,
    };
  });

  const search = filters?.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter(
      (r) =>
        displayNameOf(r).toLowerCase().includes(search) || r.email.toLowerCase().includes(search)
    );
  }

  return rows;
}

async function replaceModuleGrants(userId: string, grants: ModuleGrant[], adminId: string) {
  const supabase = await createClient();

  await supabase.from("user_module_access").delete().eq("user_id", userId);

  if (grants.length > 0) {
    const { error } = await supabase.from("user_module_access").insert(
      grants.map((grant) => ({
        user_id: userId,
        module_id: grant.moduleId,
        role_id: grant.roleId,
        granted_by: adminId,
      }))
    );
    if (error) throw error;
  }

  await supabase.from("user_profiles").update({ modules_configured: true }).eq("id", userId);
}

export async function approveMember(userId: string, grants?: ModuleGrant[]) {
  const admin = await requireApprovedAdmin();
  const supabase = await createClient();

  const resolved: ModuleGrant[] =
    grants && grants.length > 0
      ? grants
      : ALL_MODULES.map((moduleId) => ({ moduleId, roleId: "team_member" as RbacRoleId }));

  const { error } = await supabase
    .from("user_profiles")
    .update({
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: admin.id,
      rejection_reason: null,
    })
    .eq("id", userId);

  if (error) throw error;

  await replaceModuleGrants(userId, resolved, admin.id);

  await writeAuditLog({
    actorId: admin.id,
    targetUserId: userId,
    action: "user.approve",
    metadata: { grants: resolved },
  });

  await notifyMember(userId, "account_approved", {
    modules: resolved.map((g) => g.moduleId),
  });

  revalidatePath("/admin/members");
  return { success: true };
}

export async function rejectMember(userId: string, reason?: string) {
  const admin = await requireApprovedAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_profiles")
    .update({
      approval_status: "rejected",
      rejection_reason: reason?.trim() || "Access was not granted by an administrator.",
      approved_at: null,
      approved_by: null,
    })
    .eq("id", userId);

  if (error) throw error;

  await writeAuditLog({
    actorId: admin.id,
    targetUserId: userId,
    action: "user.reject",
    metadata: { reason: reason || null },
  });

  await notifyMember(userId, "account_rejected", { reason: reason || "" });

  revalidatePath("/admin/members");
  return { success: true };
}

export async function suspendMember(userId: string) {
  const admin = await requireApprovedAdmin();
  if (admin.id === userId) throw new Error("You cannot suspend your own account.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ approval_status: "suspended" })
    .eq("id", userId);

  if (error) throw error;

  await writeAuditLog({ actorId: admin.id, targetUserId: userId, action: "user.suspend" });
  await notifyMember(userId, "account_suspended", {});

  revalidatePath("/admin/members");
  return { success: true };
}

export async function setMemberRole(userId: string, role: "admin" | "manager" | "user") {
  const admin = await requireApprovedAdmin();
  if (admin.id === userId && role !== "admin") {
    throw new Error("You cannot remove your own administrator role.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").update({ role }).eq("id", userId);
  if (error) throw error;

  await writeAuditLog({
    actorId: admin.id,
    targetUserId: userId,
    action: "user.set_role",
    metadata: { role },
  });

  revalidatePath("/admin/members");
  return { success: true };
}

export async function setMemberModules(userId: string, grants: ModuleGrant[]) {
  const admin = await requireApprovedAdmin();
  await replaceModuleGrants(userId, grants, admin.id);

  await writeAuditLog({
    actorId: admin.id,
    targetUserId: userId,
    action: "user.set_modules",
    metadata: { grants },
  });

  revalidatePath("/admin/members");
  return { success: true };
}

/**
 * Removes every grant and marks the account rejected. The Supabase auth user is
 * left intact because deleting it requires a service-role key that the app does
 * not hold; this leaves the person unable to reach anything in the workspace.
 */
export async function removeMemberAccess(userId: string) {
  const admin = await requireApprovedAdmin();
  if (admin.id === userId) throw new Error("You cannot remove your own access.");

  const supabase = await createClient();
  await supabase.from("user_module_access").delete().eq("user_id", userId);

  const { error } = await supabase
    .from("user_profiles")
    .update({
      approval_status: "rejected",
      rejection_reason: "Access removed by an administrator.",
      modules_configured: true,
      role: "user",
    })
    .eq("id", userId);

  if (error) throw error;

  await writeAuditLog({ actorId: admin.id, targetUserId: userId, action: "user.remove_access" });

  revalidatePath("/admin/members");
  return { success: true };
}

export async function clearMemberLockout(email: string) {
  const admin = await requireApprovedAdmin();
  const supabase = await createClient();

  const { error } = await supabase.rpc("clear_account_lockout", { p_email: email });
  if (error) throw error;

  await writeAuditLog({
    actorId: admin.id,
    action: "user.clear_lockout",
    metadata: { email },
  });

  revalidatePath("/admin/members");
  return { success: true };
}

export interface MemberDetail {
  member: AdminMemberRow;
  securityEvents: Array<{
    id: string;
    type: string;
    browser: string | null;
    os: string | null;
    ip_address: string | null;
    is_suspicious: boolean;
    created_at: string;
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  lockedUntil: string | null;
}

export async function getMemberDetail(userId: string): Promise<MemberDetail> {
  await requireApprovedAdmin();
  const supabase = await createClient();

  const members = await listMembers();
  const member = members.find((m) => m.id === userId);
  if (!member) throw new Error("Member not found");

  const [{ data: events }, { data: audit }, { data: lockout }] = await Promise.all([
    supabase
      .from("security_events")
      .select("id, type, browser, os, ip_address, is_suspicious, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("audit_logs")
      .select("id, action, metadata, created_at")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("account_lockouts")
      .select("locked_until")
      .eq("email", member.email.toLowerCase())
      .maybeSingle(),
  ]);

  return {
    member,
    securityEvents: events || [],
    auditTrail: (audit || []) as MemberDetail["auditTrail"],
    lockedUntil: lockout?.locked_until ?? null,
  };
}

async function notifyMember(
  userId: string,
  template: "account_approved" | "account_rejected" | "account_suspended",
  payload: Record<string, string | string[]>
) {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email, first_name")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.email) return;

    await sendEmail({
      to: profile.email,
      template,
      payload: { name: profile.first_name || profile.email, ...payload },
    });
  } catch {
    // Email delivery is never allowed to fail an admin action
  }
}

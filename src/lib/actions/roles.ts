"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedAdmin } from "@/lib/rbac/access";
import { writeAuditLog } from "./admin";

export interface PermissionRow {
  id: string;
  module_id: string | null;
  action: string;
  description: string | null;
}

export interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  member_count: number;
}

export interface RoleMatrix {
  roles: RoleRow[];
  permissions: PermissionRow[];
  /** roleId -> set of permission ids, as an array for serialisation */
  assignments: Record<string, string[]>;
}

export async function getRoleMatrix(): Promise<RoleMatrix> {
  await requireApprovedAdmin();
  const supabase = await createClient();

  const [rolesResult, permissionsResult, assignmentsResult, usageResult] = await Promise.all([
    supabase.from("rbac_roles").select("id, name, description, is_system").order("name"),
    supabase.from("permissions").select("id, module_id, action, description").order("id"),
    supabase.from("role_permissions").select("role_id, permission_id"),
    supabase.from("user_module_access").select("role_id"),
  ]);

  if (rolesResult.error) throw rolesResult.error;
  if (permissionsResult.error) throw permissionsResult.error;

  const usage = new Map<string, number>();
  for (const row of usageResult.data || []) {
    usage.set(row.role_id, (usage.get(row.role_id) || 0) + 1);
  }

  const assignments: Record<string, string[]> = {};
  for (const row of assignmentsResult.data || []) {
    (assignments[row.role_id] ||= []).push(row.permission_id);
  }

  return {
    roles: (rolesResult.data || []).map((role) => ({
      ...role,
      member_count: usage.get(role.id) || 0,
    })),
    permissions: permissionsResult.data || [],
    assignments,
  };
}

export async function setRolePermission(
  roleId: string,
  permissionId: string,
  granted: boolean
) {
  const admin = await requireApprovedAdmin();
  if (roleId === "super_admin") {
    throw new Error("The Super Admin role always holds every permission.");
  }

  const supabase = await createClient();

  if (granted) {
    const { error } = await supabase
      .from("role_permissions")
      .upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: "role_id,permission_id" });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId)
      .eq("permission_id", permissionId);
    if (error) throw error;
  }

  await writeAuditLog({
    actorId: admin.id,
    action: granted ? "role.permission_granted" : "role.permission_revoked",
    resourceType: "role_permissions",
    resourceId: `${roleId}:${permissionId}`,
    metadata: { role: roleId, permission: permissionId },
  });

  revalidatePath("/admin/roles");
  return { success: true };
}

export async function createRole(input: {
  id: string;
  name: string;
  description?: string;
  copyFromRoleId?: string;
}) {
  const admin = await requireApprovedAdmin();
  const supabase = await createClient();

  const id = input.id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!id) throw new Error("Enter a valid role identifier.");

  const { error } = await supabase.from("rbac_roles").insert({
    id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    is_system: false,
  });

  if (error) {
    throw new Error(
      error.code === "23505" ? "A role with that identifier already exists." : error.message
    );
  }

  if (input.copyFromRoleId) {
    const { data: source } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .eq("role_id", input.copyFromRoleId);

    if (source && source.length > 0) {
      await supabase
        .from("role_permissions")
        .insert(source.map((row) => ({ role_id: id, permission_id: row.permission_id })));
    }
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "role.create",
    resourceType: "rbac_roles",
    resourceId: id,
    metadata: { name: input.name, copied_from: input.copyFromRoleId ?? null },
  });

  revalidatePath("/admin/roles");
  return { success: true, id };
}

export async function deleteRole(roleId: string) {
  const admin = await requireApprovedAdmin();
  const supabase = await createClient();

  const { data: role } = await supabase
    .from("rbac_roles")
    .select("is_system")
    .eq("id", roleId)
    .maybeSingle();

  if (!role) throw new Error("Role not found.");
  if (role.is_system) throw new Error("Built-in roles cannot be deleted.");

  const { count } = await supabase
    .from("user_module_access")
    .select("id", { count: "exact", head: true })
    .eq("role_id", roleId);

  if (count && count > 0) {
    throw new Error(`${count} member grant${count === 1 ? "" : "s"} still use this role.`);
  }

  const { error } = await supabase.from("rbac_roles").delete().eq("id", roleId);
  if (error) throw error;

  await writeAuditLog({
    actorId: admin.id,
    action: "role.delete",
    resourceType: "rbac_roles",
    resourceId: roleId,
  });

  revalidatePath("/admin/roles");
  return { success: true };
}

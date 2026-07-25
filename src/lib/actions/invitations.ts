"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedAdmin } from "@/lib/rbac/access";
import type { ModuleId, RbacRoleId } from "@/lib/rbac/types";
import { MODULE_LABELS } from "@/lib/rbac/types";
import { appUrl, sendEmail } from "@/lib/email/send";
import { writeAuditLog } from "./admin";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface InvitationRow {
  id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  role_id: RbacRoleId;
  module_ids: ModuleId[];
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  invited_by_name: string | null;
  invite_url: string;
}

export interface InvitationPreview {
  found: boolean;
  email?: string;
  status?: InvitationStatus;
  role_id?: RbacRoleId;
  module_ids?: ModuleId[];
  expired?: boolean;
  expires_at?: string;
}

function inviteUrlFor(token: string) {
  return `${appUrl()}/accept-invite?token=${token}`;
}

export async function listInvitations(): Promise<InvitationRow[]> {
  await requireApprovedAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, token, status, role_id, module_ids, expires_at, accepted_at, created_at, invited_by")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const inviterIds = Array.from(new Set((data || []).map((r) => r.invited_by).filter(Boolean)));
  const nameById = new Map<string, string>();

  if (inviterIds.length > 0) {
    const { data: inviters } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, email")
      .in("id", inviterIds);

    for (const inviter of inviters || []) {
      nameById.set(
        inviter.id,
        [inviter.first_name, inviter.last_name].filter(Boolean).join(" ").trim() || inviter.email
      );
    }
  }

  const now = Date.now();

  return (data || []).map((row) => ({
    id: row.id,
    email: row.email,
    token: row.token,
    status:
      row.status === "pending" && new Date(row.expires_at).getTime() < now
        ? "expired"
        : (row.status as InvitationStatus),
    role_id: row.role_id as RbacRoleId,
    module_ids: (row.module_ids || []) as ModuleId[],
    expires_at: row.expires_at,
    accepted_at: row.accepted_at,
    created_at: row.created_at,
    invited_by_name: nameById.get(row.invited_by) ?? null,
    invite_url: inviteUrlFor(row.token),
  }));
}

export async function createInvitation(input: {
  email: string;
  roleId: RbacRoleId;
  modules: ModuleId[];
}): Promise<{ invitation: InvitationRow; emailStatus: string }> {
  const admin = await requireApprovedAdmin();
  const supabase = await createClient();

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id, approval_status")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile && existingProfile.approval_status === "approved") {
    throw new Error("That person already has an active account.");
  }

  // Supersede any outstanding invitation for the same address
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("email", email)
    .eq("status", "pending");

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      email,
      role_id: input.roleId,
      module_ids: input.modules,
      invited_by: admin.id,
    })
    .select("id, email, token, status, role_id, module_ids, expires_at, accepted_at, created_at")
    .single();

  if (error) throw error;

  const inviterName =
    [admin.first_name, admin.last_name].filter(Boolean).join(" ").trim() || admin.email;

  const result = await sendEmail({
    to: email,
    template: "invitation",
    payload: {
      inviter: inviterName,
      inviteUrl: inviteUrlFor(data.token),
      modules: input.modules.map((m) => MODULE_LABELS[m]),
      expiresAt: new Date(data.expires_at).toLocaleDateString(),
    },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "invitation.create",
    resourceType: "invitations",
    resourceId: data.id,
    metadata: { email, role: input.roleId, modules: input.modules, email_status: result.status },
  });

  revalidatePath("/admin/invitations");

  return {
    invitation: {
      ...data,
      status: data.status as InvitationStatus,
      role_id: data.role_id as RbacRoleId,
      module_ids: (data.module_ids || []) as ModuleId[],
      invited_by_name: inviterName,
      invite_url: inviteUrlFor(data.token),
    },
    emailStatus: result.status,
  };
}

export async function resendInvitation(id: string): Promise<{ emailStatus: string }> {
  const admin = await requireApprovedAdmin();
  const supabase = await createClient();

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("invitations")
    .update({ status: "pending", expires_at: expiresAt })
    .eq("id", id)
    .select("id, email, token, module_ids, expires_at")
    .single();

  if (error) throw error;

  const inviterName =
    [admin.first_name, admin.last_name].filter(Boolean).join(" ").trim() || admin.email;

  const result = await sendEmail({
    to: data.email,
    template: "invitation_reminder",
    payload: {
      inviter: inviterName,
      inviteUrl: inviteUrlFor(data.token),
      modules: ((data.module_ids || []) as ModuleId[]).map((m) => MODULE_LABELS[m]),
      expiresAt: new Date(data.expires_at).toLocaleDateString(),
    },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "invitation.resend",
    resourceType: "invitations",
    resourceId: id,
    metadata: { email: data.email, email_status: result.status },
  });

  revalidatePath("/admin/invitations");
  return { emailStatus: result.status };
}

export async function revokeInvitation(id: string) {
  const admin = await requireApprovedAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", id);
  if (error) throw error;

  await writeAuditLog({
    actorId: admin.id,
    action: "invitation.revoke",
    resourceType: "invitations",
    resourceId: id,
  });

  revalidatePath("/admin/invitations");
  return { success: true };
}

/** Unauthenticated: used by the accept page to describe the invitation. */
export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
  if (!token) return { found: false };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invitation_preview", { p_token: token });

  if (error || !data) return { found: false };
  return data as InvitationPreview;
}

/** Called once the invited person has a session (password or Google). */
export async function redeemInvitation(
  token: string
): Promise<{ ok: boolean; error?: string; invitedEmail?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_invitation", { p_token: token });

  if (error) return { ok: false, error: error.message };

  const result = (data || {}) as Record<string, unknown>;
  if (!result.ok) {
    return {
      ok: false,
      error: String(result.error || "invalid_token"),
      invitedEmail: result.invited_email as string | undefined,
    };
  }

  return { ok: true };
}

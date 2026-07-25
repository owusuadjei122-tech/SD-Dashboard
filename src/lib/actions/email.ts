"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedAdmin } from "@/lib/rbac/access";
import {
  appUrl,
  emailFromAddress,
  isEmailProviderConfigured,
  resendOutboxEntry,
  sendEmail,
} from "@/lib/email/send";
import { writeAuditLog } from "./admin";

export interface OutboxRow {
  id: string;
  to_email: string;
  subject: string;
  template: string;
  status: string;
  provider: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface EmailSettings {
  configured: boolean;
  from: string | null;
  siteUrl: string;
  /** Resend's shared sandbox sender only delivers to your own account address. */
  usingSandboxSender: boolean;
}

export async function getEmailSettings(): Promise<EmailSettings> {
  await requireApprovedAdmin();
  const from = emailFromAddress();

  return {
    configured: isEmailProviderConfigured(),
    from,
    siteUrl: appUrl(),
    usingSandboxSender: Boolean(from && from.includes("resend.dev")),
  };
}

export async function listOutbox(limit = 100): Promise<OutboxRow[]> {
  await requireApprovedAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("email_outbox")
    .select("id, to_email, subject, template, status, provider, error, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function sendTestEmail(to: string): Promise<{ status: string; error?: string }> {
  const admin = await requireApprovedAdmin();

  const address = to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new Error("Enter a valid email address.");
  }

  const result = await sendEmail({
    to: address,
    template: "test",
    payload: {
      sender: [admin.first_name, admin.last_name].filter(Boolean).join(" ").trim() || admin.email,
    },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "email.test",
    resourceType: "email_outbox",
    metadata: { to: address, status: result.status },
  });

  revalidatePath("/admin/email");
  return { status: result.status, error: result.error };
}

export async function retryOutboxEntry(id: string): Promise<{ status: string; error?: string }> {
  const admin = await requireApprovedAdmin();
  const result = await resendOutboxEntry(id);

  await writeAuditLog({
    actorId: admin.id,
    action: "email.retry",
    resourceType: "email_outbox",
    resourceId: id,
    metadata: { status: result.status },
  });

  revalidatePath("/admin/email");
  return { status: result.status, error: result.error };
}

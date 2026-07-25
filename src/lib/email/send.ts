import { createClient } from "@/lib/supabase/server";
import { renderEmail, type EmailTemplate } from "./templates";

export interface SendEmailInput {
  to: string;
  template: EmailTemplate;
  payload?: Record<string, string | string[] | undefined>;
}

export interface SendEmailResult {
  status: "sent" | "queued" | "failed";
  provider: string | null;
  error?: string;
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export function isEmailProviderConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function emailFromAddress(): string | null {
  return process.env.EMAIL_FROM || null;
}

/** Posts a single message to Resend. Assumes the provider is configured. */
async function deliver(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: explainProviderError(response.status, body) };
    }

    const result = (await response.json()) as { id?: string };
    return { ok: true, id: result.id ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

/** Turns Resend's raw API errors into something an admin can act on. */
function explainProviderError(status: number, body: string): string {
  let message = body.slice(0, 400);
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message) message = parsed.message;
  } catch {
    // Keep the raw body
  }

  if (status === 403 && /only send testing emails/i.test(message)) {
    return "Blocked by Resend: the sandbox sender only delivers to your own Resend account address. Verify a domain at resend.com/domains and update EMAIL_FROM to email other people.";
  }
  if (status === 401 || status === 403) {
    return `Resend rejected the request: ${message}`;
  }
  if (status === 422) {
    return `Resend could not accept the message: ${message}`;
  }
  if (status === 429) {
    return "Resend rate limit reached. Retry in a moment.";
  }

  return `${status}: ${message}`;
}

/**
 * Sends through Resend when configured. Without a provider the message is still
 * recorded in `email_outbox` with status `queued`, so nothing is silently lost
 * and admins can see exactly what the platform tried to send.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const payload = { appUrl: appUrl(), ...(input.payload ?? {}) };
  const { subject, html, text } = renderEmail(input.template, payload);

  let outboxId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("email_outbox")
      .insert({
        to_email: input.to,
        subject,
        template: input.template,
        payload,
        status: "queued",
        provider: isEmailProviderConfigured() ? "resend" : null,
      })
      .select("id")
      .maybeSingle();
    outboxId = data?.id ?? null;
  } catch {
    // Outbox is best-effort; never block the action that triggered the email
  }

  if (!isEmailProviderConfigured()) {
    return { status: "queued", provider: null };
  }

  const result = await deliver({ to: input.to, subject, html, text });

  if (!result.ok) {
    await updateOutbox(outboxId, { status: "failed", error: result.error });
    return { status: "failed", provider: "resend", error: result.error };
  }

  await updateOutbox(outboxId, {
    status: "sent",
    provider: "resend",
    provider_message_id: result.id,
    error: null,
    sent_at: new Date().toISOString(),
  });

  return { status: "sent", provider: "resend" };
}

/** Re-renders a stored outbox row from its template and payload, then sends it. */
export async function resendOutboxEntry(id: string): Promise<SendEmailResult> {
  if (!isEmailProviderConfigured()) {
    return { status: "queued", provider: null, error: "No email provider configured." };
  }

  const supabase = await createClient();
  const { data: entry, error } = await supabase
    .from("email_outbox")
    .select("id, to_email, template, payload")
    .eq("id", id)
    .maybeSingle();

  if (error || !entry) {
    return { status: "failed", provider: "resend", error: "Message not found." };
  }

  const rendered = renderEmail(entry.template as EmailTemplate, {
    appUrl: appUrl(),
    ...((entry.payload || {}) as Record<string, string | string[]>),
  });

  const result = await deliver({
    to: entry.to_email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  if (!result.ok) {
    await updateOutbox(id, { status: "failed", error: result.error });
    return { status: "failed", provider: "resend", error: result.error };
  }

  await updateOutbox(id, {
    status: "sent",
    provider: "resend",
    provider_message_id: result.id,
    error: null,
    sent_at: new Date().toISOString(),
  });

  return { status: "sent", provider: "resend" };
}

async function updateOutbox(id: string | null, values: Record<string, unknown>) {
  if (!id) return;
  try {
    const supabase = await createClient();
    await supabase.from("email_outbox").update(values).eq("id", id);
  } catch {
    // Best-effort
  }
}

import { headers as nextHeaders } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { clientIpFromHeaders, deviceFingerprint, parseUserAgent } from "./device";

export type SecurityEventType =
  | "login"
  | "logout"
  | "password_change"
  | "password_reset_requested"
  | "mfa_enrolled"
  | "mfa_removed"
  | "session_revoked"
  | "invitation_accepted"
  | "login_blocked";

export interface RecordSecurityEventInput {
  userId: string;
  type: SecurityEventType;
  request?: Request;
  metadata?: Record<string, unknown>;
  forceSuspicious?: boolean;
}

async function resolveHeaders(request?: Request): Promise<Headers> {
  if (request) return request.headers;
  try {
    return (await nextHeaders()) as unknown as Headers;
  } catch {
    return new Headers();
  }
}

/**
 * Writes a security event and keeps the device list current. A sign-in from a
 * fingerprint we have never seen for this user is treated as suspicious and
 * triggers a notification email when the user has them enabled.
 */
export async function recordSecurityEvent(input: RecordSecurityEventInput) {
  try {
    const supabase = await createClient();
    const requestHeaders = await resolveHeaders(input.request);
    const userAgent = requestHeaders.get("user-agent");
    const ip = clientIpFromHeaders(requestHeaders);
    const device = parseUserAgent(userAgent);
    const fingerprint = deviceFingerprint(userAgent);

    let isNewDevice = false;

    if (input.type === "login") {
      const { data: known } = await supabase
        .from("user_devices")
        .select("id")
        .eq("user_id", input.userId)
        .eq("fingerprint", fingerprint)
        .maybeSingle();

      isNewDevice = !known;

      await supabase.from("user_devices").upsert(
        {
          user_id: input.userId,
          fingerprint,
          label: device.label,
          browser: device.browser,
          os: device.os,
          ip_address: ip,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "user_id,fingerprint" }
      );
    }

    const isSuspicious = input.forceSuspicious ?? (input.type === "login" && isNewDevice);

    await supabase.from("security_events").insert({
      user_id: input.userId,
      type: input.type,
      ip_address: ip,
      user_agent: userAgent,
      device: device.device,
      browser: device.browser,
      os: device.os,
      is_suspicious: isSuspicious,
      metadata: input.metadata ?? {},
    });

    if (input.type === "login" && isNewDevice) {
      await notifyNewLogin(input.userId, device.label, ip);
    }
  } catch {
    // Security logging must never break the flow that triggered it
  }
}

async function notifyNewLogin(userId: string, deviceLabel: string, ip: string | null) {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email, first_name, notify_on_new_login")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.email || profile.notify_on_new_login === false) return;

    await sendEmail({
      to: profile.email,
      template: "new_login",
      payload: {
        name: profile.first_name || profile.email,
        device: deviceLabel,
        when: new Date().toLocaleString(),
        ip: ip || "unknown",
      },
    });
  } catch {
    // Notification failures are non-blocking
  }
}

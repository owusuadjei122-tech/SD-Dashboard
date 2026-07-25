"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { clientIpFromHeaders } from "@/lib/security/device";
import { recordSecurityEvent } from "@/lib/security/events";

export interface LockoutState {
  locked: boolean;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
  reason?: string;
}

async function requestContext() {
  const h = await headers();
  return {
    ip: clientIpFromHeaders(h as unknown as Headers),
    userAgent: h.get("user-agent"),
  };
}

/** Called before a password sign-in attempt. Never throws. */
export async function checkLoginAllowed(email: string): Promise<LockoutState> {
  if (!email.trim()) return { locked: false };

  try {
    const supabase = await createClient();
    const { ip } = await requestContext();
    const { data, error } = await supabase.rpc("check_login_lockout", {
      p_email: email.trim(),
      p_ip: ip,
    });

    if (error || !data) return { locked: false };

    const result = data as Record<string, unknown>;
    return {
      locked: Boolean(result.locked),
      retryAfterSeconds: Number(result.retry_after_seconds) || undefined,
      remainingAttempts:
        result.remaining_attempts === undefined ? undefined : Number(result.remaining_attempts),
      reason: result.reason as string | undefined,
    };
  } catch {
    return { locked: false };
  }
}

/** Called after a sign-in attempt resolves, successful or not. Never throws. */
export async function registerLoginOutcome(
  email: string,
  success: boolean
): Promise<LockoutState> {
  try {
    const supabase = await createClient();
    const { ip, userAgent } = await requestContext();
    const { data, error } = await supabase.rpc("register_login_attempt", {
      p_email: email.trim(),
      p_success: success,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (error || !data) return { locked: false };

    const result = data as Record<string, unknown>;
    return {
      locked: Boolean(result.locked),
      retryAfterSeconds: Number(result.retry_after_seconds) || undefined,
      remainingAttempts:
        result.remaining_attempts === undefined ? undefined : Number(result.remaining_attempts),
    };
  } catch {
    return { locked: false };
  }
}

/**
 * Records a successful sign-in for the current session: refreshes last_login_at,
 * updates the device list and sends a new-device notification when needed.
 */
export async function recordSignIn(provider: "email" | "google" = "email") {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_profiles")
      .update({ last_login_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
      .eq("id", user.id);

    await recordSecurityEvent({ userId: user.id, type: "login", metadata: { provider } });
  } catch {
    // Non-blocking
  }
}

export async function recordSignOut() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await recordSecurityEvent({ userId: user.id, type: "logout" });
  } catch {
    // Non-blocking
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordSecurityEvent } from "@/lib/security/events";
import { parseUserAgent } from "@/lib/security/device";

export interface DeviceRow {
  id: string;
  label: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface SessionRow {
  id: string;
  created_at: string;
  updated_at: string | null;
  label: string;
  ip: string | null;
}

export interface SecurityEventRow {
  id: string;
  type: string;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  is_suspicious: boolean;
  created_at: string;
}

export interface SecurityOverview {
  devices: DeviceRow[];
  sessions: SessionRow[];
  sessionsSupported: boolean;
  events: SecurityEventRow[];
  mfaEnabled: boolean;
  notifyOnNewLogin: boolean;
  avatarPreference: "google" | "platform";
  hasGoogleAvatar: boolean;
  hasUploadedAvatar: boolean;
}

export async function getSecurityOverview(): Promise<SecurityOverview | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [devicesResult, eventsResult, profileResult, sessionsResult] = await Promise.all([
    supabase
      .from("user_devices")
      .select("id, label, browser, os, ip_address, first_seen_at, last_seen_at")
      .eq("user_id", user.id)
      .order("last_seen_at", { ascending: false }),
    supabase
      .from("security_events")
      .select("id, type, browser, os, ip_address, is_suspicious, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("user_profiles")
      .select("mfa_enabled, notify_on_new_login, avatar_source_preference, google_avatar_url, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.rpc("list_my_sessions"),
  ]);

  const sessions: SessionRow[] = (sessionsResult.data || []).map(
    (row: { id: string; created_at: string; updated_at: string | null; user_agent: string | null; ip: string | null }) => ({
      id: row.id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      label: parseUserAgent(row.user_agent).label,
      ip: row.ip,
    })
  );

  return {
    devices: devicesResult.data || [],
    sessions,
    sessionsSupported: !sessionsResult.error,
    events: eventsResult.data || [],
    mfaEnabled: Boolean(profileResult.data?.mfa_enabled),
    notifyOnNewLogin: profileResult.data?.notify_on_new_login !== false,
    avatarPreference:
      (profileResult.data?.avatar_source_preference as "google" | "platform") || "platform",
    hasGoogleAvatar: Boolean(profileResult.data?.google_avatar_url),
    hasUploadedAvatar: Boolean(profileResult.data?.avatar_url),
  };
}

export async function setNotifyOnNewLogin(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_profiles")
    .update({ notify_on_new_login: enabled })
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/settings");
  return { success: true };
}

export async function setAvatarPreference(preference: "google" | "platform") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_profiles")
    .update({ avatar_source_preference: preference })
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/settings");
  return { success: true };
}

/** Mirrors Supabase's MFA state onto the profile so admins can see it. */
export async function syncMfaState(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("user_profiles").update({ mfa_enabled: enabled }).eq("id", user.id);
  await recordSecurityEvent({
    userId: user.id,
    type: enabled ? "mfa_enrolled" : "mfa_removed",
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function revokeSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("revoke_my_session", { p_session_id: sessionId });
  if (error) throw error;

  await recordSecurityEvent({
    userId: user.id,
    type: "session_revoked",
    metadata: { session_id: sessionId },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function forgetDevice(deviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_devices")
    .delete()
    .eq("id", deviceId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/settings");
  return { success: true };
}

export async function recordPasswordChange() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await recordSecurityEvent({ userId: user.id, type: "password_change" });
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  tone: "info" | "success" | "warning";
}

const EVENT_COPY: Record<string, { title: string; tone: NotificationItem["tone"] }> = {
  login: { title: "New sign-in", tone: "info" },
  logout: { title: "Signed out", tone: "info" },
  password_change: { title: "Password changed", tone: "success" },
  mfa_enrolled: { title: "Two-factor authentication enabled", tone: "success" },
  mfa_removed: { title: "Two-factor authentication removed", tone: "warning" },
  session_revoked: { title: "Session revoked", tone: "info" },
  account_approved: { title: "Account approved", tone: "success" },
};

/**
 * Recent account activity for the header bell. Backed by `security_events`,
 * so it reflects real sign-ins and credential changes rather than a feed the
 * platform does not have yet.
 */
export async function listNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("security_events")
    .select("id, type, browser, os, ip_address, is_suspicious, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(15);

  if (error || !data) return [];

  return data.map((event) => {
    const copy = EVENT_COPY[event.type] ?? { title: "Account activity", tone: "info" as const };
    const where = [event.browser, event.os].filter(Boolean).join(" on ");
    const detail = [where, event.ip_address].filter(Boolean).join(" · ");

    return {
      id: event.id,
      title: event.is_suspicious ? `${copy.title} from a new device` : copy.title,
      message: detail || "No device details recorded.",
      createdAt: event.created_at,
      tone: event.is_suspicious ? "warning" : copy.tone,
    };
  });
}

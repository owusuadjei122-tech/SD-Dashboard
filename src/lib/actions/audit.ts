"use server";

import { createClient } from "@/lib/supabase/server";
import { requireApprovedAdmin } from "@/lib/rbac/access";

export interface AuditLogRow {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_name: string | null;
  actor_email: string | null;
  target_name: string | null;
  target_email: string | null;
}

export interface AuditQuery {
  search?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export interface AuditPage {
  rows: AuditLogRow[];
  total: number;
  actions: string[];
}

export async function listAuditLogs(query: AuditQuery = {}): Promise<AuditPage> {
  await requireApprovedAdmin();
  const supabase = await createClient();

  const limit = Math.min(query.limit ?? 50, 200);
  const offset = query.offset ?? 0;

  let request = supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, metadata, created_at, actor_id, target_user_id", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (query.action && query.action !== "all") {
    request = request.eq("action", query.action);
  }

  const { data, error, count } = await request;
  if (error) throw error;

  const ids = Array.from(
    new Set([
      ...(data || []).map((r) => r.actor_id),
      ...(data || []).map((r) => r.target_user_id),
    ])
  ).filter(Boolean) as string[];

  const people = new Map<string, { name: string; email: string }>();
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, email")
      .in("id", ids);

    for (const profile of profiles || []) {
      people.set(profile.id, {
        name:
          [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.email,
        email: profile.email,
      });
    }
  }

  let rows: AuditLogRow[] = (data || []).map((row) => ({
    id: row.id,
    action: row.action,
    resource_type: row.resource_type,
    resource_id: row.resource_id,
    metadata: (row.metadata || {}) as Record<string, unknown>,
    created_at: row.created_at,
    actor_name: row.actor_id ? (people.get(row.actor_id)?.name ?? null) : null,
    actor_email: row.actor_id ? (people.get(row.actor_id)?.email ?? null) : null,
    target_name: row.target_user_id ? (people.get(row.target_user_id)?.name ?? null) : null,
    target_email: row.target_user_id ? (people.get(row.target_user_id)?.email ?? null) : null,
  }));

  const search = query.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter((row) =>
      [row.action, row.actor_name, row.actor_email, row.target_name, row.target_email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }

  const { data: actionRows } = await supabase
    .from("audit_logs")
    .select("action")
    .order("action")
    .limit(500);

  const actions = Array.from(new Set((actionRows || []).map((r) => r.action))).sort();

  return { rows, total: count ?? rows.length, actions };
}

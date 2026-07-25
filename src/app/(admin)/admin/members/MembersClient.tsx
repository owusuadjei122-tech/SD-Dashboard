"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, ShieldCheck, UserCheck, UserPlus } from "lucide-react";
import {
  approveMember,
  type AdminMemberRow,
} from "@/lib/actions/admin";
import {
  displayName,
  resolveAvatar,
  MODULE_LABELS,
  type ApprovalStatus,
} from "@/lib/rbac/types";
import { Avatar, buttonPrimary, StatusPill } from "@/components/admin/primitives";
import { MemberDrawer } from "@/components/admin/MemberDrawer";
import { InviteMemberModal } from "@/components/admin/InviteMemberModal";

const STATUS_FILTERS: Array<ApprovalStatus | "all"> = [
  "all",
  "pending",
  "approved",
  "rejected",
  "suspended",
];

function relativeTime(value: string | null) {
  if (!value) return "Never";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-5 py-4 shadow-sm">
      <p className="text-[12px] font-medium uppercase tracking-wide text-[#86868b]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1d1d1f]">{value}</p>
    </div>
  );
}

export function MembersClient({
  initialMembers,
  schemaReady,
  currentAdminId,
}: {
  initialMembers: AdminMemberRow[];
  schemaReady: boolean;
  currentAdminId: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [status, setStatus] = useState<ApprovalStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (status !== "all" && m.approval_status !== status) return false;
      if (!q) return true;
      return displayName(m).toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [members, search, status]);

  const counts = useMemo(
    () => ({
      total: members.length,
      pending: members.filter((m) => m.approval_status === "pending").length,
      approved: members.filter((m) => m.approval_status === "approved").length,
      admins: members.filter((m) => m.role === "admin").length,
    }),
    [members]
  );

  const applyUpdate = (updates: Partial<AdminMemberRow> & { id: string }) => {
    setMembers((prev) => prev.map((m) => (m.id === updates.id ? { ...m, ...updates } : m)));
  };

  const quickApprove = (member: AdminMemberRow) => {
    setError(null);
    startTransition(async () => {
      try {
        await approveMember(member.id);
        applyUpdate({ id: member.id, approval_status: "approved" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not approve this member.");
      }
    });
  };

  const selected = members.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Members" value={counts.total} />
        <Stat label="Awaiting approval" value={counts.pending} />
        <Stat label="Active" value={counts.approved} />
        <Stat label="Administrators" value={counts.admins} />
      </div>

      {!schemaReady && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Some access-control tables are missing. Run the migrations in{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[12px]">supabase/migrations</code>{" "}
          in the Supabase SQL Editor.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-black/[0.06] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-black/[0.06] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="h-10 w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] pl-10 pr-3 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatus(filter)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold capitalize transition ${
                  status === filter
                    ? "bg-[#1d1d1f] text-white"
                    : "bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.06]"
                }`}
              >
                {filter}
                {filter === "pending" && counts.pending > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-400/90 px-1.5 text-[10px] text-amber-950">
                    {counts.pending}
                  </span>
                )}
              </button>
            ))}
            <button type="button" onClick={() => setInviteOpen(true)} className={buttonPrimary}>
              <UserPlus className="h-4 w-4" />
              Invite
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fafafa] text-[12px] uppercase tracking-wide text-[#86868b]">
              <tr>
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Modules</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Last active</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#86868b]">
                    No members match this filter.
                  </td>
                </tr>
              )}

              {filtered.map((member) => {
                const name = displayName(member);
                return (
                  <tr
                    key={member.id}
                    onClick={() => setSelectedId(member.id)}
                    className="cursor-pointer border-t border-black/[0.04] transition hover:bg-[#fafafa]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={resolveAvatar(member)} name={name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#1d1d1f]">{name}</p>
                          <p className="truncate text-[13px] text-[#86868b]">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={member.approval_status} />
                    </td>
                    <td className="px-5 py-4">
                      {member.role === "admin" ? (
                        <span className="text-[13px] text-[#86868b]">All (admin)</span>
                      ) : !member.modules_configured ? (
                        <span className="text-[13px] text-[#86868b]">All (default)</span>
                      ) : member.modules.length === 0 ? (
                        <span className="text-[13px] text-[#86868b]">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {member.modules.map((moduleId) => (
                            <span
                              key={moduleId}
                              className="rounded-md bg-[#f5f5f7] px-2 py-0.5 text-[11px] font-medium text-[#424245]"
                              title={MODULE_LABELS[moduleId]}
                            >
                              {MODULE_LABELS[moduleId].replace("SelfDiscovery ", "")}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 capitalize text-[#424245]">
                        {member.role === "admin" && (
                          <ShieldCheck className="h-3.5 w-3.5 text-[#0071e3]" />
                        )}
                        {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#86868b]">
                      {relativeTime(member.last_login_at)}
                    </td>
                    <td className="px-5 py-4 text-[#86868b]">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {member.approval_status === "pending" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={(e) => {
                            e.stopPropagation();
                            quickApprove(member);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      ) : (
                        <span className="text-[12px] font-medium text-[#0071e3]">Manage</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <MemberDrawer
        member={selected}
        isSelf={selected?.id === currentAdminId}
        onClose={() => setSelectedId(null)}
        onChanged={applyUpdate}
      />

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

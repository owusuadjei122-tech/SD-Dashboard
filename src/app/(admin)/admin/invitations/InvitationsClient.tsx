"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Copy, RefreshCw, Search, UserPlus, XCircle } from "lucide-react";
import {
  resendInvitation,
  revokeInvitation,
  type InvitationRow,
  type InvitationStatus,
} from "@/lib/actions/invitations";
import { MODULE_LABELS } from "@/lib/rbac/types";
import { buttonPrimary, StatusPill } from "@/components/admin/primitives";
import { InviteMemberModal } from "@/components/admin/InviteMemberModal";

const FILTERS: Array<InvitationStatus | "all"> = [
  "all",
  "pending",
  "accepted",
  "expired",
  "revoked",
];

export function InvitationsClient({
  initialInvitations,
  emailConfigured,
}: {
  initialInvitations: InvitationRow[];
  emailConfigured: boolean;
}) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [status, setStatus] = useState<InvitationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invitations.filter((invite) => {
      if (status !== "all" && invite.status !== status) return false;
      return !q || invite.email.toLowerCase().includes(q);
    });
  }, [invitations, search, status]);

  const copy = async (invite: InvitationRow) => {
    try {
      await navigator.clipboard.writeText(invite.invite_url);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy the link. Select it manually and copy instead.");
    }
  };

  const run = (fn: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      {!emailConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          No email provider is configured, so invitations are created but not delivered. Copy the
          link from each row and send it yourself, or set{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[12px]">RESEND_API_KEY</code> and{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[12px]">EMAIL_FROM</code> in your
          environment.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      <div className="rounded-3xl border border-black/[0.06] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-black/[0.06] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email"
              className="h-10 w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] pl-10 pr-3 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => (
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
                <th className="px-5 py-3 font-semibold">Invitee</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Modules</th>
                <th className="px-5 py-3 font-semibold">Invited by</th>
                <th className="px-5 py-3 font-semibold">Expires</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#86868b]">
                    No invitations yet. Invite someone to get started.
                  </td>
                </tr>
              )}

              {filtered.map((invite) => (
                <tr key={invite.id} className="border-t border-black/[0.04]">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#1d1d1f]">{invite.email}</p>
                    <p className="text-[13px] capitalize text-[#86868b]">
                      {invite.role_id.replace(/_/g, " ")}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={invite.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {invite.module_ids.length === 0 ? (
                        <span className="text-[13px] text-[#86868b]">None</span>
                      ) : (
                        invite.module_ids.map((moduleId) => (
                          <span
                            key={moduleId}
                            className="rounded-md bg-[#f5f5f7] px-2 py-0.5 text-[11px] font-medium text-[#424245]"
                          >
                            {MODULE_LABELS[moduleId]?.replace("SelfDiscovery ", "") ?? moduleId}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#424245]">{invite.invited_by_name || "—"}</td>
                  <td className="px-5 py-4 text-[#86868b]">
                    {invite.accepted_at
                      ? `Accepted ${new Date(invite.accepted_at).toLocaleDateString()}`
                      : new Date(invite.expires_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copy(invite)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#f5f5f7] px-2.5 py-1.5 text-[12px] font-semibold text-[#424245] transition hover:bg-black/[0.06]"
                      >
                        {copiedId === invite.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copiedId === invite.id ? "Copied" : "Link"}
                      </button>

                      {invite.status !== "accepted" && (
                        <>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              run(async () => {
                                const result = await resendInvitation(invite.id);
                                setInvitations((prev) =>
                                  prev.map((row) =>
                                    row.id === invite.id
                                      ? {
                                          ...row,
                                          status: "pending",
                                          expires_at: new Date(
                                            Date.now() + 7 * 24 * 60 * 60 * 1000
                                          ).toISOString(),
                                        }
                                      : row
                                  )
                                );
                                setNotice(
                                  result.emailStatus === "sent"
                                    ? `Invitation re-sent to ${invite.email}.`
                                    : `Invitation renewed. Copy the link to share it with ${invite.email}.`
                                );
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-[#f5f5f7] px-2.5 py-1.5 text-[12px] font-semibold text-[#424245] transition hover:bg-black/[0.06] disabled:opacity-50"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Resend
                          </button>

                          {invite.status !== "revoked" && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                run(async () => {
                                  await revokeInvitation(invite.id);
                                  setInvitations((prev) =>
                                    prev.map((row) =>
                                      row.id === invite.id ? { ...row, status: "revoked" } : row
                                    )
                                  );
                                  setNotice(`Invitation for ${invite.email} revoked.`);
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[12px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Revoke
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={(invitation) => setInvitations((prev) => [invitation, ...prev])}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertTriangle,
  Ban,
  KeyRound,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  approveMember,
  clearMemberLockout,
  getMemberDetail,
  rejectMember,
  removeMemberAccess,
  setMemberModules,
  setMemberRole,
  suspendMember,
  type AdminMemberRow,
  type MemberDetail,
} from "@/lib/actions/admin";
import {
  displayName,
  resolveAvatar,
  MODULE_LABELS,
  PLATFORM_ROLES,
  type ModuleId,
} from "@/lib/rbac/types";
import {
  Avatar,
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  Drawer,
  inputClass,
  StatusPill,
} from "./primitives";
import { ModuleAccessEditor, type ModuleGrantDraft } from "./ModuleAccessEditor";

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-black/[0.06] pt-5">
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#86868b]">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function MemberDrawer({
  member,
  onClose,
  onChanged,
  isSelf,
}: {
  member: AdminMemberRow | null;
  onClose: () => void;
  onChanged: (updates: Partial<AdminMemberRow> & { id: string }) => void;
  isSelf: boolean;
}) {
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [grants, setGrants] = useState<ModuleGrantDraft[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!member) {
      setDetail(null);
      return;
    }

    setError(null);
    setNotice(null);
    setShowReject(false);
    setRejectReason("");
    setGrants(member.grants.map((g) => ({ moduleId: g.moduleId, roleId: g.roleId })));

    let cancelled = false;
    getMemberDetail(member.id)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });

    return () => {
      cancelled = true;
    };
  }, [member]);

  if (!member) return null;

  const name = displayName(member);
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

  const modulesSummary = member.modules_configured
    ? grants.length > 0
      ? grants.map((g) => MODULE_LABELS[g.moduleId]).join(", ")
      : "No modules"
    : "All modules (not yet configured)";

  return (
    <Drawer
      open
      onClose={onClose}
      title={name}
      subtitle={member.email}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-[#86868b]">{modulesSummary}</p>
          <button
            type="button"
            disabled={pending}
            className={buttonPrimary}
            onClick={() =>
              run(async () => {
                await setMemberModules(member.id, grants);
                onChanged({
                  id: member.id,
                  grants,
                  modules: grants.map((g) => g.moduleId) as ModuleId[],
                  modules_configured: true,
                });
                setNotice("Module access saved.");
              })
            }
          >
            Save module access
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar src={resolveAvatar(member)} name={name} size={56} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={member.approval_status} />
              {member.role === "admin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0071e3]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0071e3]">
                  <ShieldCheck className="h-3 w-3" />
                  Administrator
                </span>
              )}
              {member.mfa_enabled && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                  2FA on
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[13px] capitalize text-[#86868b]">
              Signed up with {member.auth_provider} · Joined{" "}
              {new Date(member.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}
        {member.rejection_reason && member.approval_status === "rejected" && (
          <p className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-4 py-3 text-[13px] text-[#424245]">
            <span className="font-medium">Reason given:</span> {member.rejection_reason}
          </p>
        )}
        {detail?.lockedUntil && new Date(detail.lockedUntil) > new Date() && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Locked out until {formatDate(detail.lockedUntil)}
            </span>
            <button
              type="button"
              disabled={pending}
              className="font-semibold underline underline-offset-2"
              onClick={() =>
                run(async () => {
                  await clearMemberLockout(member.email);
                  setDetail((prev) => (prev ? { ...prev, lockedUntil: null } : prev));
                  setNotice("Lockout cleared.");
                })
              }
            >
              Clear lockout
            </button>
          </div>
        )}

        <Section title="Approval">
          <div className="flex flex-wrap gap-2">
            {member.approval_status !== "approved" && (
              <button
                type="button"
                disabled={pending}
                className={buttonPrimary}
                onClick={() =>
                  run(async () => {
                    await approveMember(member.id, grants.length > 0 ? grants : undefined);
                    onChanged({ id: member.id, approval_status: "approved" });
                    setNotice("Member approved and notified.");
                  })
                }
              >
                <UserCheck className="h-4 w-4" />
                Approve
              </button>
            )}

            {member.approval_status !== "rejected" && (
              <button
                type="button"
                disabled={pending || isSelf}
                className={buttonSecondary}
                onClick={() => setShowReject((v) => !v)}
              >
                <UserX className="h-4 w-4" />
                Reject
              </button>
            )}

            {member.approval_status === "approved" && (
              <button
                type="button"
                disabled={pending || isSelf}
                className={buttonSecondary}
                onClick={() =>
                  run(async () => {
                    await suspendMember(member.id);
                    onChanged({ id: member.id, approval_status: "suspended" });
                    setNotice("Member suspended.");
                  })
                }
              >
                <Ban className="h-4 w-4" />
                Suspend
              </button>
            )}
          </div>

          {showReject && (
            <div className="mt-3 space-y-2">
              <label htmlFor="reason" className="text-[13px] font-medium text-[#1d1d1f]">
                Reason (included in the email)
              </label>
              <input
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Not a member of this organisation"
                className={inputClass}
              />
              <button
                type="button"
                disabled={pending}
                className={buttonDanger}
                onClick={() =>
                  run(async () => {
                    await rejectMember(member.id, rejectReason);
                    onChanged({ id: member.id, approval_status: "rejected" });
                    setShowReject(false);
                    setNotice("Member rejected and notified.");
                  })
                }
              >
                Confirm rejection
              </button>
            </div>
          )}
        </Section>

        <Section title="Platform role">
          <div className="flex flex-wrap gap-2">
            {PLATFORM_ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                disabled={pending || (isSelf && role.id !== "admin")}
                onClick={() =>
                  run(async () => {
                    await setMemberRole(member.id, role.id);
                    onChanged({ id: member.id, role: role.id });
                    setNotice(`Role set to ${role.name}.`);
                  })
                }
                className={`rounded-xl px-3.5 py-2 text-[13px] font-medium transition ${
                  member.role === role.id
                    ? "bg-[#1d1d1f] text-white"
                    : "bg-white text-[#424245] ring-1 ring-inset ring-black/[0.08] hover:bg-black/[0.03]"
                } disabled:opacity-50`}
              >
                {role.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-[#86868b]">
            Administrators can reach every module and this console regardless of the grants below.
          </p>
        </Section>

        <Section title="Module access">
          {!member.modules_configured && (
            <p className="mb-3 rounded-xl border border-black/[0.06] bg-[#fafafa] px-3.5 py-2.5 text-[12px] text-[#424245]">
              This account has never had modules configured, so it currently sees everything.
              Saving below applies an explicit grant.
            </p>
          )}
          <ModuleAccessEditor grants={grants} onChange={setGrants} disabled={pending} />
        </Section>

        <Section title="Recent security activity">
          {detail?.securityEvents.length ? (
            <ul className="space-y-2">
              {detail.securityEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-black/[0.06] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium capitalize text-[#1d1d1f]">
                      {event.type.replace(/_/g, " ")}
                      {event.is_suspicious && (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                          New device
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-[#86868b]">
                      {[event.browser, event.os, event.ip_address].filter(Boolean).join(" · ") ||
                        "Unknown device"}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] text-[#86868b]">
                    {new Date(event.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#86868b]">No sign-in activity recorded yet.</p>
          )}
        </Section>

        <Section title="Account trail">
          {detail?.auditTrail.length ? (
            <ul className="space-y-1.5">
              {detail.auditTrail.map((entry) => (
                <li key={entry.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-[#424245]">{entry.action.replace(/[._]/g, " ")}</span>
                  <span className="shrink-0 text-[12px] text-[#86868b]">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-[#86868b]">Nothing recorded yet.</p>
          )}
        </Section>

        <Section title="Details">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            <div>
              <dt className="text-[#86868b]">Last sign-in</dt>
              <dd className="mt-0.5 text-[#1d1d1f]">{formatDate(member.last_login_at)}</dd>
            </div>
            <div>
              <dt className="text-[#86868b]">Department</dt>
              <dd className="mt-0.5 text-[#1d1d1f]">{member.department || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#86868b]">Two-factor</dt>
              <dd className="mt-0.5 text-[#1d1d1f]">
                {member.mfa_enabled ? "Enabled" : "Not enabled"}
              </dd>
            </div>
            <div>
              <dt className="text-[#86868b]">Sign-in method</dt>
              <dd className="mt-0.5 capitalize text-[#1d1d1f]">{member.auth_provider}</dd>
            </div>
          </dl>
        </Section>

        {!isSelf && (
          <Section title="Danger zone">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={pending}
                className={buttonDanger}
                onClick={() =>
                  run(async () => {
                    await removeMemberAccess(member.id);
                    onChanged({
                      id: member.id,
                      approval_status: "rejected",
                      grants: [],
                      modules: [],
                      modules_configured: true,
                      role: "user",
                    });
                    setGrants([]);
                    setNotice("All access removed.");
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
                Remove all access
              </button>
              <button
                type="button"
                disabled={pending}
                className={buttonSecondary}
                onClick={() =>
                  run(async () => {
                    await clearMemberLockout(member.email);
                    setNotice("Failed sign-in attempts cleared.");
                  })
                }
              >
                <KeyRound className="h-4 w-4" />
                Reset failed attempts
              </button>
            </div>
            <p className="mt-2 text-[12px] text-[#86868b]">
              Removing access revokes every module and marks the account rejected. The person keeps
              their sign-in credentials but cannot open anything.
            </p>
          </Section>
        )}
      </div>
    </Drawer>
  );
}

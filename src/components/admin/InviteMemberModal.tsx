"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { createInvitation, type InvitationRow } from "@/lib/actions/invitations";
import { ALL_MODULES, MODULE_ROLES, type ModuleId, type RbacRoleId } from "@/lib/rbac/types";
import { buttonPrimary, buttonSecondary, inputClass, Modal } from "./primitives";
import { ModuleAccessEditor, type ModuleGrantDraft } from "./ModuleAccessEditor";

export function InviteMemberModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (invitation: InvitationRow) => void;
}) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<RbacRoleId>("team_member");
  const [grants, setGrants] = useState<ModuleGrantDraft[]>(
    ALL_MODULES.map((moduleId) => ({ moduleId, roleId: "team_member" as RbacRoleId }))
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ invitation: InvitationRow; emailStatus: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setEmail("");
    setRoleId("team_member");
    setGrants(ALL_MODULES.map((moduleId) => ({ moduleId, roleId: "team_member" as RbacRoleId })));
    setError(null);
    setResult(null);
    setCopied(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const created = await createInvitation({
          email,
          roleId,
          modules: grants.map((g) => g.moduleId) as ModuleId[],
        });
        setResult(created);
        onCreated?.(created.invitation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the invitation.");
      }
    });
  };

  const copyLink = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.invitation.invite_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={result ? "Invitation created" : "Invite a member"}
      subtitle={
        result
          ? result.emailStatus === "sent"
            ? "The invitation email is on its way."
            : "Share this link with them directly."
          : "They will be approved automatically when they accept."
      }
    >
      {result ? (
        <div className="space-y-4">
          {result.emailStatus !== "sent" && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              No email provider is configured, so nothing was delivered. Copy the link below and
              send it yourself. Set <code className="font-mono text-[12px]">RESEND_API_KEY</code>{" "}
              and <code className="font-mono text-[12px]">EMAIL_FROM</code> to send automatically.
            </p>
          )}

          <div className="flex items-center gap-2">
            <input readOnly value={result.invitation.invite_url} className={`${inputClass} font-mono text-[12px]`} />
            <button type="button" onClick={copyLink} className={buttonSecondary}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="text-[13px] text-[#86868b]">
            Invitation for <span className="font-medium text-[#1d1d1f]">{result.invitation.email}</span>{" "}
            expires {new Date(result.invitation.expires_at).toLocaleDateString()}.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={reset} className={buttonSecondary}>
              Invite someone else
            </button>
            <button type="button" onClick={close} className={buttonPrimary}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="inviteEmail" className="text-[13px] font-medium text-[#1d1d1f]">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
              <input
                id="inviteEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[13px] font-medium text-[#1d1d1f]">Role in each module</span>
            <div className="flex flex-wrap gap-1.5">
              {MODULE_ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  title={role.description}
                  onClick={() => {
                    setRoleId(role.id);
                    setGrants((prev) => prev.map((g) => ({ ...g, roleId: role.id })));
                  }}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                    roleId === role.id
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-white text-[#424245] ring-1 ring-inset ring-black/[0.08] hover:bg-black/[0.03]"
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[13px] font-medium text-[#1d1d1f]">Modules</span>
            <ModuleAccessEditor
              grants={grants}
              onChange={setGrants}
              disabled={pending}
              singleRole={roleId}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className={buttonSecondary}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || grants.length === 0}
              className={buttonPrimary}
            >
              {pending ? "Sending..." : "Send invitation"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

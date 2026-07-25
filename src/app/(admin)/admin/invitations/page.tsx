import { listInvitations, type InvitationRow } from "@/lib/actions/invitations";
import { isEmailProviderConfigured } from "@/lib/email/send";
import { InvitationsClient } from "./InvitationsClient";

export const dynamic = "force-dynamic";

export default async function AdminInvitationsPage() {
  let invitations: InvitationRow[] = [];
  let loadError: string | null = null;

  try {
    invitations = await listInvitations();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load invitations.";
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        {loadError} Run{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[12px]">
          supabase/migrations/00000000000005_security_and_invitations.sql
        </code>{" "}
        if you have not applied it yet.
      </div>
    );
  }

  return (
    <InvitationsClient
      initialInvitations={invitations}
      emailConfigured={isEmailProviderConfigured()}
    />
  );
}

import { getAccessProfile } from "@/lib/rbac/access";
import { getEmailSettings, listOutbox, type OutboxRow } from "@/lib/actions/email";
import { EmailClient } from "./EmailClient";

export const dynamic = "force-dynamic";

export default async function AdminEmailPage() {
  const profile = await getAccessProfile();
  const settings = await getEmailSettings();

  let outbox: OutboxRow[] = [];
  let loadError: string | null = null;

  try {
    outbox = await listOutbox();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load the outbox.";
  }

  return (
    <div className="space-y-4">
      {loadError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {loadError} Run{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-[12px]">
            supabase/migrations/00000000000005_security_and_invitations.sql
          </code>{" "}
          if you have not applied it yet.
        </div>
      )}
      <EmailClient
        settings={settings}
        initialOutbox={outbox}
        adminEmail={profile?.email ?? ""}
      />
    </div>
  );
}

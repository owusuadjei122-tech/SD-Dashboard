import { listAuditLogs } from "@/lib/actions/audit";
import { AuditClient } from "./AuditClient";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  try {
    const initialPage = await listAuditLogs({ limit: 50 });
    return <AuditClient initialPage={initialPage} />;
  } catch (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        {error instanceof Error ? error.message : "Could not load the audit log."}
      </div>
    );
  }
}

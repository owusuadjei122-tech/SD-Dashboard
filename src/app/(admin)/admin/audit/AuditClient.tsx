"use client";

import { useState, useTransition } from "react";
import { Download, Search } from "lucide-react";
import { listAuditLogs, type AuditLogRow, type AuditPage } from "@/lib/actions/audit";
import { buttonSecondary } from "@/components/admin/primitives";

const PAGE_SIZE = 50;

function actionTone(action: string) {
  if (/(reject|revoke|suspend|remove|delete|blocked)/.test(action)) {
    return "bg-rose-50 text-rose-800 ring-rose-200";
  }
  if (/(approve|create|accept|grant)/.test(action)) {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function summarise(row: AuditLogRow) {
  const metadata = row.metadata || {};
  const parts: string[] = [];

  if (typeof metadata.role === "string") parts.push(`role: ${metadata.role}`);
  if (typeof metadata.reason === "string" && metadata.reason) parts.push(`reason: ${metadata.reason}`);
  if (typeof metadata.email === "string") parts.push(metadata.email);
  if (Array.isArray(metadata.modules)) parts.push(`modules: ${metadata.modules.join(", ")}`);
  if (Array.isArray(metadata.grants)) {
    parts.push(
      `modules: ${(metadata.grants as Array<{ moduleId: string }>).map((g) => g.moduleId).join(", ") || "none"}`
    );
  }
  if (typeof metadata.permission === "string") parts.push(metadata.permission);

  return parts.join(" · ");
}

export function AuditClient({ initialPage }: { initialPage: AuditPage }) {
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = (nextOffset: number, nextAction = action, nextSearch = search) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await listAuditLogs({
          offset: nextOffset,
          limit: PAGE_SIZE,
          action: nextAction,
          search: nextSearch,
        });
        setPage(result);
        setOffset(nextOffset);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load the audit log.");
      }
    });
  };

  const exportCsv = () => {
    const header = ["Time", "Action", "Actor", "Target", "Details"];
    const lines = page.rows.map((row) =>
      [
        new Date(row.created_at).toISOString(),
        row.action,
        row.actor_email || "",
        row.target_email || "",
        summarise(row),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-black/[0.06] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-black/[0.06] p-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(0);
            }}
            className="relative max-w-md flex-1"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by person or action"
              className="h-10 w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] pl-10 pr-3 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/15"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                load(0, e.target.value);
              }}
              className="h-10 rounded-xl border border-black/[0.08] bg-white px-3 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/15"
            >
              <option value="all">All actions</option>
              {page.actions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <button type="button" onClick={exportCsv} className={buttonSecondary}>
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fafafa] text-[12px] uppercase tracking-wide text-[#86868b]">
              <tr>
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Performed by</th>
                <th className="px-5 py-3 font-semibold">Target</th>
                <th className="px-5 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {page.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#86868b]">
                    Nothing recorded yet.
                  </td>
                </tr>
              )}

              {page.rows.map((row) => (
                <tr key={row.id} className="border-t border-black/[0.04]">
                  <td className="whitespace-nowrap px-5 py-4 text-[#86868b]">
                    {new Date(row.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${actionTone(row.action)}`}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[#1d1d1f]">{row.actor_name || "System"}</p>
                    {row.actor_email && (
                      <p className="text-[12px] text-[#86868b]">{row.actor_email}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[#1d1d1f]">{row.target_name || "—"}</p>
                    {row.target_email && (
                      <p className="text-[12px] text-[#86868b]">{row.target_email}</p>
                    )}
                  </td>
                  <td className="max-w-xs px-5 py-4 text-[13px] text-[#424245]">
                    {summarise(row) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-4 text-[13px] text-[#86868b]">
          <span>
            {page.total === 0
              ? "No entries"
              : `Showing ${offset + 1}–${Math.min(offset + page.rows.length, page.total)} of ${page.total}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || offset === 0}
              onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
              className={buttonSecondary}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pending || offset + PAGE_SIZE >= page.total}
              onClick={() => load(offset + PAGE_SIZE)}
              className={buttonSecondary}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Send } from "lucide-react";
import {
  listOutbox,
  retryOutboxEntry,
  sendTestEmail,
  type EmailSettings,
  type OutboxRow,
} from "@/lib/actions/email";
import { buttonPrimary, buttonSecondary, inputClass } from "@/components/admin/primitives";

function statusStyles(status: string) {
  switch (status) {
    case "sent":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "failed":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    default:
      return "bg-amber-50 text-amber-800 ring-amber-200";
  }
}

export function EmailClient({
  settings,
  initialOutbox,
  adminEmail,
}: {
  settings: EmailSettings;
  initialOutbox: OutboxRow[];
  adminEmail: string;
}) {
  const [outbox, setOutbox] = useState(initialOutbox);
  const [testTo, setTestTo] = useState(adminEmail);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = async () => {
    try {
      setOutbox(await listOutbox());
    } catch {
      // Leave the current list in place
    }
  };

  const run = (fn: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  const failedCount = outbox.filter((row) => row.status === "failed").length;
  const queuedCount = outbox.filter((row) => row.status === "queued").length;

  return (
    <div className="space-y-4">
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

      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Delivery provider</h2>
            <p className="mt-1 text-[13px] text-[#86868b]">
              Transactional email for approvals, invitations, and security alerts.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 ring-inset ${
              settings.configured
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-amber-50 text-amber-800 ring-amber-200"
            }`}
          >
            {settings.configured ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {settings.configured ? "Resend connected" : "Not configured"}
          </span>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-[#86868b]">
              From address
            </dt>
            <dd className="mt-1 text-[14px] text-[#1d1d1f]">
              {settings.from || "Not set (EMAIL_FROM)"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-[#86868b]">
              Links point to
            </dt>
            <dd className="mt-1 text-[14px] text-[#1d1d1f]">{settings.siteUrl}</dd>
          </div>
        </dl>

        {!settings.configured && (
          <div className="mt-5 rounded-xl border border-black/[0.06] bg-[#fafafa] px-4 py-4 text-[13px] leading-relaxed text-[#424245]">
            <p className="font-medium text-[#1d1d1f]">To turn delivery on</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>
                Create an API key at{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[#0071e3] hover:underline"
                >
                  resend.com/api-keys
                </a>
              </li>
              <li>
                Add <code className="font-mono text-[12px]">RESEND_API_KEY</code> and{" "}
                <code className="font-mono text-[12px]">EMAIL_FROM</code> to{" "}
                <code className="font-mono text-[12px]">.env.local</code>
              </li>
              <li>Restart the dev server, then send a test message below</li>
            </ol>
          </div>
        )}

        {settings.usingSandboxSender && (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            You are sending from Resend&apos;s shared sandbox address. It only delivers to the email
            you signed up to Resend with. Verify your own domain to reach real members.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Send a test message</h2>
        <p className="mt-1 text-[13px] text-[#86868b]">
          Confirms the key, the from address, and that mail is actually arriving.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="you@company.com"
            className={`${inputClass} max-w-xs`}
          />
          <button
            type="button"
            disabled={pending}
            className={buttonPrimary}
            onClick={() =>
              run(async () => {
                const result = await sendTestEmail(testTo);
                await refresh();
                if (result.status === "sent") {
                  setNotice(`Test message delivered to ${testTo}. Check the inbox and spam folder.`);
                } else if (result.status === "queued") {
                  setNotice(
                    "Recorded in the outbox, but no provider is configured so nothing was delivered."
                  );
                } else {
                  setError(result.error || "Resend rejected the message.");
                }
              })
            }
          >
            <Send className="h-4 w-4" />
            Send test
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-black/[0.06] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Outbox</h2>
            <p className="mt-0.5 text-[13px] text-[#86868b]">
              Every message the platform has tried to send.
              {failedCount > 0 && ` ${failedCount} failed.`}
              {queuedCount > 0 && ` ${queuedCount} never delivered.`}
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(refresh)}
            className={buttonSecondary}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fafafa] text-[12px] uppercase tracking-wide text-[#86868b]">
              <tr>
                <th className="px-5 py-3 font-semibold">Recipient</th>
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {outbox.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#86868b]">
                    No messages yet.
                  </td>
                </tr>
              )}

              {outbox.map((row) => (
                <tr key={row.id} className="border-t border-black/[0.04] align-top">
                  <td className="px-5 py-4 text-[#1d1d1f]">{row.to_email}</td>
                  <td className="px-5 py-4 text-[#424245]">{row.subject}</td>
                  <td className="px-5 py-4 text-[13px] capitalize text-[#86868b]">
                    {row.template.replace(/_/g, " ")}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusStyles(row.status)}`}
                    >
                      {row.status}
                    </span>
                    {row.error && (
                      <p className="mt-1.5 max-w-xs break-words text-[11px] text-rose-700">
                        {row.error}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[13px] text-[#86868b]">
                    {new Date(row.sent_at || row.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {row.status !== "sent" && settings.configured && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            const result = await retryOutboxEntry(row.id);
                            await refresh();
                            if (result.status === "sent") setNotice(`Delivered to ${row.to_email}.`);
                            else setError(result.error || "Still could not deliver this message.");
                          })
                        }
                        className="text-[12px] font-semibold text-[#0071e3] hover:underline disabled:opacity-50"
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthShell, AuthCard, authButtonClass } from "@/components/auth/AuthShell";
import { bootstrapAdminAccount } from "@/lib/actions/bootstrap";

export default function AdminSetupPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const runSetup = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await bootstrapAdminAccount();
      setOk(result.success);
      setMessage(result.message);
    });
  };

  return (
    <AuthShell
      headline="Admin setup."
      headlineAccent="One-time bootstrap."
      description="Promote theolencer@gmail.com to platform admin and grant full module access."
      badges={[{ label: "Secure bootstrap", icon: Shield }]}
    >
      <AuthCard title="Complete admin setup" subtitle="Sign in as theolencer@gmail.com first">
        <div className="space-y-4 text-sm text-white/65">
          <p>
            This creates your Super Admin role, marks the account approved, and grants Workspace,
            Wear, and Library access.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-white/55">
            <li>Sign in with theolencer@gmail.com</li>
            <li>Click the button below</li>
            <li>Open Members to approve other users</li>
          </ol>
        </div>

        {message && (
          <div
            className={`mt-5 flex gap-2 rounded-xl border px-4 py-3 text-sm ${
              ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <p>{message}</p>
          </div>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={runSetup}
          className={`${authButtonClass} mt-6`}
        >
          {pending ? "Setting up..." : "Promote me to admin"}
        </button>

        {ok && (
          <Link href="/admin/members" className={`${authButtonClass} mt-3 bg-white/10`}>
            Go to Members
          </Link>
        )}

        <p className="mt-6 text-center text-xs text-white/40">
          Alternative: run <code className="text-white/60">supabase/seed/01_bootstrap_admin.sql</code>{" "}
          in Supabase.
        </p>
      </AuthCard>
    </AuthShell>
  );
}

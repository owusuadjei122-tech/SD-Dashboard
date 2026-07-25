"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthCard, authInputClass, authButtonClass } from "@/components/auth/AuthShell";
import { formatAuthError } from "@/lib/auth-errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) {
        setError(formatAuthError(resetError));
        return;
      }
      setInfo("If an account exists for that email, a reset link has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Reset your"
      headlineAccent="password."
      description="Enter your account email and we'll send a secure reset link."
    >
      <AuthCard title="Forgot password" subtitle="We'll email you a reset link">
        <form onSubmit={handleReset} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-white/80">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {info}
            </p>
          )}

          <button type="submit" disabled={loading} className={authButtonClass}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/50">
          <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-indigo-300 hover:text-indigo-200">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

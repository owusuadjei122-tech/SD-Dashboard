"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthCard, authInputClass, authButtonClass } from "@/components/auth/AuthShell";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { formatAuthError } from "@/lib/auth-errors";
import { validatePassword } from "@/lib/password";
import { recordPasswordChange } from "@/lib/actions/security";

type LinkState = "checking" | "valid" | "invalid";

export default function ResetPasswordPage() {
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const supabase = createClient();

      // The recovery link may arrive as a PKCE code (handled by /auth/callback)
      // or as an implicit-flow hash the client library consumes on load.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;
      setLinkState(session ? "valid" : "invalid");
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(formatAuthError(updateError));
        return;
      }

      // A password change invalidates other devices, not the one making the change.
      try {
        await supabase.auth.signOut({ scope: "others" });
      } catch {
        // Older Supabase versions may not support scoped sign-out
      }

      await recordPasswordChange();

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Set a new"
      headlineAccent="password."
      description="Choose a strong password. Signing in again on your other devices will be required."
      badges={[
        { label: "Encrypted at rest", icon: Lock },
        { label: "Other sessions revoked", icon: ShieldCheck },
        { label: "One-time link", icon: KeyRound },
      ]}
    >
      <AuthCard
        title={done ? "Password updated" : "Choose a new password"}
        subtitle={
          done
            ? "You can now use your new password everywhere."
            : "This link can only be used once."
        }
      >
        {linkState === "checking" && (
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            Verifying your reset link...
          </div>
        )}

        {linkState === "invalid" && (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              This reset link is invalid or has expired. Reset links are valid for a
              short time and can only be used once.
            </p>
            <Link href="/forgot-password" className={authButtonClass}>
              Request a new link
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {linkState === "valid" && done && (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Your password has been changed and every other signed-in device was
              logged out.
            </p>
            <a href="/login" className={authButtonClass}>
              Continue to sign in
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}

        {linkState === "valid" && !done && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                New password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${authInputClass} pr-12`}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/70"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirm" className="text-sm font-medium text-white/80">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={authInputClass}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                />
              </div>
              {confirm && password !== confirm && (
                <p className="text-xs text-amber-300">Passwords do not match yet.</p>
              )}
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className={authButtonClass}>
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Updating password...
                </>
              ) : (
                <>
                  Update password
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-white/50">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-indigo-300 transition hover:text-indigo-200">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

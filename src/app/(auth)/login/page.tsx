"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AuthShell, AuthCard, authInputClass, authButtonClass } from "@/components/auth/AuthShell";
import { AuthDivider, GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { formatAuthError } from "@/lib/auth-errors";
import {
  checkLoginAllowed,
  recordSignIn,
  registerLoginOutcome,
} from "@/lib/actions/auth-security";

function formatWait(seconds?: number) {
  if (!seconds) return "a few minutes";
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "a minute" : `${minutes} minutes`;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const finishSignIn = async () => {
    await recordSignIn("email");
    // Middleware routes pending/rejected users to the right screen
    window.location.assign("/dashboard");
  };

  /** Returns true when a second factor is required and the UI switched to it. */
  const handleMfaChallenge = async () => {
    const supabase = createClient();
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!aal || aal.nextLevel !== "aal2" || aal.nextLevel === aal.currentLevel) {
      return false;
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.find((f) => f.status === "verified");
    if (!totp) return false;

    setMfaFactorId(totp.id);
    setInfo("Enter the 6-digit code from your authenticator app.");
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const gate = await checkLoginAllowed(email);
      if (gate.locked) {
        setError(
          gate.reason === "ip"
            ? `Too many failed attempts from this network. Try again in ${formatWait(gate.retryAfterSeconds)}.`
            : `This account is temporarily locked after repeated failed attempts. Try again in ${formatWait(gate.retryAfterSeconds)}, or reset your password.`
        );
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const outcome = await registerLoginOutcome(email, false);
        if (outcome.locked) {
          setError(
            `Too many failed attempts. This account is locked for ${formatWait(outcome.retryAfterSeconds)}.`
          );
        } else {
          const base = formatAuthError(authError);
          const remaining = outcome.remainingAttempts;
          setError(
            remaining !== undefined && remaining <= 2 && remaining > 0
              ? `${base} ${remaining} attempt${remaining === 1 ? "" : "s"} left before the account is locked.`
              : base
          );
        }
        return;
      }

      await registerLoginOutcome(email, true);

      if (await handleMfaChallenge()) return;

      await finishSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId) return;

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeError || !challenge) {
        setError(challengeError?.message || "Could not start verification.");
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode.trim(),
      });

      if (verifyError) {
        setError("That code is not valid. Codes expire every 30 seconds — try the newest one.");
        return;
      }

      await finishSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError("Enter your email address first, then resend the confirmation link.");
      return;
    }
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (resendError) {
        setError(formatAuthError(resendError));
        return;
      }
      setInfo("Confirmation email sent. Check your inbox (and spam), then sign in again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend confirmation email.");
    } finally {
      setResending(false);
    }
  };

  const needsConfirmation = !!error && /confirm|verification|verify your email/i.test(error);

  return (
    <AuthShell
      headline="Your business,"
      headlineAccent="beautifully managed."
      description="Sign in to access analytics, sales, inventory, and your full SelfDiscovery workspace — all in one place."
      badges={[
        { label: "Real-time metrics", icon: Sparkles },
        { label: "Secure access", icon: Shield },
        { label: "Unified modules", icon: Lock },
      ]}
    >
      {mfaFactorId ? (
        <AuthCard
          title="Two-factor verification"
          subtitle="One more step to protect your account"
        >
          <form onSubmit={handleVerifyMfa} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="mfaCode" className="text-sm font-medium text-white/80">
                Authentication code
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  id="mfaCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={`${authInputClass} tracking-[0.4em]`}
                  placeholder="123456"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className={authButtonClass}
            >
              {loading ? "Verifying..." : "Verify and continue"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaFactorId(null);
                setMfaCode("");
                setInfo(null);
                setError(null);
              }}
              className="text-center text-sm text-white/50 transition hover:text-white/80"
            >
              Use a different account
            </button>
          </form>
        </AuthCard>
      ) : (
        <AuthCard title="Welcome back" subtitle="Enter your credentials to continue">
          <GoogleSignInButton />
          <AuthDivider />
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
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

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-white/80">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${authInputClass} pr-12`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
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
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <p>{error}</p>
                {needsConfirmation && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="mt-2 font-medium text-indigo-300 underline-offset-2 hover:underline disabled:opacity-60"
                  >
                    {resending ? "Sending..." : "Resend confirmation email"}
                  </button>
                )}
              </div>
            )}

            {info && (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {info}
              </p>
            )}

            <button type="submit" disabled={loading} className={authButtonClass}>
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/50">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-indigo-300 transition hover:text-indigo-200"
            >
              Create one
            </Link>
          </p>
        </AuthCard>
      )}
    </AuthShell>
  );
}

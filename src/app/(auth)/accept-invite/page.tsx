"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthCard, authInputClass, authButtonClass } from "@/components/auth/AuthShell";
import { AuthDivider, GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { formatAuthError } from "@/lib/auth-errors";
import { validatePassword } from "@/lib/password";
import {
  getInvitationPreview,
  redeemInvitation,
  type InvitationPreview,
} from "@/lib/actions/invitations";
import { MODULE_LABELS, type ModuleId } from "@/lib/rbac/types";

const REDEEM_ERRORS: Record<string, string> = {
  invalid_token: "This invitation link is not valid.",
  already_accepted: "This invitation has already been used.",
  revoked: "This invitation was revoked by an administrator.",
  expired: "This invitation has expired. Ask for a new one.",
  email_mismatch:
    "You are signed in with a different email than the one that was invited. Sign out and try again.",
  not_authenticated: "Sign in first to accept this invitation.",
};

function AcceptInviteInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const finish = useCallback(async () => {
    const result = await redeemInvitation(token);
    if (!result.ok) {
      setError(REDEEM_ERRORS[result.error ?? ""] ?? "Could not accept this invitation.");
      return;
    }
    window.location.assign("/dashboard");
  }, [token]);

  useEffect(() => {
    if (!token) {
      setPreview({ found: false });
      return;
    }

    let cancelled = false;

    const load = async () => {
      const result = await getInvitationPreview(token);
      if (cancelled) return;
      setPreview(result);

      // Arriving back from Google OAuth: a session already exists, so redeem now
      if (result.found && result.status === "pending" && !result.expired) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setLoading(true);
          try {
            await finish();
          } catch {
            if (!cancelled) setError("Could not accept the invitation. Try again.");
          }
          if (!cancelled) setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, finish]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const parts = fullName.trim().split(/\s+/).filter(Boolean);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: preview?.email ?? "",
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/accept-invite?token=${token}`,
          data: {
            full_name: fullName,
            first_name: parts[0] ?? "",
            last_name: parts.slice(1).join(" ") || null,
          },
        },
      });

      if (signUpError) {
        setError(formatAuthError(signUpError));
        return;
      }

      if (!data.session) {
        setInfo(
          "Account created. Confirm your email, then open this invitation link again to finish joining."
        );
        return;
      }

      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: preview?.email ?? "",
        password,
      });

      if (signInError) {
        setError(formatAuthError(signInError));
        return;
      }

      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
    } finally {
      setLoading(false);
    }
  };

  const modules = (preview?.module_ids ?? []) as ModuleId[];
  const invalidReason = !preview
    ? null
    : !preview.found
      ? "This invitation link is not valid."
      : preview.status === "accepted"
        ? "This invitation has already been used. Try signing in instead."
        : preview.status === "revoked"
          ? "This invitation was revoked by an administrator."
          : preview.expired || preview.status === "expired"
            ? "This invitation has expired. Ask an administrator to send a new one."
            : null;

  return (
    <AuthShell
      headline="You've been"
      headlineAccent="invited."
      description="Accept your invitation to join the SelfDiscovery workspace. Your access is already approved — you just need an account."
      badges={[
        { label: "Pre-approved access", icon: ShieldCheck },
        { label: "Modules ready", icon: Sparkles },
        { label: "Secure sign-in", icon: Lock },
      ]}
    >
      <AuthCard
        title={invalidReason ? "Invitation unavailable" : "Accept your invitation"}
        subtitle={
          invalidReason
            ? "Nothing to accept here"
            : preview?.email
              ? `Invited as ${preview.email}`
              : "Checking your invitation..."
        }
      >
        {!preview && (
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            Loading invitation...
          </div>
        )}

        {invalidReason && (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {invalidReason}
            </p>
            <Link href="/login" className={authButtonClass}>
              Go to sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {preview?.found && !invalidReason && (
          <div className="flex flex-col gap-5">
            {modules.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-white/40">You'll get access to</p>
                <p className="mt-1 text-sm text-white/85">
                  {modules.map((m) => MODULE_LABELS[m] ?? m).join(" · ")}
                </p>
              </div>
            )}

            <GoogleSignInButton
              label="Continue with Google"
              next={`/accept-invite?token=${token}`}
            />
            <AuthDivider />

            <form
              onSubmit={mode === "create" ? handleCreateAccount : handleSignIn}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    type="email"
                    value={preview.email ?? ""}
                    readOnly
                    className={`${authInputClass} cursor-not-allowed opacity-70`}
                  />
                </div>
              </div>

              {mode === "create" && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-white/80">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={authInputClass}
                      placeholder="John Doe"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium text-white/80">
                  {mode === "create" ? "Create a password" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${authInputClass} pr-12`}
                    placeholder={mode === "create" ? "At least 8 characters" : "••••••••"}
                    autoComplete={mode === "create" ? "new-password" : "current-password"}
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
                {mode === "create" && <PasswordStrengthMeter password={password} />}
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
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Joining...
                  </>
                ) : (
                  <>
                    {mode === "create" ? "Create account and join" : "Sign in and join"}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === "create" ? "signin" : "create"));
                setError(null);
                setInfo(null);
              }}
              className="text-center text-sm text-white/50 transition hover:text-white/80"
            >
              {mode === "create"
                ? "I already have an account"
                : "I need to create an account"}
            </button>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          headline="You've been"
          headlineAccent="invited."
          description="Loading your invitation..."
        >
          <AuthCard title="Accept your invitation" subtitle="Loading...">
            <div className="h-24" />
          </AuthCard>
        </AuthShell>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}

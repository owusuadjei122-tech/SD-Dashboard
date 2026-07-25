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
  Rocket,
  Shield,
  User,
  UserPlus,
} from "lucide-react";
import { AuthShell, AuthCard, authInputClass, authButtonClass } from "@/components/auth/AuthShell";
import { AuthDivider, GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { formatAuthError } from "@/lib/auth-errors";

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first_name = parts[0] ?? "";
  const last_name = parts.slice(1).join(" ") || null;
  return { first_name, last_name };
}

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const supabase = createClient();
      const { first_name, last_name } = splitFullName(fullName);

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: fullName,
            first_name,
            last_name,
          },
        },
      });

      if (authError) {
        setError(formatAuthError(authError));
        return;
      }

      if (data.user) {
        try {
          await supabase.from("user_profiles").upsert({
            id: data.user.id,
            email: data.user.email ?? email.trim(),
            first_name,
            last_name,
            role: "user",
            approval_status: "pending",
            auth_provider: "email",
            preferences: {
              locale: typeof navigator !== "undefined" ? navigator.language : "en-US",
            },
          });
        } catch {
          // Profile may be created by DB trigger; non-blocking
        }
      }

      // Email confirmation is enabled on this Supabase project
      if (!data.session) {
        setInfo(
          "Account created. Check your email for a confirmation link, then sign in. An administrator must approve your access before you can enter the workspace."
        );
        return;
      }

      // Middleware routes pending users to the waiting screen
      window.location.assign("/pending-approval");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Start managing"
      headlineAccent="with confidence."
      description="Create your account to unlock sales tracking, inventory, expenses, and real-time business analytics."
      badges={[
        { label: "Free to start", icon: Rocket },
        { label: "Enterprise-ready", icon: Shield },
        { label: "Team workspaces", icon: UserPlus },
      ]}
    >
      <AuthCard title="Create your account" subtitle="Join the SelfDiscovery workspace">
        <GoogleSignInButton label="Sign up with Google" />
        <AuthDivider />
        <form onSubmit={handleSignUp} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className="text-sm font-medium text-white/80">
              Full name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={authInputClass}
                placeholder="John Doe"
                autoComplete="name"
                required
              />
            </div>
          </div>

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
            <label htmlFor="password" className="text-sm font-medium text-white/80">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${authInputClass} pr-12`}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={6}
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
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {info && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <p>{info}</p>
              <Link
                href="/login"
                className="mt-2 inline-block font-medium text-indigo-300 underline-offset-2 hover:underline"
              >
                Go to sign in
              </Link>
            </div>
          )}

          <button type="submit" disabled={loading || !!info} className={authButtonClass}>
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-300 transition hover:text-indigo-200"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

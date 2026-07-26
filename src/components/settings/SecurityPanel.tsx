"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  Laptop,
  LogOut,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  forgetDevice,
  getSecurityOverview,
  recordPasswordChange,
  revokeSession,
  setAvatarPreference,
  setNotifyOnNewLogin,
  syncMfaState,
  type SecurityOverview,
} from "@/lib/actions/security";
import { validatePassword } from "@/lib/password";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

const cardClass = "rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm";
const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d1d1f] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50";
const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#1d1d1f] transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50";
const fieldClass =
  "h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3 text-sm text-[#1d1d1f] outline-none transition focus:border-[#0071e3]/40 focus:ring-2 focus:ring-[#0071e3]/15";

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[14px] font-medium text-[#1d1d1f]">{label}</p>
        <p className="mt-0.5 text-[13px] text-[#86868b]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#0071e3]" : "bg-black/15"
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SecurityPanel({ email }: { email: string }) {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // MFA enrollment
  const [enrolling, setEnrolling] = useState(false);
  const [factor, setFactor] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const reload = () => {
    getSecurityOverview()
      .then((data) => {
        setOverview(data);
        setLoadFailed(false);
      })
      .catch(() => setLoadFailed(true));
  };

  useEffect(reload, []);

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

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    run(async () => {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error(updateError.message);

      await recordPasswordChange();
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Password updated.");
    });
  };

  const startEnrollment = () => {
    run(async () => {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `SelfDiscovery ${new Date().toLocaleDateString()}`,
      });

      if (enrollError) throw new Error(enrollError.message);
      if (!data?.totp?.qr_code || !data.totp.secret) {
        throw new Error("Could not start enrollment.");
      }

      setFactor({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
      setEnrolling(true);
    });
  };

  const confirmEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!factor) return;

    run(async () => {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });
      if (challengeError || !challenge) throw new Error("Could not verify the code.");

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code: totpCode.trim(),
      });
      if (verifyError) throw new Error("That code is not valid. Try the newest one.");

      await syncMfaState(true);
      setEnrolling(false);
      setFactor(null);
      setTotpCode("");
      setNotice("Two-factor authentication is on.");
      reload();
    });
  };

  const disableMfa = () => {
    run(async () => {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const item of factors?.totp ?? []) {
        await supabase.auth.mfa.unenroll({ factorId: item.id });
      }
      await syncMfaState(false);
      setNotice("Two-factor authentication is off.");
      reload();
    });
  };

  const signOutOtherSessions = () => {
    run(async () => {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
      if (signOutError) throw new Error(signOutError.message);
      setNotice("Signed out everywhere else.");
      reload();
    });
  };

  if (!overview) {
    return (
      <div className={cardClass}>
        {loadFailed ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-[#1d1d1f]">
                Could not load your security settings
              </p>
              <p className="mt-0.5 text-[13px] text-[#86868b]">
                Check your connection and try again.
              </p>
            </div>
            <button type="button" onClick={reload} className={buttonSecondary}>
              Retry
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#86868b]">Loading your security settings...</p>
        )}
      </div>
    );
  }

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

      <section className={cardClass}>
        <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Two-factor authentication</h3>
        <p className="mt-1 text-[13px] text-[#86868b]">
          Require a code from your authenticator app in addition to your password.
        </p>

        {overview.mfaEnabled && !enrolling ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Enabled
            </span>
            <button type="button" disabled={pending} onClick={disableMfa} className={buttonSecondary}>
              Turn off
            </button>
          </div>
        ) : enrolling && factor ? (
          <form onSubmit={confirmEnrollment} className="mt-4 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {/* Supabase returns the QR code as an inline SVG data URL */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={factor.qr}
                alt="Two-factor QR code"
                className="h-40 w-40 rounded-xl border border-black/[0.06] bg-white p-2"
              />
              <div className="flex-1 space-y-3">
                <p className="text-[13px] text-[#424245]">
                  Scan this with Google Authenticator, 1Password, or any TOTP app. Can&apos;t scan?
                  Enter this key manually:
                </p>
                <code className="block break-all rounded-lg bg-[#f5f5f7] px-3 py-2 font-mono text-[12px] text-[#1d1d1f]">
                  {factor.secret}
                </code>
                <div className="space-y-2">
                  <label htmlFor="totp" className="text-[13px] font-medium text-[#1d1d1f]">
                    Enter the 6-digit code
                  </label>
                  <input
                    id="totp"
                    inputMode="numeric"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={`${fieldClass} tracking-[0.3em]`}
                    placeholder="123456"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={pending || totpCode.length !== 6} className={buttonPrimary}>
                <Check className="h-4 w-4" />
                Confirm and enable
              </button>
              <button
                type="button"
                onClick={() => {
                  setEnrolling(false);
                  setFactor(null);
                }}
                className={buttonSecondary}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={startEnrollment}
            className={`${buttonPrimary} mt-4`}
          >
            <ShieldCheck className="h-4 w-4" />
            Set up two-factor
          </button>
        )}
      </section>

      <section className={cardClass}>
        <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Password</h3>
        <p className="mt-1 text-[13px] text-[#86868b]">
          Changing your password signs you out of other devices.
        </p>

        <form onSubmit={changePassword} className="mt-4 max-w-sm space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-[13px] font-medium text-[#1d1d1f]">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={fieldClass}
              placeholder="At least 8 characters"
              required
            />
          </div>
          {newPassword && (
            <div className="rounded-xl bg-[#1d1d1f] p-3">
              <PasswordStrengthMeter password={newPassword} />
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-[13px] font-medium text-[#1d1d1f]">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldClass}
              required
            />
          </div>
          <button type="submit" disabled={pending} className={buttonPrimary}>
            Update password
          </button>
        </form>
      </section>

      <section className={`${cardClass} space-y-5`}>
        <div>
          <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Preferences</h3>
          <p className="mt-1 text-[13px] text-[#86868b]">
            Control notifications and which profile picture the platform shows for {email}.
          </p>
        </div>

        <Toggle
          checked={overview.notifyOnNewLogin}
          disabled={pending}
          label="Email me about new sign-ins"
          description="Sent whenever your account is used on a device we haven't seen before."
          onChange={(value) =>
            run(async () => {
              await setNotifyOnNewLogin(value);
              setOverview((prev) => (prev ? { ...prev, notifyOnNewLogin: value } : prev));
            })
          }
        />

        {(overview.hasGoogleAvatar || overview.hasUploadedAvatar) && (
          <div className="border-t border-black/[0.06] pt-5">
            <p className="text-[14px] font-medium text-[#1d1d1f]">Profile picture source</p>
            <p className="mt-0.5 text-[13px] text-[#86868b]">
              Choose whether to show your Google picture or the one you uploaded.
            </p>
            <div className="mt-3 flex gap-2">
              {(["google", "platform"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={pending || (option === "google" && !overview.hasGoogleAvatar)}
                  onClick={() =>
                    run(async () => {
                      await setAvatarPreference(option);
                      setOverview((prev) => (prev ? { ...prev, avatarPreference: option } : prev));
                      setNotice("Profile picture preference saved.");
                    })
                  }
                  className={`rounded-xl px-3.5 py-2 text-[13px] font-medium transition ${
                    overview.avatarPreference === option
                      ? "bg-[#1d1d1f] text-white"
                      : "bg-white text-[#424245] ring-1 ring-inset ring-black/[0.08] hover:bg-black/[0.03]"
                  } disabled:opacity-40`}
                >
                  {option === "google" ? "Google picture" : "Uploaded picture"}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Active sessions</h3>
            <p className="mt-1 text-[13px] text-[#86868b]">
              Everywhere your account is currently signed in.
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={signOutOtherSessions}
            className={buttonSecondary}
          >
            <LogOut className="h-4 w-4" />
            Sign out everywhere else
          </button>
        </div>

        {!overview.sessionsSupported ? (
          <p className="mt-4 text-[13px] text-[#86868b]">
            Per-session details are unavailable on this project. You can still sign out of other
            devices with the button above.
          </p>
        ) : overview.sessions.length === 0 ? (
          <p className="mt-4 text-[13px] text-[#86868b]">No other sessions.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {overview.sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#1d1d1f]">{session.label}</p>
                  <p className="text-[12px] text-[#86868b]">
                    {session.ip ? `${session.ip} · ` : ""}
                    Last active{" "}
                    {new Date(session.updated_at || session.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      await revokeSession(session.id);
                      setOverview((prev) =>
                        prev
                          ? { ...prev, sessions: prev.sessions.filter((s) => s.id !== session.id) }
                          : prev
                      );
                      setNotice("Session revoked.");
                    })
                  }
                  className="text-[13px] font-semibold text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Devices</h3>
        <p className="mt-1 text-[13px] text-[#86868b]">
          Devices that have signed in to your account.
        </p>

        {overview.devices.length === 0 ? (
          <p className="mt-4 text-[13px] text-[#86868b]">No devices recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {overview.devices.map((device) => (
              <li
                key={device.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {device.os === "iOS" || device.os === "Android" ? (
                    <Smartphone className="h-4.5 w-4.5 shrink-0 text-[#86868b]" />
                  ) : (
                    <Laptop className="h-4.5 w-4.5 shrink-0 text-[#86868b]" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-[#1d1d1f]">
                      {device.label || `${device.browser} on ${device.os}`}
                    </p>
                    <p className="text-[12px] text-[#86868b]">
                      Last seen {new Date(device.last_seen_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  aria-label="Forget device"
                  onClick={() =>
                    run(async () => {
                      await forgetDevice(device.id);
                      setOverview((prev) =>
                        prev
                          ? { ...prev, devices: prev.devices.filter((d) => d.id !== device.id) }
                          : prev
                      );
                    })
                  }
                  className="rounded-lg p-1.5 text-[#86868b] transition hover:bg-black/[0.05] hover:text-rose-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Recent security activity</h3>
        {overview.events.length === 0 ? (
          <p className="mt-4 text-[13px] text-[#86868b]">Nothing recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {overview.events.map((event) => (
              <li
                key={event.id}
                className="flex items-start justify-between gap-3 border-b border-black/[0.04] pb-2.5 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-[14px] capitalize text-[#1d1d1f]">
                    {event.type.replace(/_/g, " ")}
                    {event.is_suspicious && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        New device
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[12px] text-[#86868b]">
                    {[event.browser, event.os, event.ip_address].filter(Boolean).join(" · ") ||
                      "Unknown device"}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] text-[#86868b]">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

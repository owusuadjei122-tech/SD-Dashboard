"use client";

import { Ban, Mail, ShieldAlert } from "lucide-react";
import { AuthShell, AuthCard, authButtonClass } from "@/components/auth/AuthShell";

export default function AccessDeniedPage() {
  return (
    <AuthShell
      headline="Access not granted."
      headlineAccent="Contact your admin."
      description="This account is not allowed into the SelfDiscovery workspace. If you believe this is a mistake, reach out to your administrator."
      badges={[
        { label: "Access restricted", icon: Ban },
        { label: "Admin controlled", icon: ShieldAlert },
        { label: "Support available", icon: Mail },
      ]}
    >
      <AuthCard
        title="Access denied"
        subtitle="Your request was not approved, or the account is suspended"
      >
        <div className="space-y-5 text-sm leading-relaxed text-white/65">
          <p>
            You cannot access protected modules with this account. An administrator may have
            rejected or suspended access.
          </p>
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-amber-100">
            If you expected access, ask your SelfDiscovery admin to review your membership status.
          </p>
        </div>

        <form action="/api/auth/signout" method="POST" className="mt-8">
          <button type="submit" className={authButtonClass}>
            Sign out
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

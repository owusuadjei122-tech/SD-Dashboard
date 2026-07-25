"use client";

import { Clock, Mail, ShieldCheck } from "lucide-react";
import { AuthShell, AuthCard, authButtonClass } from "@/components/auth/AuthShell";

export default function PendingApprovalPage() {
  return (
    <AuthShell
      headline="You're almost in."
      headlineAccent="Waiting for approval."
      description="Your account was created successfully. An administrator needs to approve your access before you can enter the workspace."
      badges={[
        { label: "Secure by design", icon: ShieldCheck },
        { label: "Admin reviewed", icon: Clock },
        { label: "Email notified", icon: Mail },
      ]}
    >
      <AuthCard
        title="Request sent"
        subtitle="You'll get an email once your access is approved"
      >
        <div className="space-y-5 text-sm leading-relaxed text-white/65">
          <p>
            Your account has been created successfully. Your request has been sent to the
            administrator for approval.
          </p>
          <p>
            You will receive an email once your access has been approved. Until then, protected
            modules stay locked.
          </p>
          <ul className="space-y-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/55">
            <li>• Workspace remains private to approved members</li>
            <li>• Wear and Library access are assigned by an admin</li>
            <li>• You can sign out and return anytime</li>
          </ul>
        </div>

        <form action="/api/auth/signout" method="POST" className="mt-8">
          <button type="submit" className={authButtonClass}>
            Sign out
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/35">
          Platform owner?{" "}
          <a href="/admin-setup" className="text-indigo-300 hover:text-indigo-200">
            Complete admin setup
          </a>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

"use client";

import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { AuthShell, AuthCard, authButtonClass } from "@/components/auth/AuthShell";

export default function UnauthorizedPage() {
  return (
    <AuthShell
      headline="Not authorized."
      headlineAccent="Wrong module."
      description="You're signed in, but you don't have permission for this part of the platform."
      badges={[{ label: "Permission required", icon: Lock }]}
    >
      <AuthCard title="Unauthorized" subtitle="This module isn't assigned to your account">
        <p className="text-sm leading-relaxed text-white/65">
          Ask an administrator to grant module access if you need Wear, Library, or Workspace.
        </p>
        <Link href="/settings" className={`${authButtonClass} mt-8`}>
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>
      </AuthCard>
    </AuthShell>
  );
}

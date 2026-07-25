"use client";

import { Layers } from "lucide-react";
import { AuthShell, AuthCard, authButtonClass } from "@/components/auth/AuthShell";

export default function NoModulesPage() {
  return (
    <AuthShell
      headline="Account approved."
      headlineAccent="No modules yet."
      description="An administrator approved your account, but hasn't assigned Workspace, Wear, or Library access."
      badges={[{ label: "Awaiting assignment", icon: Layers }]}
    >
      <AuthCard title="No modules assigned" subtitle="Contact your administrator">
        <p className="text-sm leading-relaxed text-white/65">
          Once modules are assigned, navigation will appear automatically and you can start working.
        </p>
        <form action="/api/auth/signout" method="POST" className="mt-8">
          <button type="submit" className={authButtonClass}>
            Sign out
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAccessProfile } from "@/lib/rbac/access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAccessProfile();
  if (!profile) redirect("/login");
  if (!profile.isAdmin) redirect("/unauthorized");

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <p className="text-[13px] font-medium text-[#86868b]">Administration</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#1d1d1f]">
            Access control
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[#86868b]">
            Approve people, decide which modules they can open, and review everything that
            happens to accounts on this platform.
          </p>
        </div>
        <AdminNav />
        {children}
      </div>
    </DashboardShell>
  );
}

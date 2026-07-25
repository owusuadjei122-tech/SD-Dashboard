import { redirect } from "next/navigation";
import { getAccessProfile } from "@/lib/rbac/access";
import { listMembers, type AdminMemberRow } from "@/lib/actions/admin";
import { MembersClient } from "./MembersClient";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const profile = await getAccessProfile();
  if (!profile) redirect("/login");
  if (!profile.isAdmin) redirect("/unauthorized");

  let members: AdminMemberRow[] = [];
  let schemaReady = true;
  try {
    members = await listMembers({ status: "all" });
  } catch (error) {
    schemaReady = false;
    console.error("Failed to load members:", error);
  }

  return (
    <MembersClient
      initialMembers={members}
      schemaReady={schemaReady}
      currentAdminId={profile.id}
    />
  );
}

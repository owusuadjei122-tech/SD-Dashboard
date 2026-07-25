import { getRoleMatrix } from "@/lib/actions/roles";
import { RolesClient } from "./RolesClient";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  try {
    const matrix = await getRoleMatrix();
    return <RolesClient matrix={matrix} />;
  } catch (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        {error instanceof Error ? error.message : "Could not load roles."} Make sure migrations 03
        and 05 have been applied in Supabase.
      </div>
    );
  }
}

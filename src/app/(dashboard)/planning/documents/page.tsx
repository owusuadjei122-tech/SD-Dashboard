import { trackActivity } from "@/lib/actions/user";
import { PlanningClient } from "../PlanningClient";

export const dynamic = "force-dynamic";

export default async function PlanningDocumentsPage() {
  await trackActivity({
    activity_type: "page_view",
    module: "planning",
    description: "Viewed planner documents",
  });

  return <PlanningClient initialView="documents" />;
}

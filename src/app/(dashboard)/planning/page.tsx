import { trackActivity } from "@/lib/actions/user";
import { PlanningClient } from "./PlanningClient";

export default async function PlanningPage() {
  await trackActivity({
    activity_type: "page_view",
    module: "planning",
    description: "Viewed company planner workspace",
  });

  return <PlanningClient />;
}

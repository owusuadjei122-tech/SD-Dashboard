import { trackActivity } from "@/lib/actions/user";
import { PlanningClient } from "../PlanningClient";

export default async function PlanningTeamPage() {
  await trackActivity({
    activity_type: "page_view",
    module: "planning",
    description: "Viewed planner team members",
  });

  return <PlanningClient initialView="team" />;
}

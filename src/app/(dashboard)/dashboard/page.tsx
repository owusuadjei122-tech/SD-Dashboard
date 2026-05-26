import { getDashboardMetrics, getSalesChartData } from "@/lib/actions/dashboard";
import { trackActivity } from "@/lib/actions/user";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const [metrics, salesChartData] = await Promise.all([
    getDashboardMetrics(),
    getSalesChartData(),
  ]);

  // Track page view
  await trackActivity({
    activity_type: "page_view",
    module: "wear",
    description: "Viewed dashboard",
  });

  return <DashboardClient metrics={metrics} salesChartData={salesChartData} />;
}

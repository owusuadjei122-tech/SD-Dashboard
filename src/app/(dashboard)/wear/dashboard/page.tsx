import { getDashboardMetrics, getSalesChartData } from "@/lib/actions/dashboard";
import { DashboardClient } from "@/app/(dashboard)/dashboard/DashboardClient";

export default async function WearDashboardPage() {
  const [metrics, salesChartData] = await Promise.all([
    getDashboardMetrics(),
    getSalesChartData(),
  ]);

  return <DashboardClient metrics={metrics} salesChartData={salesChartData} />;
}

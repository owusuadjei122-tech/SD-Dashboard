import { getProfitLossMetrics } from "@/lib/actions/dashboard";
import { ProfitLossClient } from "./ProfitLossClient";

export default async function ProfitLossPage() {
  const metrics = await getProfitLossMetrics();
  return <ProfitLossClient metrics={metrics} />;
}

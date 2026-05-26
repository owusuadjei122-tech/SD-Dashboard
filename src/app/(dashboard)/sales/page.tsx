import { getSalesRecords, getSalesSummary } from "@/lib/actions/sales";
import { getProductCosting } from "@/lib/actions/product-costing";
import { SalesClient } from "./SalesClient";

export default async function SalesPage() {
  const [sales, products, summary] = await Promise.all([
    getSalesRecords(),
    getProductCosting(),
    getSalesSummary(),
  ]);

  return <SalesClient initialSales={sales} products={products} summary={summary} />;
}

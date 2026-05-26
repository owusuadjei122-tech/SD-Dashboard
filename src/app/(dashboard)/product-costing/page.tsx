import { getProductCosting } from "@/lib/actions/product-costing";
import { ProductCostingClient } from "./ProductCostingClient";

export default async function ProductCostingPage() {
  const products = await getProductCosting();

  return <ProductCostingClient initialProducts={products} />;
}

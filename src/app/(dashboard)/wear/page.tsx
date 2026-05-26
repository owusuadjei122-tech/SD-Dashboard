import { getProducts } from "@/lib/actions/products";
import WearClientPage from "./WearClientPage";

export const dynamic = "force-dynamic";

export default async function WearPage() {
  const products = await getProducts('wear');
  
  return <WearClientPage initialProducts={products || []} />;
}

import { getLibraryExpenses } from "@/lib/actions/library";
import { LibraryExpensesClient } from "./LibraryExpensesClient";

export default async function LibraryExpensesPage() {
  const expenses = await getLibraryExpenses();
  return <LibraryExpensesClient initialExpenses={expenses} />;
}

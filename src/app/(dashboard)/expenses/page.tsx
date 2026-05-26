import { getExpenses, getExpensesSummary } from "@/lib/actions/expenses";
import { ExpensesClient } from "./ExpensesClient";

export default async function ExpensesPage() {
  const [expenses, summary] = await Promise.all([
    getExpenses(),
    getExpensesSummary(),
  ]);

  return <ExpensesClient initialExpenses={expenses} summary={summary} />;
}

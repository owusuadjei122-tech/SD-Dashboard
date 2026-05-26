import { getLibraryBooks, getLibraryBorrows, getLibraryExpenses } from "@/lib/actions/library";
import { LibraryDashboardClient } from "./LibraryDashboardClient";

export default async function LibraryDashboardPage() {
  const [books, borrows, expenses] = await Promise.all([
    getLibraryBooks(),
    getLibraryBorrows(),
    getLibraryExpenses(),
  ]);

  return <LibraryDashboardClient books={books} borrows={borrows} expenses={expenses} />;
}

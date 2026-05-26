import { getLibraryBooks, getLibraryBorrows, getLibraryExpenses } from "@/lib/actions/library";
import { LibraryReportsClient } from "./LibraryReportsClient";

export default async function LibraryReportsPage() {
  const [books, borrows, expenses] = await Promise.all([
    getLibraryBooks(),
    getLibraryBorrows(),
    getLibraryExpenses(),
  ]);

  return <LibraryReportsClient books={books} borrows={borrows} expenses={expenses} />;
}

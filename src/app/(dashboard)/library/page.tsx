import { getLibraryBooks, getLibraryBorrows } from "@/lib/actions/library";
import { LibraryClient } from "./LibraryClient";

export default async function LibraryPage() {
  const [books, borrows] = await Promise.all([
    getLibraryBooks(),
    getLibraryBorrows(),
  ]);

  return <LibraryClient initialBooks={books} initialBorrows={borrows} />;
}

import { getLibraryBooks } from "@/lib/actions/library";
import { LibraryInventoryClient } from "./LibraryInventoryClient";

export default async function LibraryInventoryPage() {
  const books = await getLibraryBooks();
  return <LibraryInventoryClient books={books} />;
}

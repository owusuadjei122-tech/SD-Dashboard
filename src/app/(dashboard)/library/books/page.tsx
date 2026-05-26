import { getLibraryBooks } from "@/lib/actions/library";
import { LibraryBooksClient } from "./LibraryBooksClient";

export default async function LibraryBooksPage() {
  const books = await getLibraryBooks();
  return <LibraryBooksClient initialBooks={books} />;
}

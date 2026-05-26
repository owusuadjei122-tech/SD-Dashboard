"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createLibraryBook, updateLibraryBook, deleteLibraryBook } from "@/lib/actions/library";
import { AddBookModal } from "./AddBookModal";

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  quantity: number;
  available_copies: number;
  borrowed_copies: number;
  status: string;
}

interface LibraryBooksClientProps {
  initialBooks: LibraryBook[];
}

export function LibraryBooksClient({ initialBooks }: LibraryBooksClientProps) {
  const [books, setBooks] = useState(initialBooks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBook = async (data: any) => {
    const newBook = await createLibraryBook(data);
    setBooks([{ ...newBook, borrowed_copies: 0, status: 'Available' }, ...books]);
    setIsModalOpen(false);
  };

  const handleEditBook = async (data: any) => {
    if (!editingBook) return;
    const updated = await updateLibraryBook(editingBook.id, data);
    setBooks(books.map((b) => (b.id === updated.id ? { ...updated, borrowed_copies: editingBook.borrowed_copies, status: editingBook.status } : b)));
    setEditingBook(null);
  };

  const handleDeleteBook = async (id: string) => {
    if (confirm("Are you sure you want to delete this book?")) {
      await deleteLibraryBook(id);
      setBooks(books.filter((b) => b.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Books</h1>
          <p className="text-muted-foreground mt-1">
            Manage your book collection
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Book
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Borrowed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No books found. Add your first book to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell className="text-right">{book.quantity}</TableCell>
                  <TableCell className="text-right">{book.available_copies}</TableCell>
                  <TableCell className="text-right">{book.borrowed_copies}</TableCell>
                  <TableCell>
                    <Badge variant={book.status === "Available" ? "success" : "warning"}>
                      {book.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingBook(book)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBook(book.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddBook}
      />

      {editingBook && (
        <AddBookModal
          isOpen={true}
          onClose={() => setEditingBook(null)}
          onSubmit={handleEditBook}
          initialData={editingBook}
        />
      )}
    </div>
  );
}

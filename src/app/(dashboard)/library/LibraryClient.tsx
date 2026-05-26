"use client";

import { useState } from "react";
import { Plus, Search, Book, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string | null;
  quantity: number;
  available_copies: number;
  borrowed_copies: number;
  status: string;
}

interface LibraryBorrow {
  id: string;
  book_id: string;
  borrower_name: string;
  borrower_email: string | null;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  fine_amount: number;
  status: string;
  library_books?: {
    title: string;
    author: string;
  };
}

interface LibraryClientProps {
  initialBooks: LibraryBook[];
  initialBorrows: LibraryBorrow[];
}

export function LibraryClient({ initialBooks, initialBorrows }: LibraryClientProps) {
  const [books] = useState(initialBooks);
  const [borrows] = useState(initialBorrows);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"books" | "borrows">("books");

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBorrows = borrows.filter((borrow) =>
    borrow.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    borrow.library_books?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);
  const availableBooks = books.reduce((sum, book) => sum + book.available_copies, 0);
  const borrowedBooks = books.reduce((sum, book) => sum + book.borrowed_copies, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage books, track borrowing, and monitor library operations
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Book
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Total Books"
          value={totalBooks}
          icon={Book}
        />
        <MetricCard
          title="Available"
          value={availableBooks}
          icon={Book}
        />
        <MetricCard
          title="Borrowed"
          value={borrowedBooks}
          icon={Users}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "books" ? "default" : "outline"}
              onClick={() => setActiveTab("books")}
              className="gap-2"
            >
              <Book className="h-4 w-4" />
              Books
            </Button>
            <Button
              variant={activeTab === "borrows" ? "default" : "outline"}
              onClick={() => setActiveTab("borrows")}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Borrow History
            </Button>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === "books" ? "Search books..." : "Search borrows..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {activeTab === "books" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Borrowed</TableHead>
                <TableHead>Status</TableHead>
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
                    <TableCell>{book.category}</TableCell>
                    <TableCell className="text-right">{book.quantity}</TableCell>
                    <TableCell className="text-right">{book.available_copies}</TableCell>
                    <TableCell className="text-right">{book.borrowed_copies}</TableCell>
                    <TableCell>
                      <Badge variant={book.status === "Available" ? "success" : "warning"}>
                        {book.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Borrow Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead className="text-right">Fine</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBorrows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No borrow records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBorrows.map((borrow) => (
                  <TableRow key={borrow.id}>
                    <TableCell className="font-medium">
                      {borrow.library_books?.title || "Unknown"}
                    </TableCell>
                    <TableCell>{borrow.borrower_name}</TableCell>
                    <TableCell>{new Date(borrow.borrow_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(borrow.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {borrow.return_date 
                        ? new Date(borrow.return_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      ${borrow.fine_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          borrow.status === "returned" ? "success" :
                          borrow.status === "overdue" ? "danger" : "default"
                        }
                      >
                        {borrow.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Book className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Library Module - Basic View
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This is a simplified view showing your library data. Full features (add books, borrow/return, fine tracking) 
              can be implemented following the pattern in ProductCostingClient.tsx and SalesClient.tsx.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

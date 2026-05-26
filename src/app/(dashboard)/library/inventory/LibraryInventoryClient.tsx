"use client";

import { useState } from "react";
import { Package, Search, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PremiumMetricCard } from "@/components/ui/premium-metric-card";
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
  quantity: number;
  available_copies: number;
  borrowed_copies: number;
  status: string;
}

interface LibraryInventoryClientProps {
  books: LibraryBook[];
}

export function LibraryInventoryClient({ books }: LibraryInventoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);
  const availableBooks = books.reduce((sum, book) => sum + book.available_copies, 0);
  const borrowedBooks = books.reduce((sum, book) => sum + book.borrowed_copies, 0);
  const unavailableBooks = books.filter(book => book.available_copies === 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library Inventory</h1>
        <p className="text-muted-foreground mt-1">
          Monitor book availability and stock levels
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <PremiumMetricCard
          title="Total Books"
          value={totalBooks}
          icon={Package}
          gradient="primary"
        />
        <PremiumMetricCard
          title="Available"
          value={availableBooks}
          icon={CheckCircle}
          gradient="success"
        />
        <PremiumMetricCard
          title="Borrowed"
          value={borrowedBooks}
          icon={Package}
          gradient="accent"
        />
        <PremiumMetricCard
          title="Unavailable"
          value={unavailableBooks}
          icon={AlertTriangle}
          gradient="warm"
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
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
              <TableHead className="text-right">Total Quantity</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Borrowed</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No books in inventory. Add books to see them here.
                </TableCell>
              </TableRow>
            ) : (
              filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell className="text-right font-semibold">{book.quantity}</TableCell>
                  <TableCell className="text-right text-green-600 font-semibold">
                    {book.available_copies}
                  </TableCell>
                  <TableCell className="text-right text-blue-600 font-semibold">
                    {book.borrowed_copies}
                  </TableCell>
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
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">Available Books</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{availableBooks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Currently Borrowed</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{borrowedBooks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">Unavailable</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{unavailableBooks}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

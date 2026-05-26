"use client";

import { Book, Users, DollarSign, Package } from "lucide-react";
import { PremiumMetricCard } from "@/components/ui/premium-metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface LibraryBorrow {
  id: string;
  borrower_name: string;
  borrow_date: string;
  status: string;
  library_books?: {
    title: string;
  };
}

interface LibraryExpense {
  id: string;
  amount: number;
}

interface LibraryDashboardClientProps {
  books: LibraryBook[];
  borrows: LibraryBorrow[];
  expenses: LibraryExpense[];
}

export function LibraryDashboardClient({ books, borrows, expenses }: LibraryDashboardClientProps) {
  const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);
  const availableBooks = books.reduce((sum, book) => sum + book.available_copies, 0);
  const borrowedBooks = books.reduce((sum, book) => sum + book.borrowed_copies, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const recentBorrows = borrows.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          SelfDiscovery Library Dashboard
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your library collection and track borrowing activity
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PremiumMetricCard
          title="Total Books"
          value={totalBooks}
          icon={Book}
          gradient="primary"
        />
        <PremiumMetricCard
          title="Available"
          value={availableBooks}
          icon={Package}
          gradient="success"
        />
        <PremiumMetricCard
          title="Borrowed"
          value={borrowedBooks}
          icon={Users}
          gradient="accent"
        />
        <PremiumMetricCard
          title="Total Expenses"
          value={`$${totalExpenses.toFixed(2)}`}
          icon={DollarSign}
          gradient="warm"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Books */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              Recent Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {books.slice(0, 5).map((book) => (
                <div key={book.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{book.available_copies}/{book.quantity}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                    <Badge variant={book.status === "Available" ? "success" : "warning"}>
                      {book.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {books.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No books in library. Add your first book to get started.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Borrows */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Borrowing Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBorrows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No borrowing activity yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentBorrows.map((borrow) => (
                    <TableRow key={borrow.id}>
                      <TableCell className="font-medium">
                        {borrow.library_books?.title || "Unknown"}
                      </TableCell>
                      <TableCell>{borrow.borrower_name}</TableCell>
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
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover cursor-pointer" onClick={() => window.location.href = '/library/books'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Book className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">Manage Books</p>
                <p className="text-sm text-muted-foreground">Add, edit, or remove books</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer" onClick={() => window.location.href = '/library/inventory'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-cyan-600 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">View Inventory</p>
                <p className="text-sm text-muted-foreground">Check stock levels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer" onClick={() => window.location.href = '/library/expenses'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">Track Expenses</p>
                <p className="text-sm text-muted-foreground">Manage library costs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

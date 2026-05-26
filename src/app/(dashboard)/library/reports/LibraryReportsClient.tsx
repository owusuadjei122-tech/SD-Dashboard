"use client";

import { Book, Users, DollarSign, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumMetricCard } from "@/components/ui/premium-metric-card";

interface LibraryReportsClientProps {
  books: any[];
  borrows: any[];
  expenses: any[];
}

export function LibraryReportsClient({ books, borrows, expenses }: LibraryReportsClientProps) {
  const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);
  const totalBorrows = borrows.length;
  const activeBorrows = borrows.filter(b => b.status === 'borrowed').length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const categoryExpenses = expenses.reduce((acc: Record<string, number>, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library Reports</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive overview of library operations and statistics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PremiumMetricCard
          title="Total Books"
          value={totalBooks}
          icon={Book}
          gradient="primary"
        />
        <PremiumMetricCard
          title="Total Borrows"
          value={totalBorrows}
          icon={Users}
          gradient="accent"
        />
        <PremiumMetricCard
          title="Active Borrows"
          value={activeBorrows}
          icon={Package}
          gradient="success"
        />
        <PremiumMetricCard
          title="Total Expenses"
          value={`$${totalExpenses.toFixed(2)}`}
          icon={DollarSign}
          gradient="warm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              Collection Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <span className="font-medium">Total Books</span>
              <span className="text-2xl font-bold">{totalBooks}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <span className="font-medium">Available</span>
              <span className="text-2xl font-bold text-green-600">
                {books.reduce((sum, book) => sum + book.available_copies, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
              <span className="font-medium">Borrowed</span>
              <span className="text-2xl font-bold text-blue-600">
                {books.reduce((sum, book) => sum + book.borrowed_copies, 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(categoryExpenses).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{category}</span>
                <span className="font-semibold text-red-600">${(amount as number).toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(categoryExpenses).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No expenses recorded yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Borrowing Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
              <span className="font-medium">Total Borrows</span>
              <span className="text-2xl font-bold">{totalBorrows}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <span className="font-medium">Active</span>
              <span className="text-2xl font-bold text-green-600">{activeBorrows}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl">
              <span className="font-medium">Returned</span>
              <span className="text-2xl font-bold text-gray-600">
                {borrows.filter(b => b.status === 'returned').length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Average per Book</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totalBooks > 0 ? (totalExpenses / totalBooks).toFixed(2) : '0.00'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Receipt, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { createLibraryExpense } from "@/lib/actions/library";
import { LibraryExpenseModal } from "./LibraryExpenseModal";

interface LibraryExpense {
  id: string;
  date: string;
  category: string;
  description: string | null;
  amount: number;
}

interface LibraryExpensesClientProps {
  initialExpenses: LibraryExpense[];
}

const CATEGORY_COLORS: Record<string, "default" | "success" | "warning" | "danger" | "secondary"> = {
  "Book Purchase": "success",
  "Maintenance": "warning",
  "Utilities": "secondary",
  "Staff": "default",
  "Miscellaneous": "danger",
};

export function LibraryExpensesClient({ initialExpenses }: LibraryExpensesClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredExpenses = expenses.filter((expense) =>
    expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const monthlyExpenses = expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const handleAddExpense = async (data: any) => {
    const newExpense = await createLibraryExpense(data);
    setExpenses([newExpense, ...expenses]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage library operational costs
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PremiumMetricCard
          title="Total Expenses"
          value={`$${totalExpenses.toFixed(2)}`}
          icon={DollarSign}
          gradient="warm"
        />
        <PremiumMetricCard
          title="Monthly Expenses"
          value={`$${monthlyExpenses.toFixed(2)}`}
          icon={Receipt}
          gradient="primary"
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No expenses found. Add your first expense to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={CATEGORY_COLORS[expense.category]}>
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {expense.description || "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    ${expense.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <LibraryExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddExpense}
      />
    </div>
  );
}

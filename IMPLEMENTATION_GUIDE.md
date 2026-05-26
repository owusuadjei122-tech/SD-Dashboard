# Implementation Guide - Remaining Components

## Status Overview

### ✅ Completed
- Database schema and migrations
- All server actions (product-costing, sales, expenses, inventory, library, dashboard)
- TypeScript types
- UI component library (Button, Card, Input, Label, Table, Badge, MetricCard)
- Sidebar navigation
- Product Costing page (full implementation)
- Sales Record page (full implementation)
- Expenses Tracker page (full implementation)
- Dashboard page (full implementation with charts)

### 🔨 To Be Implemented
- Inventory Tracker Client Component
- Profit & Loss Client Component
- Library Management Client Component

---

## 1. Inventory Tracker Implementation

### File: `src/app/(dashboard)/inventory/InventoryClient.tsx`

**Features Needed:**
- Display inventory with calculated current stock
- Color-coded status badges (Green/Orange/Red)
- Restock functionality
- Search and filter
- Auto-calculation: Current Stock = Starting Stock - Quantity Sold

**Key Code Structure:**
```typescript
"use client";

import { useState } from "react";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { restockInventory } from "@/lib/actions/inventory";

interface InventoryItem {
  id: string;
  product_name: string;
  starting_stock: number;
  quantity_sold: number;
  current_stock: number;
  reorder_level: number;
  status: string;
}

export function InventoryClient({ initialInventory }: { initialInventory: InventoryItem[] }) {
  const [inventory, setInventory] = useState(initialInventory);
  
  const getStatusBadge = (status: string) => {
    if (status === "Out of Stock") return <Badge variant="danger">Out of Stock</Badge>;
    if (status === "Low Stock") return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  const handleRestock = async (id: string, amount: number) => {
    await restockInventory(id, amount);
    // Refresh data
  };

  return (
    <div className="space-y-6">
      {/* Header with title */}
      {/* Metric cards showing stock status summary */}
      {/* Table with columns: Product Name, Starting Stock, Quantity Sold, Current Stock, Reorder Level, Status, Actions */}
      {/* Restock modal */}
    </div>
  );
}
```

**Status Color Logic:**
- `current_stock <= 0` → Red (Out of Stock)
- `current_stock <= reorder_level` → Orange (Low Stock)
- `current_stock > reorder_level` → Green (In Stock)

---

## 2. Profit & Loss Summary Implementation

### File: `src/app/(dashboard)/profit-loss/ProfitLossClient.tsx`

**Features Needed:**
- Display key financial metrics
- Show best-selling product
- Show highest expense category
- Clean summary table format

**Key Code Structure:**
```typescript
"use client";

import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import type { ProfitLossMetrics } from "@/types/business";

export function ProfitLossClient({ metrics }: { metrics: ProfitLossMetrics }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profit & Loss Summary</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive financial overview and performance metrics
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Expenses"
          value={`$${metrics.totalExpenses.toFixed(2)}`}
          icon={TrendingDown}
        />
        <MetricCard
          title="Gross Profit"
          value={`$${metrics.grossProfit.toFixed(2)}`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Net Profit"
          value={`$${metrics.netProfit.toFixed(2)}`}
          icon={TrendingUp}
        />
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Best Selling Product</span>
              <span className="text-lg font-bold">{metrics.bestSellingProduct}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Highest Expense Category</span>
              <span className="text-lg font-bold">{metrics.highestExpenseCategory}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Calculations (Already Done in Server Action):**
- Total Revenue = Sum of all sales
- Total Expenses = Sum of all expenses
- Gross Profit = Revenue - Expenses
- Net Profit = Gross Profit

---

## 3. Library Management Implementation

### File: `src/app/(dashboard)/library/LibraryClient.tsx`

**Features Needed:**
- Book catalog management
- Borrow/Return system
- Due date tracking
- Fine calculation
- Search and filter by category
- Borrowed copies calculation

**Key Code Structure:**
```typescript
"use client";

import { useState } from "react";
import { Book, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createLibraryBook, createLibraryBorrow, returnLibraryBook } from "@/lib/actions/library";

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  quantity: number;
  available_copies: number;
  borrowed_copies: number;
  status: string;
}

export function LibraryClient({ 
  initialBooks, 
  initialBorrows 
}: { 
  initialBooks: LibraryBook[];
  initialBorrows: any[];
}) {
  const [books, setBooks] = useState(initialBooks);
  const [borrows, setBorrows] = useState(initialBorrows);
  const [activeTab, setActiveTab] = useState<"books" | "borrows">("books");

  const handleBorrowBook = async (bookId: string, borrowerData: any) => {
    await createLibraryBorrow({
      book_id: bookId,
      ...borrowerData,
      due_date: calculateDueDate(14), // 14 days from now
    });
    // Refresh data
  };

  const handleReturnBook = async (borrowId: string) => {
    const fine = calculateFine(borrowRecord);
    await returnLibraryBook(borrowId, fine);
    // Refresh data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Tab Navigation: Books | Borrow History */}
      
      {activeTab === "books" && (
        <>
          {/* Books Table */}
          {/* Columns: Title, Author, Category, Quantity, Available, Borrowed, Status, Actions */}
          {/* Add Book Modal */}
          {/* Borrow Book Modal */}
        </>
      )}

      {activeTab === "borrows" && (
        <>
          {/* Borrow History Table */}
          {/* Columns: Book, Borrower, Borrow Date, Due Date, Return Date, Fine, Status, Actions */}
          {/* Return Book functionality */}
        </>
      )}
    </div>
  );
}
```

**Fine Calculation Logic:**
```typescript
function calculateFine(borrowRecord: any): number {
  if (borrowRecord.return_date) return 0;
  
  const dueDate = new Date(borrowRecord.due_date);
  const today = new Date();
  const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  return daysOverdue * 0.50; // $0.50 per day
}
```

**Status Logic:**
- `available_copies > 0` → "Available" (Green Badge)
- `available_copies === 0` → "Unavailable" (Red Badge)

---

## Quick Implementation Checklist

### For Each Component:

1. **Create the Client Component File**
   - Import necessary UI components
   - Set up state management
   - Implement search/filter logic

2. **Create Modal Components**
   - Add/Edit modal
   - Form validation
   - Submit handlers

3. **Implement Table Display**
   - Use Table components from UI library
   - Add action buttons (Edit, Delete)
   - Format data appropriately

4. **Add Metric Cards**
   - Use MetricCard component
   - Display relevant summaries
   - Add icons from lucide-react

5. **Test Functionality**
   - Add new records
   - Edit existing records
   - Delete records
   - Verify calculations
   - Test search/filter

---

## Common Patterns

### Modal Pattern
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState<Type | null>(null);

// For Add
<Button onClick={() => setIsModalOpen(true)}>Add</Button>

// For Edit
<Button onClick={() => setEditingItem(item)}>Edit</Button>

// Modal Component
{isModalOpen && <Modal onClose={() => setIsModalOpen(false)} />}
{editingItem && <Modal initialData={editingItem} onClose={() => setEditingItem(null)} />}
```

### Search Pattern
```typescript
const [searchQuery, setSearchQuery] = useState("");

const filteredItems = items.filter((item) =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### Delete Pattern
```typescript
const handleDelete = async (id: string) => {
  if (confirm("Are you sure?")) {
    await deleteAction(id);
    setItems(items.filter((item) => item.id !== id));
  }
};
```

---

## Testing Steps

1. **Run Database Migration**
   - Copy SQL from `supabase/migrations/00000000000001_business_management.sql`
   - Run in Supabase SQL Editor

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Test Each Module**
   - Sign up/Login
   - Add products
   - Record sales
   - Add expenses
   - Check inventory updates
   - View dashboard
   - Check P&L summary
   - Manage library

4. **Verify Calculations**
   - Product profit/markup
   - Sales totals
   - Inventory stock levels
   - P&L metrics
   - Library fines

---

## Design Guidelines

### Colors
- Success: `text-green-600`, `bg-green-100`
- Warning: `text-yellow-600`, `bg-yellow-100`
- Danger: `text-red-600`, `bg-red-100`
- Primary: `text-primary`, `bg-primary`

### Spacing
- Page padding: `p-8`
- Card padding: `p-6`
- Section gaps: `space-y-6`
- Grid gaps: `gap-6`

### Typography
- Page title: `text-3xl font-bold tracking-tight`
- Subtitle: `text-muted-foreground mt-1`
- Table headers: `font-medium text-muted-foreground`
- Values: `font-semibold`

---

## Support Resources

- **UI Components**: Check `src/components/ui/` for available components
- **Server Actions**: Check `src/lib/actions/` for data operations
- **Types**: Check `src/types/business.ts` for TypeScript definitions
- **Examples**: Reference ProductCostingClient, SalesClient, ExpensesClient

---

**Remember**: All calculations should happen automatically. Users should never need to manually calculate anything!

export interface ProductCosting {
  id: string;
  product_name: string;
  cost_price: number;
  selling_price: number;
  created_at: string;
  updated_at: string;
}

export interface SalesRecord {
  id: string;
  date: string;
  product_id: string;
  product_name: string;
  quantity: number;
  selling_price: number;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Inventory' | 'Marketing' | 'Operations' | 'Utilities' | 'Miscellaneous';
  description: string | null;
  amount: number;
  created_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  product_name: string;
  starting_stock: number;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string | null;
  quantity: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
}

export interface LibraryBorrow {
  id: string;
  book_id: string;
  borrower_name: string;
  borrower_email: string | null;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  fine_amount: number;
  status: 'borrowed' | 'returned' | 'overdue';
  created_at: string;
}

export interface LibraryExpense {
  id: string;
  date: string;
  category: 'Book Purchase' | 'Maintenance' | 'Utilities' | 'Staff' | 'Miscellaneous';
  description: string | null;
  amount: number;
  created_at: string;
}

export interface DashboardMetrics {
  totalSales: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface ProfitLossMetrics {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  bestSellingProduct: string;
  highestExpenseCategory: string;
}

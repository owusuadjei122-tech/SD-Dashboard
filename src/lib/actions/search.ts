"use server";

import { createClient } from "@/lib/supabase/server";
import { trackActivity } from "./user";

export interface SearchResult {
  id: string;
  type: "product" | "sale" | "expense" | "book" | "library_expense" | "inventory";
  title: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
  url: string;
}

function sanitizeQuery(query: string): string {
  return query.trim().replace(/[%_]/g, "");
}

/** Search a table across multiple columns using reliable per-column ilike queries */
async function searchTable<T extends { id: string }>(
  table: string,
  columns: string[],
  query: string
): Promise<T[]> {
  const q = sanitizeQuery(query);
  if (q.length < 2) return [];

  const supabase = await createClient();
  const pattern = `%${q}%`;
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const column of columns) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .ilike(column, pattern);

    if (error) {
      console.error(`Search error on ${table}.${column}:`, error.message);
      continue;
    }

    for (const row of data ?? []) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        merged.push(row as T);
      }
    }
  }

  return merged;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = sanitizeQuery(query);
  if (!q || q.length < 2) return [];

  const results: SearchResult[] = [];

  const products = await searchTable<{
    id: string;
    product_name: string;
    cost_price: number;
    selling_price: number;
  }>("product_costing", ["product_name"], q);

  products.forEach((product) => {
    results.push({
      id: product.id,
      type: "product",
      title: product.product_name,
      subtitle: `Cost: $${product.cost_price} | Selling: $${product.selling_price}`,
      metadata: {
        cost_price: product.cost_price,
        selling_price: product.selling_price,
      },
      url: "/product-costing",
    });
  });

  const sales = await searchTable<{
    id: string;
    product_name: string;
    quantity: number;
    selling_price: number;
    date: string;
  }>("sales_records", ["product_name"], q);

  sales.forEach((sale) => {
    results.push({
      id: sale.id,
      type: "sale",
      title: `Sale: ${sale.product_name}`,
      subtitle: `Qty: ${sale.quantity} | Price: $${sale.selling_price} | Date: ${sale.date}`,
      metadata: {
        quantity: sale.quantity,
        selling_price: sale.selling_price,
        date: sale.date,
      },
      url: "/sales",
    });
  });

  const expenses = await searchTable<{
    id: string;
    category: string;
    description: string | null;
    amount: number;
    date: string;
  }>("expenses", ["category", "description"], q);

  expenses.forEach((expense) => {
    results.push({
      id: expense.id,
      type: "expense",
      title: `Expense: ${expense.category}`,
      subtitle: `${expense.description || "No description"} | $${expense.amount} | ${expense.date}`,
      metadata: {
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
      },
      url: "/expenses",
    });
  });

  const inventory = await searchTable<{
    id: string;
    product_name: string;
    starting_stock: number;
    reorder_level: number;
  }>("inventory", ["product_name"], q);

  inventory.forEach((item) => {
    results.push({
      id: item.id,
      type: "inventory",
      title: item.product_name,
      subtitle: `Starting stock: ${item.starting_stock} | Reorder at: ${item.reorder_level}`,
      metadata: {
        starting_stock: item.starting_stock,
        reorder_level: item.reorder_level,
      },
      url: "/inventory",
    });
  });

  const books = await searchTable<{
    id: string;
    title: string;
    author: string;
    quantity: number;
    available_copies: number;
  }>("library_books", ["title", "author"], q);

  books.forEach((book) => {
    results.push({
      id: book.id,
      type: "book",
      title: book.title,
      subtitle: `Author: ${book.author} | Available: ${book.available_copies}/${book.quantity}`,
      metadata: {
        author: book.author,
        quantity: book.quantity,
        available_copies: book.available_copies,
      },
      url: "/library/books",
    });
  });

  const libraryExpenses = await searchTable<{
    id: string;
    category: string;
    description: string | null;
    amount: number;
    date: string;
  }>("library_expenses", ["category", "description"], q);

  libraryExpenses.forEach((expense) => {
    results.push({
      id: expense.id,
      type: "library_expense",
      title: `Library Expense: ${expense.category}`,
      subtitle: `${expense.description || "No description"} | $${expense.amount} | ${expense.date}`,
      metadata: {
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
      },
      url: "/library/expenses",
    });
  });

  await trackActivity({
    activity_type: "search",
    module: "global",
    description: `Searched for: ${q}`,
    metadata: { query: q, results_count: results.length },
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("search_history").insert({
        user_id: user.id,
        search_query: q,
        search_module: "all",
        results_count: results.length,
      });
    }
  } catch {
    // Non-blocking if search_history table is unavailable
  }

  return results.slice(0, 20);
}

export async function getSearchHistory(limit = 10) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("search_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching search history:", error);
    return [];
  }

  return data || [];
}

"use server";

import { createClient } from "@/lib/supabase/server";
import type { DashboardMetrics, ProfitLossMetrics } from "@/types/business";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const [salesResult, expensesResult, productsResult, inventoryResult] = await Promise.all([
    supabase.from("sales_records").select("quantity, selling_price"),
    supabase.from("expenses").select("amount"),
    supabase.from("product_costing").select("id"),
    supabase.from("inventory").select("*"),
  ]);

  const totalRevenue = salesResult.data?.reduce(
    (sum, sale) => sum + (sale.quantity * sale.selling_price), 0
  ) || 0;

  const totalExpenses = expensesResult.data?.reduce(
    (sum, expense) => sum + Number(expense.amount), 0
  ) || 0;

  const netProfit = totalRevenue - totalExpenses;
  const totalProducts = productsResult.data?.length || 0;

  const { data: salesData } = await supabase.from("sales_records").select("product_id, quantity");
  const salesByProduct = salesData?.reduce((acc: Record<string, number>, sale) => {
    acc[sale.product_id] = (acc[sale.product_id] || 0) + sale.quantity;
    return acc;
  }, {}) || {};

  let lowStockItems = 0;
  let outOfStockItems = 0;

  inventoryResult.data?.forEach((item) => {
    const quantitySold = salesByProduct[item.product_id] || 0;
    const currentStock = item.starting_stock - quantitySold;
    
    if (currentStock <= 0) {
      outOfStockItems++;
    } else if (currentStock <= item.reorder_level) {
      lowStockItems++;
    }
  });

  return {
    totalSales: salesResult.data?.length || 0,
    totalRevenue,
    totalExpenses,
    netProfit,
    totalProducts,
    lowStockItems,
    outOfStockItems,
  };
}

export async function getProfitLossMetrics(): Promise<ProfitLossMetrics> {
  const supabase = await createClient();

  const [salesResult, expensesResult] = await Promise.all([
    supabase.from("sales_records").select("product_name, quantity, selling_price"),
    supabase.from("expenses").select("amount, category"),
  ]);

  const totalRevenue = salesResult.data?.reduce(
    (sum, sale) => sum + (sale.quantity * sale.selling_price), 0
  ) || 0;

  const totalExpenses = expensesResult.data?.reduce(
    (sum, expense) => sum + Number(expense.amount), 0
  ) || 0;

  const grossProfit = totalRevenue - totalExpenses;
  const netProfit = grossProfit;

  const productSales = salesResult.data?.reduce((acc: Record<string, number>, sale) => {
    const revenue = sale.quantity * sale.selling_price;
    acc[sale.product_name] = (acc[sale.product_name] || 0) + revenue;
    return acc;
  }, {}) || {};

  const bestSellingProduct = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const expensesByCategory = expensesResult.data?.reduce((acc: Record<string, number>, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {}) || {};

  const highestExpenseCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return {
    totalRevenue,
    totalExpenses,
    grossProfit,
    netProfit,
    bestSellingProduct,
    highestExpenseCategory,
  };
}

export async function getSalesChartData() {
  const supabase = await createClient();
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("sales_records")
    .select("date, quantity, selling_price")
    .gte("date", thirtyDaysAgo)
    .order("date");

  if (error) throw error;

  const salesByDate = data?.reduce((acc: Record<string, number>, sale) => {
    const revenue = sale.quantity * sale.selling_price;
    acc[sale.date] = (acc[sale.date] || 0) + revenue;
    return acc;
  }, {}) || {};

  return Object.entries(salesByDate).map(([date, revenue]) => ({
    date,
    revenue,
  }));
}

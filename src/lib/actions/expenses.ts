"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Expense } from "@/types/business";

export async function getExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return data as Expense[];
}

export async function createExpense(formData: {
  date: string;
  category: string;
  description: string;
  amount: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert([formData])
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return data;
}

export async function updateExpense(id: string, formData: Partial<Expense>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return data;
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function getExpensesSummary() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("expenses")
    .select("amount, category");

  if (error) throw error;

  const total = data?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
  
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: monthlyData } = await supabase
    .from("expenses")
    .select("amount")
    .gte("date", monthAgo);

  const monthly = monthlyData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

  return { total, monthly };
}

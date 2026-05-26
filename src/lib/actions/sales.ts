"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SalesRecord } from "@/types/business";

export async function getSalesRecords() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_records")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return data as SalesRecord[];
}

export async function createSalesRecord(formData: {
  date: string;
  product_id: string;
  product_name: string;
  quantity: number;
  selling_price: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_records")
    .insert([formData])
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  return data;
}

export async function updateSalesRecord(
  id: string,
  formData: Partial<SalesRecord>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_records")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return data;
}

export async function deleteSalesRecord(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sales_records")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/sales");
  revalidatePath("/dashboard");
}

export async function getSalesSummary() {
  const supabase = await createClient();
  
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dailyResult, weeklyResult, monthlyResult] = await Promise.all([
    supabase.from("sales_records").select("quantity, selling_price").eq("date", today),
    supabase.from("sales_records").select("quantity, selling_price").gte("date", weekAgo),
    supabase.from("sales_records").select("quantity, selling_price").gte("date", monthAgo),
  ]);

  const calculateTotal = (records: any[]) =>
    records?.reduce((sum, record) => sum + (record.quantity * record.selling_price), 0) || 0;

  return {
    daily: calculateTotal(dailyResult.data || []),
    weekly: calculateTotal(weeklyResult.data || []),
    monthly: calculateTotal(monthlyResult.data || []),
  };
}

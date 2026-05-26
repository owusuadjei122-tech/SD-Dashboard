"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Inventory } from "@/types/business";

export async function getInventory() {
  const supabase = await createClient();
  
  const { data: inventoryData, error: invError } = await supabase
    .from("inventory")
    .select("*")
    .order("product_name");

  if (invError) throw invError;

  const { data: salesData, error: salesError } = await supabase
    .from("sales_records")
    .select("product_id, quantity");

  if (salesError) throw salesError;

  const salesByProduct = salesData?.reduce((acc: Record<string, number>, sale) => {
    acc[sale.product_id] = (acc[sale.product_id] || 0) + sale.quantity;
    return acc;
  }, {}) || {};

  const enrichedInventory = inventoryData?.map((item) => {
    const quantitySold = salesByProduct[item.product_id] || 0;
    const currentStock = item.starting_stock - quantitySold;
    let status = 'In Stock';
    
    if (currentStock <= 0) {
      status = 'Out of Stock';
    } else if (currentStock <= item.reorder_level) {
      status = 'Low Stock';
    }

    return {
      ...item,
      quantity_sold: quantitySold,
      current_stock: currentStock,
      status,
    };
  });

  return enrichedInventory || [];
}

export async function createInventory(formData: {
  product_id: string;
  product_name: string;
  starting_stock: number;
  reorder_level: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .insert([formData])
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return data;
}

export async function updateInventory(id: string, formData: Partial<Inventory>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return data;
}

export async function restockInventory(id: string, additionalStock: number) {
  const supabase = await createClient();
  
  const { data: current } = await supabase
    .from("inventory")
    .select("starting_stock")
    .eq("id", id)
    .single();

  if (!current) throw new Error("Inventory item not found");

  const { data, error } = await supabase
    .from("inventory")
    .update({ starting_stock: current.starting_stock + additionalStock })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return data;
}

export async function deleteInventory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductCosting } from "@/types/business";

export async function getProductCosting() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_costing")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ProductCosting[];
}

export async function createProductCosting(formData: {
  product_name: string;
  cost_price: number;
  selling_price: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_costing")
    .insert([formData])
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/product-costing");
  revalidatePath("/dashboard");
  return data;
}

export async function updateProductCosting(
  id: string,
  formData: Partial<ProductCosting>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_costing")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/product-costing");
  revalidatePath("/dashboard");
  return data;
}

export async function deleteProductCosting(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_costing")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/product-costing");
  revalidatePath("/dashboard");
}

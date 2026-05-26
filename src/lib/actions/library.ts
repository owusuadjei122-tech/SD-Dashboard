"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LibraryBook, LibraryBorrow, LibraryExpense } from "@/types/business";

// BOOKS
export async function getLibraryBooks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_books")
    .select("*")
    .order("title");

  if (error) throw error;

  const { data: borrowData } = await supabase
    .from("library_borrows")
    .select("book_id")
    .eq("status", "borrowed");

  const borrowedCounts = borrowData?.reduce((acc: Record<string, number>, borrow) => {
    acc[borrow.book_id] = (acc[borrow.book_id] || 0) + 1;
    return acc;
  }, {}) || {};

  return data?.map((book) => ({
    ...book,
    borrowed_copies: borrowedCounts[book.id] || 0,
    status: book.available_copies > 0 ? 'Available' : 'Unavailable',
  })) || [];
}

export async function createLibraryBook(formData: {
  title: string;
  author: string;
  category: string;
  isbn?: string;
  quantity: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_books")
    .insert([{ ...formData, available_copies: formData.quantity }])
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/library");
  return data;
}

export async function updateLibraryBook(id: string, formData: Partial<LibraryBook>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_books")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/library");
  return data;
}

export async function deleteLibraryBook(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("library_books").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/library");
}

// BORROWS
export async function getLibraryBorrows() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_borrows")
    .select(`
      *,
      library_books (title, author)
    `)
    .order("borrow_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createLibraryBorrow(formData: {
  book_id: string;
  borrower_name: string;
  borrower_email?: string;
  borrow_date: string;
  due_date: string;
}) {
  const supabase = await createClient();
  
  const { data: book } = await supabase
    .from("library_books")
    .select("available_copies")
    .eq("id", formData.book_id)
    .single();

  if (!book || book.available_copies <= 0) {
    throw new Error("Book not available");
  }

  const { data, error } = await supabase
    .from("library_borrows")
    .insert([formData])
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("library_books")
    .update({ available_copies: book.available_copies - 1 })
    .eq("id", formData.book_id);

  revalidatePath("/library");
  return data;
}

export async function returnLibraryBook(id: string, fineAmount: number = 0) {
  const supabase = await createClient();
  
  const { data: borrow } = await supabase
    .from("library_borrows")
    .select("book_id")
    .eq("id", id)
    .single();

  if (!borrow) throw new Error("Borrow record not found");

  const { data, error } = await supabase
    .from("library_borrows")
    .update({
      status: "returned",
      return_date: new Date().toISOString().split('T')[0],
      fine_amount: fineAmount,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  const { data: book } = await supabase
    .from("library_books")
    .select("available_copies")
    .eq("id", borrow.book_id)
    .single();

  if (book) {
    await supabase
      .from("library_books")
      .update({ available_copies: book.available_copies + 1 })
      .eq("id", borrow.book_id);
  }

  revalidatePath("/library");
  return data;
}

// LIBRARY EXPENSES
export async function getLibraryExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_expenses")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return data as LibraryExpense[];
}

export async function createLibraryExpense(formData: {
  date: string;
  category: string;
  description: string;
  amount: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_expenses")
    .insert([formData])
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/library");
  return data;
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProduct(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as 'wear' | 'book'
  const price = parseFloat(formData.get('price') as string)
  
  const { data, error } = await supabase
    .from('products')
    .insert([{ name, description, type, price }])
    .select()

  if (error) {
    console.error('Error adding product:', error)
    return { error: error.message }
  }

  // Revalidate the appropriate page based on product type
  revalidatePath(type === 'wear' ? '/wear' : '/library')
  return { data }
}

export async function getProducts(type: 'wear' | 'book') {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching ${type}s:`, error)
    return []
  }

  return data
}

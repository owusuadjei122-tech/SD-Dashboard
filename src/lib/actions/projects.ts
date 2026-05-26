'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProject(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, description }])
    .select()

  if (error) {
    console.error('Error adding project:', error)
    return { error: error.message }
  }

  revalidatePath('/projects')
  return { data }
}

export async function getProjects() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data
}

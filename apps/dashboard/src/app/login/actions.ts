'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type FormState = { error: string | null; success: boolean };

export async function login(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const supabase = await createClient()

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      return { error: error.message, success: false }
    }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred', success: false }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(_prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const supabase = await createClient()

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
      console.error('Supabase signup error:', error.message)
      return { error: error.message, success: false }
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred', success: false }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = await createClient();

  // 1. Attempt to sign out on the backend (local scope to prevent global invalidation bugs)
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.error('Supabase signOut API failed, proceeding to clear cookies locally.', error);
  }

  // 2. Prepare the redirect response
  revalidatePath('/', 'layout');
  const url = new URL('/login', request.url);
  const response = NextResponse.redirect(url);

  // 3. Forcefully purge ALL Supabase auth cookies manually (handles chunking)
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      // Delete from the incoming cookie store (for this request lifecycle)
      cookieStore.delete(cookie.name);
      // Delete from the outgoing response to instruct the browser to drop it
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
    }
  });

  return response;
}

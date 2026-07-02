import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const cookieStore = await cookies();

  // 1. Prepare the redirect response and purge Next.js caches
  revalidatePath('/', 'layout');
  const url = new URL('/jobs', request.url);
  const response = NextResponse.redirect(url);

  // 2. Hard-wipe existing session cookies from the response and local store
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.delete(cookie.name);
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
    }
  });

  // 3. Initialize an empty Supabase client that ignores incoming cookies to ensure a fresh session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []; // Force empty store for initialization
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Update both the incoming store and the outgoing response
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          } catch {
            // Ignore in Route Handlers
          }
        },
      },
    }
  );

  // 4. Create the new anonymous session
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data?.user) {
    console.error('Anonymous login error:', error?.message);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. Seed the database with sample data (using the service role key to fetch templates)
  try {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Seed Base Resume
    const { data: ownerResume } = await serviceClient
      .from('base_resumes')
      .select('extracted_content')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    await supabase.from('base_resumes').insert({
      user_id: data.user.id,
      file_url: 'anonymous_copy',
      extracted_content:
        ownerResume?.extracted_content || 'Senior Software Engineer with 10 years of experience.',
    });
  } catch (seedError) {
    console.error('Failed to seed anonymous data:', seedError);
    // Continue anyway so they at least get logged in
  }

  return response;
}

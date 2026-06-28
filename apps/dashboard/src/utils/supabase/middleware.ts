import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    let response: NextResponse;

    // If it's an API route, return 401 Unauthorized instead of redirecting
    if (request.nextUrl.pathname.startsWith('/api/')) {
      response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      response = NextResponse.redirect(url);
    }

    // Preserve any updated cookies from the supabase client
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });

    return response;
  }

  // If user is already authenticated and trying to access login/auth, redirect to dashboard
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/jobs';
    const response = NextResponse.redirect(url);

    // Preserve any updated cookies from the supabase client
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });

    return response;
  }

  return supabaseResponse;
}

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { logger } from '@job-hunt/logger';

const fetchWithTelemetry = async (url: RequestInfo | URL, options?: RequestInit) => {
  const startTime = Date.now();
  logger.debug(
    `[Supabase API] ${options?.method || 'GET'} ${typeof url === 'object' ? JSON.stringify(url) : String(url)}`
  );

  const response = await fetch(url, options);
  const duration = Date.now() - startTime;

  logger.info(`[Supabase API] ↳ ${response.status} ${response.statusText} (${duration}ms)`);

  if (!response.ok) {
    try {
      const clonedRes = response.clone();
      const errBody = await clonedRes.json();
      logger.error({ errBody, url, status: response.status }, `[Supabase Error Detail]`);
    } catch (e) {
      logger.error(e instanceof Error ? e.message : String(e));
    }
  }

  return response;
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchWithTelemetry,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (e) {
            logger.error(e instanceof Error ? e.message : String(e));
          }
        },
      },
    }
  );
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: fetchWithTelemetry,
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

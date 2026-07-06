import { createClient } from '@/utils/supabase/server';

export async function verifyAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function incrementActionLimit() {
  const supabase = await createClient();
  const { data: limitCheck, error: limitError } = await supabase.rpc('increment_action_limit');

  if (limitError || !limitCheck) {
    return {
      success: false,
      error: 'Daily manual trigger limit reached (max 2/day). Please try again tomorrow.',
    };
  }

  return { success: true };
}

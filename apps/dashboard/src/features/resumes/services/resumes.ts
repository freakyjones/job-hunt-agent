import { createClient } from '@/utils/supabase/server';
import { GeneratedResume } from '@job-hunt/types';

export async function getResumes(): Promise<{ data: GeneratedResume[] | null; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('generated_resumes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as GeneratedResume[] };
}

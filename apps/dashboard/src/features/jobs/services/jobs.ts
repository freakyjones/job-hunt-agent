import { createClient } from '@/utils/supabase/server';
import { Job, JobStatusEnum } from '@job-hunt/types';

export async function getJobs(): Promise<{ data: Job[] | null; error?: string }> {
  const supabase = await createClient();

  let attempts = 0;
  while (attempts < 3) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('score', { ascending: false, nullsFirst: false })
        .limit(100);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as Job[] };
    } catch (err: unknown) {
      attempts++;
      if (attempts >= 3) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to database.';
        return { data: null, error: errorMessage };
      }
      // Simple exponential backoff: 500ms, 1000ms
      await new Promise((res) => setTimeout(res, 500 * attempts));
    }
  }
  return { data: null, error: 'Network timeout.' };
}

export async function updateJobStatus(id: string, newStatusStr: string): Promise<void> {
  const newStatus = JobStatusEnum.parse(newStatusStr);
  const supabase = await createClient();

  const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export interface WorkflowRun {
  id: string;
  run_id: number;
  status: string;
  conclusion: string | null;
  workflow_name: string;
  created_at: string;
  updated_at: string;
}

export async function getRecentWorkflows(): Promise<{
  data: WorkflowRun[] | null;
  error?: string;
}> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('github_workflow_runs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as WorkflowRun[] };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve workflow runs.';
    return { data: null, error: errorMessage };
  }
}

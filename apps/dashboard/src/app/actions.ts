'use server';

import { getJobs, updateJobStatus } from '../features/jobs/services/jobs';
import { triggerScraperWorkflow } from '../features/jobs/services/github';
import { getResumes } from '../features/resumes/services/resumes';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

async function verifyAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
}

export async function getResumesAction() {
  try {
    await verifyAuth();
    const result = await getResumes();
    if (result.error) {
      console.error('[Action: getResumesAction] Error:', result.error);
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unauthorized' };
  }
}

export async function getJobsAction() {
  try {
    await verifyAuth();
    const data = await getJobs();
    return { success: true, data };
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('[Action: getJobsAction] Error:', e.message);
      return { success: false, error: e.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}

export async function updateJobStatusAction(id: string, newStatusStr: string) {
  try {
    await verifyAuth();
    await updateJobStatus(id, newStatusStr);
    revalidatePath('/jobs');
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('[Action: updateJobStatusAction] Error:', e.message);
      return { success: false, error: e.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}

export async function triggerGitHubAction(command: string = 'all') {
  try {
    await verifyAuth();
    await triggerScraperWorkflow(command);
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('[Action: triggerGitHubAction] Error:', e.message);
      return { success: false, error: e.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}

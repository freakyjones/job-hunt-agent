'use server';

import { getJobs, updateJobStatus } from '../features/jobs/services/jobs';
import { triggerScraperWorkflow } from '../features/jobs/services/github';
import { getResumes } from '../features/resumes/services/resumes';
import { revalidatePath } from 'next/cache';

export async function getResumesAction() {
  try {
    const data = await getResumes();
    return { success: true, data };
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('[Action: getResumesAction] Error:', e.message);
      return { success: false, error: e.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}

export async function getJobsAction() {
  try {
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

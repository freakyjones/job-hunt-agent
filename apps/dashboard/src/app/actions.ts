'use server';

import { getJobs, updateJobStatus } from '../features/jobs/services/jobs';
import { getResumes } from '../features/resumes/services/resumes';
import { revalidatePath } from 'next/cache';
import { verifyAuth, incrementActionLimit } from '../features/core/services/auth';
import {
  triggerGitHubActionService,
  triggerNetworkingActionService,
  dismissWorkflowRunService,
} from '../features/jobs/services/workflow';

export async function getResumesAction() {
  try {
    await verifyAuth();
    const result = await getResumes();
    if (result.error) {
      console.error(
        '[Action: getResumesAction] Error:',
        (result.error as unknown) instanceof Error
          ? (result.error as unknown as Error).message
          : String(result.error)
      );
      return {
        success: false,
        error:
          (result.error as unknown) instanceof Error
            ? (result.error as unknown as Error).message
            : String(result.error),
      };
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
    console.error('[Action: getJobsAction] Error:', e instanceof Error ? e.message : String(e));
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateJobStatusAction(id: string, newStatusStr: string) {
  try {
    await verifyAuth();
    await updateJobStatus(id, newStatusStr);
    revalidatePath('/jobs');
    return { success: true };
  } catch (e: unknown) {
    console.error(
      '[Action: updateJobStatusAction] Error:',
      e instanceof Error ? e.message : String(e)
    );
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function triggerGitHubAction(command: string = 'all') {
  try {
    const user = await verifyAuth();

    // Check and increment rate limit via RPC
    const limitResult = await incrementActionLimit();
    if (!limitResult.success) {
      return {
        success: false,
        error: limitResult.error,
      };
    }

    const workflowResult = await triggerGitHubActionService(command, user.id, user.email);
    if (workflowResult.error) {
      return {
        success: false,
        error:
          workflowResult.error instanceof Error
            ? workflowResult.error.message
            : String(workflowResult.error),
      };
    }

    return { success: true };
  } catch (e: unknown) {
    console.error(
      '[Action: triggerGitHubAction] Error:',
      e instanceof Error ? e.message : String(e)
    );
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function triggerNetworkingAction() {
  try {
    const user = await verifyAuth();

    // Check and increment rate limit via RPC
    const limitResult = await incrementActionLimit();
    if (!limitResult.success) {
      return {
        success: false,
        error: limitResult.error,
      };
    }

    const workflowResult = await triggerNetworkingActionService(user.id, user.email);
    if (workflowResult.error) {
      return {
        success: false,
        error:
          workflowResult.error instanceof Error
            ? workflowResult.error.message
            : String(workflowResult.error),
      };
    }

    return { success: true };
  } catch (e: unknown) {
    console.error(
      '[Action: triggerNetworkingAction] Error:',
      e instanceof Error ? e.message : String(e)
    );
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function dismissWorkflowRunAction(runId: number) {
  try {
    const user = await verifyAuth();

    const result = await dismissWorkflowRunService(runId, user.id);
    if (result.error) {
      return {
        success: false,
        error: result.error instanceof Error ? result.error.message : String(result.error),
      };
    }

    return { success: true };
  } catch (e: unknown) {
    console.error(
      '[Action: dismissWorkflowRunAction] Error:',
      e instanceof Error ? e.message : String(e)
    );
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

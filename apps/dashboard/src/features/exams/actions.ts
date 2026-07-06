'use server';

import { verifyAuth } from '../core/services/auth';
import { createAdminClient } from '@/utils/supabase/server';
import { SubmitExamPayloadSchema, SubmitExamPayload } from '@job-hunt/types';
import { revalidatePath } from 'next/cache';
import {
  checkExistingExamGeneration,
  queueExamGeneration,
  triggerExamGeneration,
  validateAndFetchPendingExam,
  calculateExamScoreAndFeedback,
  saveExamScore,
} from './services/exam.service';

export async function generateExamAction(jobId?: string) {
  try {
    const user = await verifyAuth();
    const supabase = createAdminClient();

    const checkResult = await checkExistingExamGeneration(supabase, user.id);

    if (checkResult.error) {
      return { success: false, error: checkResult.error };
    }

    if (checkResult.existingJobId) {
      await triggerExamGeneration(supabase);
      return { success: true, jobId: checkResult.existingJobId };
    }

    const queueResult = await queueExamGeneration(supabase, user.id, jobId);

    if (queueResult.error || !queueResult.jobId) {
      return { success: false, error: queueResult.error };
    }

    await triggerExamGeneration(supabase);

    return { success: true, jobId: queueResult.jobId };
  } catch (e: unknown) {
    console.error(
      '[Action: generateExamAction] Error:',
      e instanceof Error ? e.message : String(e)
    );
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function submitExamAction(examId: string, payload: SubmitExamPayload) {
  try {
    const user = await verifyAuth();

    const parsedPayload = SubmitExamPayloadSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return { success: false, error: 'Invalid submission data.' };
    }

    const supabase = createAdminClient();

    const validationResult = await validateAndFetchPendingExam(supabase, examId, user.id);

    if (validationResult.error || !validationResult.questions) {
      return { success: false, error: validationResult.error };
    }

    const { percentageScore, feedback } = calculateExamScoreAndFeedback(
      validationResult.questions,
      parsedPayload.data
    );

    const saveResult = await saveExamScore(supabase, examId, percentageScore);

    if (saveResult.error) {
      return { success: false, error: saveResult.error };
    }

    revalidatePath('/exams');
    revalidatePath(`/exams/${examId}`);

    return { success: true, score: percentageScore, feedback };
  } catch (e: unknown) {
    console.error('[Action: submitExamAction] Error:', e instanceof Error ? e.message : String(e));
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

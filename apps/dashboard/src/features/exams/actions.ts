'use server';

import { verifyAuth } from '../core/services/auth';

import { createAdminClient } from '@/utils/supabase/server';
import { SubmitExamPayloadSchema, SubmitExamPayload } from '@job-hunt/types';
import { revalidatePath } from 'next/cache';

export async function generateExamAction(jobId?: string) {
  try {
    const user = await verifyAuth();
    const supabase = createAdminClient();

    // 1. Check if user already has a pending exam or a pending job
    const { data: existingExam } = await supabase
      .from('exams')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'PENDING')
      .maybeSingle();

    if (existingExam) {
      return {
        success: false,
        error: 'You already have a pending exam. Please complete it first.',
      };
    }

    const { data: existingJob } = await supabase
      .from('exam_generation_jobs')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (existingJob) {
      // Re-trigger the edge function just in case the previous invocation failed or dropped
      try {
        await supabase.functions.invoke('process-exams');
      } catch (err) {
        console.error('[Action: generateExamAction] Error invoking edge function:', err);
      }
      return { success: true, jobId: existingJob.id };
    }

    // 2. Insert new job into queue
    const { data: newJob, error: jobError } = await supabase
      .from('exam_generation_jobs')
      .insert({
        user_id: user.id,
        job_id: jobId || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (jobError || !newJob) {
      console.error('[Action: generateExamAction] Error inserting job:', jobError);
      return { success: false, error: 'Failed to queue exam generation.' };
    }

    // 3. Trigger the Edge Function to start processing immediately
    // We must await this, otherwise the Next.js serverless environment will kill the background promise before the fetch is sent!
    // The edge function returns 202 Accepted immediately, so this is very fast.
    try {
      await supabase.functions.invoke('process-exams');
    } catch (err) {
      console.error('[Action: generateExamAction] Error invoking edge function:', err);
    }

    return { success: true, jobId: newJob.id };
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

    // Validate payload
    const parsedPayload = SubmitExamPayloadSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return { success: false, error: 'Invalid submission data.' };
    }

    const supabase = createAdminClient();

    // Verify exam belongs to user and is PENDING
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('user_id', user.id)
      .eq('status', 'PENDING')
      .single();

    if (examError || !exam) {
      return { success: false, error: 'Exam not found or already completed.' };
    }

    // Fetch all questions and their correct answers for this exam
    const { data: questions, error: qError } = await supabase
      .from('exam_questions')
      .select(
        `
        id,
        exam_answers (
          correct_option,
          explanation
        )
      `
      )
      .eq('exam_id', examId);

    if (qError || !questions) {
      return { success: false, error: 'Failed to retrieve exam questions.' };
    }

    let score = 0;
    const totalQuestions = questions.length;
    const feedback: Record<
      string,
      { correct: boolean; correct_option: string; explanation: string }
    > = {};

    for (const q of questions) {
      const answerRow = Array.isArray(q.exam_answers) ? q.exam_answers[0] : q.exam_answers;
      if (!answerRow) continue;

      const submitted = parsedPayload.data.find((p) => p.question_id === q.id);
      const isCorrect = submitted?.selected_option === answerRow.correct_option;

      if (isCorrect) {
        score++;
      }

      feedback[q.id] = {
        correct: isCorrect,
        correct_option: answerRow.correct_option,
        explanation: answerRow.explanation,
      };
    }

    const percentageScore = Math.round((score / totalQuestions) * 100);

    // Update exam status and score
    const { error: updateError } = await supabase
      .from('exams')
      .update({
        status: 'COMPLETED',
        score: percentageScore,
      })
      .eq('id', examId);

    if (updateError) {
      return { success: false, error: 'Failed to save exam score.' };
    }

    revalidatePath('/exams');
    revalidatePath(`/exams/${examId}`);

    return { success: true, score: percentageScore, feedback };
  } catch (e: unknown) {
    console.error('[Action: submitExamAction] Error:', e instanceof Error ? e.message : String(e));
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

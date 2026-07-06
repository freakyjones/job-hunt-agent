import { SupabaseClient } from '@supabase/supabase-js';

export async function fetchExamDetails(supabase: SupabaseClient, examId: string, userId: string) {
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*, jobs(company, role)')
    .eq('id', examId)
    .eq('user_id', userId)
    .single();

  return { exam, examError };
}

export async function fetchCompletedExamQuestions(adminClient: SupabaseClient, examId: string) {
  const { data: qData, error: qError } = await adminClient
    .from('exam_questions')
    .select(
      `
      *,
      exam_answers (
        correct_option,
        explanation
      )
    `
    )
    .eq('exam_id', examId);

  let questions = [];
  let feedback:
    | Record<string, { correct: boolean; correct_option: string; explanation: string }>
    | undefined = undefined;

  if (qError) {
    console.error(qError);
  } else if (qData) {
    questions = qData;
    feedback = {};
    for (const q of qData) {
      const answerRow = Array.isArray(q.exam_answers) ? q.exam_answers[0] : q.exam_answers;
      if (answerRow) {
        feedback[q.id] = {
          correct: true,
          correct_option: answerRow.correct_option,
          explanation: answerRow.explanation,
        };
      }
    }
  }

  return { questions, feedback };
}

export async function fetchPendingExamQuestions(supabase: SupabaseClient, examId: string) {
  const { data: qData, error: qError } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('exam_id', examId);

  if (qError) {
    console.error(qError);
    return [];
  }

  return qData || [];
}

export async function checkExistingExamGeneration(supabase: SupabaseClient, userId: string) {
  const { data: existingExam } = await supabase
    .from('exams')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'PENDING')
    .maybeSingle();

  if (existingExam) {
    return { error: 'You already have a pending exam. Please complete it first.' };
  }

  const { data: existingJob } = await supabase
    .from('exam_generation_jobs')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .maybeSingle();

  if (existingJob) {
    return { existingJobId: existingJob.id };
  }

  return { success: true };
}

export async function queueExamGeneration(
  supabase: SupabaseClient,
  userId: string,
  jobId?: string
) {
  const { data: newJob, error: jobError } = await supabase
    .from('exam_generation_jobs')
    .insert({
      user_id: userId,
      job_id: jobId || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (jobError || !newJob) {
    console.error('[Service: queueExamGeneration] Error inserting job:', jobError);
    return { error: 'Failed to queue exam generation.' };
  }

  return { jobId: newJob.id };
}

export async function triggerExamGeneration(supabase: SupabaseClient) {
  try {
    await supabase.functions.invoke('process-exams');
  } catch (err) {
    console.error('[Service: triggerExamGeneration] Error invoking edge function:', err);
  }
}

export async function validateAndFetchPendingExam(
  supabase: SupabaseClient,
  examId: string,
  userId: string
) {
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .eq('user_id', userId)
    .eq('status', 'PENDING')
    .single();

  if (examError || !exam) {
    return { error: 'Exam not found or already completed.' };
  }

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
    return { error: 'Failed to retrieve exam questions.' };
  }

  return { questions };
}

import { SubmitExamPayload } from '@job-hunt/types';

export function calculateExamScoreAndFeedback(
  questions: Array<{ id: string; exam_answers?: unknown }>,
  payloadData: SubmitExamPayload
) {
  let score = 0;
  const totalQuestions = questions.length;
  const feedback: Record<
    string,
    { correct: boolean; correct_option: string; explanation: string }
  > = {};

  for (const q of questions) {
    const answerRow = Array.isArray(q.exam_answers) ? q.exam_answers[0] : q.exam_answers;
    if (!answerRow) continue;

    const submitted = payloadData.find((p) => p.question_id === q.id);
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
  return { percentageScore, feedback };
}

export async function saveExamScore(supabase: SupabaseClient, examId: string, score: number) {
  const { error: updateError } = await supabase
    .from('exams')
    .update({
      status: 'COMPLETED',
      score,
    })
    .eq('id', examId);

  if (updateError) {
    return { error: 'Failed to save exam score.' };
  }

  return { success: true };
}

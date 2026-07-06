import { createClient, createAdminClient } from '@/utils/supabase/server';
import { verifyAuth } from '@/features/core/services/auth';
import { TakeExamForm } from '@/features/exams/components/TakeExamForm';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';

export default async function ExamIdPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAuth();
  const resolvedParams = await params;
  const examId = resolvedParams.id;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Fetch the exam
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*, jobs(company, role)')
    .eq('id', examId)
    .eq('user_id', user.id)
    .single();

  if (examError || !exam) {
    notFound();
  }

  const isCompleted = exam.status === 'COMPLETED';

  // Fetch questions (and answers if completed)
  let questions = [];
  let feedback:
    | Record<string, { correct: boolean; correct_option: string; explanation: string }>
    | undefined = undefined;

  if (isCompleted) {
    // If completed, we need the answers which requires admin client
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

    if (qError) {
      console.error(qError);
    } else if (qData) {
      questions = qData;
      feedback = {};
      for (const q of qData) {
        const answerRow = Array.isArray(q.exam_answers) ? q.exam_answers[0] : q.exam_answers;
        if (answerRow) {
          feedback[q.id] = {
            correct: true, // We don't store individual user answers currently, just overall score.
            // For a read-only view, we just show the correct option and explanation.
            // The user won't see their own wrong choices if we don't save them.
            // Wait, the TakeExamForm uses `answers` state which is empty on load.
            // So it will just show the correct options highlighted and the explanation.
            correct_option: answerRow.correct_option,
            explanation: answerRow.explanation,
          };
        }
      }
    }
  } else {
    // If pending, just fetch questions without answers
    const { data: qData, error: qError } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId);

    if (qError) {
      console.error(qError);
    } else if (qData) {
      questions = qData;
    }
  }

  return (
    <div className={styles.container}>
      <Link href="/exams" className={styles.backLink}>
        &larr; Back to Exams
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>
          {isCompleted
            ? 'Assessment Results'
            : exam.job_id
              ? 'Job-based Skill Assessment'
              : 'Resume Skill Assessment'}
        </h1>
        {exam.jobs && (
          <p className={styles.jobContext}>
            Targeted for:{' '}
            <span className={styles.jobHighlight}>
              {exam.jobs.role} at {exam.jobs.company}
            </span>
          </p>
        )}
        <p className={styles.subtitle}>
          {isCompleted
            ? 'Review the correct answers and explanations below.'
            : 'Select the best answer for each question.'}
        </p>
      </header>

      <div className={styles.formWrapper}>
        <TakeExamForm
          examId={examId}
          questions={questions}
          initialFeedback={feedback}
          initialScore={isCompleted ? exam.score : null}
        />
      </div>
    </div>
  );
}

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { verifyAuth } from '@/features/core/services/auth';
import { TakeExamForm } from '@/features/exams/components/TakeExamForm';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';
import {
  fetchExamDetails,
  fetchCompletedExamQuestions,
  fetchPendingExamQuestions,
} from '@/features/exams/services/exam.service';

type Props = { readonly params: Promise<{ id: string }> };

export default async function ExamIdPage({ params }: Props) {
  const user = await verifyAuth();
  const resolvedParams = await params;
  const examId = resolvedParams.id;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { exam, examError } = await fetchExamDetails(supabase, examId, user.id);

  if (examError || !exam) {
    notFound();
  }

  const isCompleted = exam.status === 'COMPLETED';

  let questions = [];
  let feedback:
    | Record<string, { correct: boolean; correct_option: string; explanation: string }>
    | undefined = undefined;

  if (isCompleted) {
    const completedData = await fetchCompletedExamQuestions(adminClient, examId);
    questions = completedData.questions;
    feedback = completedData.feedback;
  } else {
    questions = await fetchPendingExamQuestions(supabase, examId);
  }

  let titleText = 'Resume Skill Assessment';
  if (isCompleted) {
    titleText = 'Assessment Results';
  } else if (exam.job_id) {
    titleText = 'Job-based Skill Assessment';
  }

  return (
    <div className={styles.container}>
      <Link href="/exams" className={styles.backLink}>
        &larr; Back to Exams
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{titleText}</h1>
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

import { createClient } from '@/utils/supabase/server';
import { verifyAuth } from '@/features/core/services/auth';
import { ExamCard } from '@/features/exams/components/ExamCard';
import { GenerateExamButton } from '@/features/exams/components/GenerateExamButton';
import styles from './page.module.css';

export default async function ExamsPage() {
  const user = await verifyAuth();
  const supabase = await createClient();

  // Fetch exams for the user, joining job info if available
  const { data: exams, error } = await supabase
    .from('exams')
    .select('*, jobs(company, role)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching exams', error);
  }

  // Fetch active exam generation jobs
  const { data: activeJobs, error: activeJobsError } = await supabase
    .from('exam_generation_jobs')
    .select('*, jobs(company, role)')
    .in('status', ['pending', 'processing'])
    .eq('user_id', user.id);

  if (activeJobsError) {
    console.error('Error fetching active exam jobs', activeJobsError);
  }

  // Fetch user's applied and applying jobs for the generator dropdown
  const { data: appliedJobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, company, role')
    .eq('user_id', user.id)
    .in('status', ['APPLIED', 'APPLYING'])
    .order('created_at', { ascending: false });

  if (jobsError) {
    console.error('Error fetching applied jobs', jobsError);
  }

  // Combine active generation jobs and exams
  const combinedCards = [
    ...(activeJobs || []).map((job) => ({
      id: job.id,
      job_id: job.job_id,
      status: 'PROCESSING',
      score: null,
      created_at: job.created_at,
      jobs: job.jobs,
      isJob: true,
    })),
    ...(exams || []).map((exam) => ({
      ...exam,
      isJob: false,
    })),
  ].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

  const hasPendingExam =
    exams?.some((e) => e.status === 'PENDING') || (activeJobs && activeJobs.length > 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Skill Assessments</h1>
          <p className={styles.subtitle}>Test your knowledge based on your resume profile.</p>
        </div>
      </header>

      {!hasPendingExam && (
        <div className={styles.controlsBar}>
          <span className={styles.controlsLabel}>Generate a new assessment:</span>
          <GenerateExamButton jobs={appliedJobs || []} />
        </div>
      )}

      <div className={styles.examGrid}>
        {combinedCards.length > 0 ? (
          combinedCards.map((card) => (
            <ExamCard key={card.id} exam={card as unknown as import('@job-hunt/types').Exam} />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>You haven&apos;t taken any assessments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

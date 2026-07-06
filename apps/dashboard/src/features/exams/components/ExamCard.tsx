import Link from 'next/link';
import { Exam } from '@job-hunt/types';
import styles from './ExamCard.module.css';

export interface ExamWithJob extends Omit<Exam, 'status'> {
  status: string;
  jobs?: {
    company: string;
    role: string;
  } | null;
}

type ExamCardProps = {
  readonly exam: ExamWithJob;
};

export function ExamCard({ exam }: ExamCardProps) {
  const isPending = exam.status === 'PENDING';
  const isProcessing = exam.status === 'PROCESSING';

  let examStateContent = null;
  if (isProcessing) {
    examStateContent = (
      <div className={styles.processingWrapper}>
        <p className={styles.description}>
          We are compiling your personalized exam questions. This takes around 30 seconds...
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>
      </div>
    );
  } else if (isPending) {
    examStateContent = (
      <p className={styles.description}>Your exam is ready. Click below to begin the assessment.</p>
    );
  } else {
    examStateContent = (
      <div className={styles.scoreWrapper}>
        <span className={styles.scoreLabel}>Score:</span>
        <span className={styles.scoreValue}>
          {exam.score !== null && exam.score !== undefined ? `${exam.score}%` : '0%'}
        </span>
      </div>
    );
  }

  let actionsContent = null;
  if (isProcessing) {
    actionsContent = (
      <button className={styles.disabledButton} disabled>
        Generating...
      </button>
    );
  } else if (isPending) {
    actionsContent = (
      <Link href={`/exams/${exam.id}`} className={styles.primaryButton}>
        Take Exam
      </Link>
    );
  } else {
    actionsContent = (
      <Link href={`/exams/${exam.id}`} className={styles.secondaryButton}>
        Review Results
      </Link>
    );
  }

  return (
    <div className={`${styles.card} ${isProcessing ? styles.processingCard : ''}`}>
      <div className={styles.header}>
        <div className={styles.statusBadge} data-status={exam.status}>
          {exam.status}
        </div>
        <div className={styles.date}>{new Date(exam.created_at || '').toLocaleDateString()}</div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>
          {exam.job_id ? 'Job-based Skill Assessment' : 'Resume Skill Assessment'}
        </h3>
        {exam.job_id && (
          <p className={styles.jobContext}>
            Targeted for:{' '}
            <span className={styles.jobHighlight}>
              {exam.jobs
                ? `${exam.jobs.role} at ${exam.jobs.company}`
                : `Job ${exam.job_id.substring(0, 8)}...`}
            </span>
          </p>
        )}

        {examStateContent}
      </div>

      <div className={styles.actions}>{actionsContent}</div>
    </div>
  );
}

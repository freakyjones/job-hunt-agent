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

interface ExamCardProps {
  exam: ExamWithJob;
}

export function ExamCard({ exam }: ExamCardProps) {
  const isPending = exam.status === 'PENDING';
  const isProcessing = exam.status === 'PROCESSING';

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

        {isProcessing ? (
          <div className={styles.processingWrapper}>
            <p className={styles.description}>
              We are compiling your personalized exam questions. This takes around 30 seconds...
            </p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
          </div>
        ) : isPending ? (
          <p className={styles.description}>
            Your exam is ready. Click below to begin the assessment.
          </p>
        ) : (
          <div className={styles.scoreWrapper}>
            <span className={styles.scoreLabel}>Score:</span>
            <span className={styles.scoreValue}>
              {exam.score !== null && exam.score !== undefined ? `${exam.score}%` : '0%'}
            </span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {isProcessing ? (
          <button className={styles.disabledButton} disabled>
            Generating...
          </button>
        ) : isPending ? (
          <Link href={`/exams/${exam.id}`} className={styles.primaryButton}>
            Take Exam
          </Link>
        ) : (
          <Link href={`/exams/${exam.id}`} className={styles.secondaryButton}>
            Review Results
          </Link>
        )}
      </div>
    </div>
  );
}

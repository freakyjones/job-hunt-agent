import React from 'react';
import { Job, JobStatus } from '@job-hunt/types';
import styles from '../../../app/page.module.css';
import { TailorResumeButton } from './TailorResumeButton';

interface JobCardProps {
  job: Job;
  masterResume: string;
  onUpdateStatus: (id: string, newStatus: JobStatus, oldStatus: JobStatus) => void;
}

export const JobCard = React.memo(function JobCard({
  job,
  masterResume,
  onUpdateStatus,
}: JobCardProps) {
  const isAutoApplicable = job.url?.includes('lever.co') || job.url?.includes('greenhouse.io');
  const isHighMatch = (job.score || 0) >= 80;

  return (
    <div className={`${styles.jobCard} animate-fade-in`} data-status={job.status}>
      <div className={styles.jobHeader}>
        <div>
          <h3 className={styles.jobTitle}>{job.role}</h3>
          <p className={styles.jobCompany}>{job.company}</p>
        </div>
        {job.status === JobStatus.ERROR ? (
          <div
            className={styles.scoreBadge}
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--danger)',
              color: 'var(--danger)',
            }}
          >
            ERR
          </div>
        ) : job.status === JobStatus.PENDING ? (
          <div className={styles.pendingBadge}>PENDING</div>
        ) : (
          <div className={styles.scoreBadge} data-high={isHighMatch}>
            <span className={isHighMatch ? 'text-ai-gradient' : ''}>
              {job.score != null ? `${job.score}/100` : 'N/A'}
            </span>
          </div>
        )}
      </div>

      <div className={styles.reasoning}>
        {job.reasoning ||
          (job.status === JobStatus.ERROR
            ? 'Failed to evaluate or apply.'
            : 'Evaluation pending...')}
      </div>

      <div className={styles.actions} style={{ minHeight: '40px' }}>
        <a href={job.url || '#'} target="_blank" rel="noreferrer" className="button button-primary">
          View Job
        </a>

        {(job.status === JobStatus.PENDING ||
          job.status === JobStatus.EVALUATED ||
          job.status === JobStatus.ERROR) && (
          <>
            {isAutoApplicable ? (
              <button
                className="button button-secondary"
                onClick={() => onUpdateStatus(job.id, JobStatus.ACCEPTED, job.status as JobStatus)}
              >
                Queue
              </button>
            ) : (
              <button
                className="button button-secondary"
                onClick={() => onUpdateStatus(job.id, JobStatus.SAVED, job.status as JobStatus)}
              >
                Save
              </button>
            )}
            <button
              className="button button-secondary"
              onClick={() => onUpdateStatus(job.id, JobStatus.REJECTED, job.status as JobStatus)}
            >
              Reject
            </button>
          </>
        )}

        {job.status === JobStatus.ACCEPTED && (
          <button className="button button-secondary" disabled style={{ opacity: 0.5 }}>
            Queued
          </button>
        )}

        {job.status === JobStatus.SAVED && (
          <>
            <TailorResumeButton job={job} masterResumeContent={masterResume} />
            <button
              className="button button-secondary"
              onClick={() => onUpdateStatus(job.id, JobStatus.APPLIED, job.status as JobStatus)}
            >
              Applied
            </button>
          </>
        )}

        {job.status === JobStatus.APPLYING && (
          <button className="button button-secondary" disabled style={{ opacity: 0.5 }}>
            Applying
          </button>
        )}
        {job.status === JobStatus.APPLIED && (
          <button className="button button-secondary" disabled style={{ opacity: 0.5 }}>
            Applied
          </button>
        )}
        {job.status === JobStatus.REJECTED && (
          <button className="button button-secondary" disabled style={{ opacity: 0.5 }}>
            Rejected
          </button>
        )}
      </div>
    </div>
  );
});

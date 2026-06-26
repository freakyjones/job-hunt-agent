import { GeneratedResume } from '@job-hunt/types';
import styles from './ResumeCard.module.css';

interface ResumeCardProps {
  resume: GeneratedResume;
  onDownload: (path: string, fileName: string) => void;
  onView: (id: string) => void;
}

export function ResumeCard({ resume, onDownload, onView }: ResumeCardProps) {
  let snapshot = resume.content?.substring(0, 300) || 'No content available...';
  try {
    if (resume.content?.trim().startsWith('{')) {
      const parsed = JSON.parse(resume.content);
      snapshot =
        `Name: ${parsed.name || 'Unknown'}\nEmail: ${parsed.contact?.split('|')[0]?.trim() || ''}\n\nSummary:\n${parsed.summary || ''}`.substring(
          0,
          300
        );
    }
  } catch (_e) {
    // Ignore and fallback to raw text
  }

  const shortJobId = resume.job_id?.split('-')[0] || 'Generic';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title} title={resume.job_id || undefined}>
            Job ID: {shortJobId}
          </h3>
          <div className={styles.meta}>
            Created: {resume.created_at ? resume.created_at.split('T')[0] : 'Unknown'}
          </div>
        </div>
      </div>

      {resume.tags && resume.tags.length > 0 && (
        <div className={styles.tags}>
          {resume.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className={styles.snapshotContainer}>
        <div className={styles.snapshot}>{snapshot}</div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => onView(resume.id)}
        >
          👁️ View Full
        </button>
        {resume.pdf_url && (
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => onDownload(resume.pdf_url!, `resume_${resume.job_id || 'generic'}.pdf`)}
          >
            📥 Download PDF
          </button>
        )}
      </div>
    </div>
  );
}

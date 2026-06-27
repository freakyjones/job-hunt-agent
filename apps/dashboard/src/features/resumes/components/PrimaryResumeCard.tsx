import { BaseResume } from '@job-hunt/types';
import styles from './PrimaryResumeCard.module.css';

interface PrimaryResumeCardProps {
  resume: BaseResume;
  onDownload: (path: string, fileName: string) => void;
  onView: (id: string) => void;
}

export function PrimaryResumeCard({ resume, onDownload, onView }: PrimaryResumeCardProps) {
  let snapshot = resume.extracted_content?.substring(0, 300) || 'No content available...';
  try {
    if (resume.extracted_content?.trim().startsWith('{')) {
      const parsed = JSON.parse(resume.extracted_content);
      snapshot =
        `Name: ${parsed.name || 'Unknown'}\nEmail: ${parsed.contact?.split('|')[0]?.trim() || ''}\n\nSummary:\n${parsed.summary || ''}`.substring(
          0,
          300
        );
    }
  } catch (_e) {
    // Ignore and fallback to raw text
  }

  return (
    <div className={styles.cardPrimary}>
      <div className={styles.badge}>Primary Resume</div>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Master Profile</h3>
          <div className={styles.meta}>
            Last updated: {resume.updated_at ? resume.updated_at.split('T')[0] : 'Unknown'}
          </div>
        </div>
      </div>

      <div className={styles.snapshotContainer}>
        <div className={styles.snapshot}>{snapshot}</div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => onView(resume.id)}
        >
          👁️ View Extracted Text
        </button>
        {resume.file_url && (
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => onDownload(resume.file_url, `master_resume`)}
          >
            📥 Download Original
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BaseResume } from '@job-hunt/types';
import { uploadBaseResume } from '@/features/profile/services/profile';
import { Spinner } from '@/features/core/components/Spinner';
import styles from './PrimaryResumeCard.module.css';

interface PrimaryResumeCardProps {
  resume: BaseResume;
  onDownload: (path: string, fileName: string) => void;
  onView: (id: string) => void;
}

export function PrimaryResumeCard({ resume, onDownload, onView }: PrimaryResumeCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setError(null);
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const { error: uploadError } = await uploadBaseResume(formData);
        if (uploadError) {
          setError(uploadError);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className={styles.cardPrimary}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,.docx"
        style={{ display: 'none' }}
      />

      <div className={styles.badge}>Primary Resume</div>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Master Profile</h3>
          <div className={styles.meta}>
            Last updated: {resume.updated_at ? resume.updated_at.split('T')[0] : 'Unknown'}
          </div>
        </div>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
        >
          {isUploading ? 'Uploading...' : '🔄 Replace Master Resume'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '4px 0' }}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.snapshotContainer}>
        {isUploading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80px',
              gap: '8px',
            }}
          >
            <Spinner width={24} height={24} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Extracting and re-parsing resume...
            </span>
          </div>
        ) : (
          <div className={styles.snapshot}>{snapshot}</div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => onView(resume.id)}
          disabled={isUploading}
        >
          👁️ View Extracted Text
        </button>
        {resume.file_url && (
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => onDownload(resume.file_url, `master_resume`)}
            disabled={isUploading}
          >
            📥 Download Original
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { BaseResume } from '@job-hunt/types';
import { Spinner } from '@/features/core/components/Spinner';
import { MasterResumeUploader } from './MasterResumeUploader';
import { TargetRolesEditor } from './TargetRolesEditor';
import styles from './PrimaryResumeCard.module.css';

interface PrimaryResumeCardProps {
  resume: BaseResume;
  onDownload: (path: string, fileName: string) => void;
  onView: (id: string) => void;
}

export function PrimaryResumeCard({ resume, onDownload, onView }: PrimaryResumeCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

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

  const handleUploadStart = () => {
    setError(null);
    setIsUploading(true);
  };

  const handleUploadComplete = (contentChanged: boolean) => {
    setIsUploading(false);
    if (contentChanged) {
      setIsAiProcessing(true);
    }
  };

  const handleUploadError = (errMsg: string) => {
    setIsUploading(false);
    setError(errMsg);
  };

  const handleRolesError = (errMsg: string | null) => {
    setError(errMsg);
  };

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
        <MasterResumeUploader
          isUploading={isUploading}
          onUploadStart={handleUploadStart}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </div>

      {error && <div className={styles.errorText}>⚠️ {error}</div>}

      <div className={styles.snapshotContainer}>
        {isUploading ? (
          <div className={styles.uploaderSpinnerContainer}>
            <Spinner width={24} height={24} className={styles.aiProcessingSpinner} />
            <span className={styles.uploaderSpinnerText}>Extracting and re-parsing resume...</span>
          </div>
        ) : (
          <div className={styles.snapshot}>{snapshot}</div>
        )}
      </div>

      {/* TARGET ROLES SECTION */}
      <TargetRolesEditor
        resumeId={resume.id}
        initialRoles={resume.target_roles || []}
        isAiProcessing={isAiProcessing}
        setIsAiProcessing={setIsAiProcessing}
        isUploading={isUploading}
        onError={handleRolesError}
      />

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

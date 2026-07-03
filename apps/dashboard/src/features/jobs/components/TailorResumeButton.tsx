'use client';

import React, { useState } from 'react';
import { Job } from '@job-hunt/types';
import toast from 'react-hot-toast';
import styles from './TailorResumeButton.module.css';

interface TailorResumeButtonProps {
  job: Job;
  masterResumeContent: string;
}

export const TailorResumeButton = React.memo(function TailorResumeButton({
  job,
  masterResumeContent,
}: TailorResumeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
          jobDescription: job.description || job.role,
          masterResume: masterResumeContent,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Request failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `resume_${job.company.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      console.error('Failed to generate resume:', err instanceof Error ? err.message : err);
      if (err instanceof Error) {
        toast.error(err.message);
        setError(err.message);
      } else {
        toast.error('Failed to generate PDF');
        setError('Failed to generate PDF');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        className={`button button-secondary ${styles.button} ${isLoading ? styles.buttonLoading : ''}`}
        onClick={handleGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className={styles.spinner}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" />
            </svg>
            <span>Tailoring...</span>
          </>
        ) : (
          <>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 4V2" />
              <path d="M15 16v-2" />
              <path d="M8 9h2" />
              <path d="M20 9h2" />
              <path d="M17.8 5.8l-1.4 1.4" />
              <path d="M13.6 9.6l-1.4 1.4" />
              <path d="M9.6 5.8l1.4 1.4" />
              <path d="M13.6 4.4l-1.4-1.4" />
              <path d="M3 21l9-9" />
              <path d="M12.2 11.8l9.8-9.8" />
            </svg>
            <span>Tailor PDF</span>
          </>
        )}
      </button>
      {error && <span className={styles.errorText}>{error}</span>}
    </>
  );
});

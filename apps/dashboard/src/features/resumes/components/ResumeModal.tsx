'use client';

import { useEffect, useState } from 'react';
import { GeneratedResume } from '@job-hunt/types';
import { createClient } from '@/utils/supabase/client';
import styles from './ResumeModal.module.css';

interface ResumeModalProps {
  resume: GeneratedResume;
  onClose: () => void;
}

export default function ResumeModal({ resume, onClose }: ResumeModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(!!resume.pdf_url);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (resume.pdf_url) {
      const fetchPdf = async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase.storage
            .from('resumes')
            .createSignedUrl(resume.pdf_url!, 3600);
          if (data?.signedUrl) {
            setPdfUrl(data.signedUrl);
          }
        } finally {
          setIsLoadingPdf(false);
        }
      };
      fetchPdf();
    }
  }, [resume.pdf_url]);

  let formattedContent = resume.content || 'No content available.';
  try {
    if (resume.content?.trim().startsWith('{')) {
      formattedContent = JSON.stringify(JSON.parse(resume.content), null, 2);
    }
  } catch (_e) {
    // Keep raw
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title} title={resume.job_id || undefined}>
            Resume for Job ID: {resume.job_id?.split('-')[0] || 'Master'}
          </h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div
          className={`${styles.content} ${!pdfUrl && !isLoadingPdf ? styles.contentScrollable : ''}`}
        >
          {isLoadingPdf && <div className={styles.spinner} />}

          {!isLoadingPdf && pdfUrl && (
            <iframe src={`${pdfUrl}#toolbar=0`} className={styles.pdfIframe} title="Resume PDF" />
          )}

          {!isLoadingPdf && !pdfUrl && (
            <div
              className={styles.contentScrollable}
              style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
            >
              {formattedContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

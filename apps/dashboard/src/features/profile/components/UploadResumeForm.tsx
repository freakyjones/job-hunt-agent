'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { uploadBaseResume } from '../services/profile';
import styles from './UploadResumeForm.module.css';

export function UploadResumeForm() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    const { error: uploadError } = await uploadBaseResume(formData);

    if (uploadError) {
      setError(uploadError);
      setIsUploading(false);
    } else {
      setIsUploading(false);
      setIsSuccess(true);
      // Give a moment for the success animation, then redirect
      setTimeout(() => {
        router.push('/jobs');
      }, 1500);
    }
  };

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.active : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && !isSuccess && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,.docx"
      />

      {isUploading ? (
        <div className={styles.uploading}>
          <div className={styles.spinner}></div>
          <p>Extracting and saving your resume...</p>
        </div>
      ) : isSuccess ? (
        <div className={styles.success}>
          ✓
          <p style={{ fontSize: '1.2rem', marginTop: '16px', color: 'var(--text)' }}>
            Upload Complete!
          </p>
        </div>
      ) : (
        <>
          <div className={styles.icon}>📄</div>
          <div className={styles.title}>Click or drag to upload your master resume</div>
          <div className={styles.subtitle}>Supports PDF, DOCX, TXT, MD (Max 5MB)</div>
        </>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

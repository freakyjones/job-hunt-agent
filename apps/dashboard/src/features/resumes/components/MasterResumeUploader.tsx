'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadBaseResume } from '@/features/profile/services/profile';
import styles from './PrimaryResumeCard.module.css';

interface MasterResumeUploaderProps {
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadComplete: (contentChanged: boolean) => void;
  onUploadError: (error: string) => void;
}

export function MasterResumeUploader({
  isUploading,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: MasterResumeUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onUploadStart();

      const formData = new FormData();
      formData.append('file', file);

      try {
        const uploadResponse = await uploadBaseResume(formData);
        if (uploadResponse.error) {
          onUploadError(uploadResponse.error);
        } else {
          const contentChanged = uploadResponse.contentChanged !== false;
          onUploadComplete(contentChanged);
          router.refresh();
        }
      } catch (err) {
        onUploadError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,.docx"
        className={styles.hiddenInput}
      />
      <button
        className={`${styles.button} ${styles.buttonSecondary} ${styles.replaceButton}`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : '🔄 Replace Master Resume'}
      </button>
    </>
  );
}

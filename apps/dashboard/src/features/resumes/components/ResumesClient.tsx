'use client';
import { GeneratedResume, BaseResume } from '@job-hunt/types';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import { ResumeCard } from './ResumeCard';
import { PrimaryResumeCard } from './PrimaryResumeCard';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import styles from './ResumesClient.module.css';

// Dynamically import the modal to reduce initial bundle size
const ResumeModal = dynamic(() => import('./ResumeModal'), { ssr: false });

export function ResumesClient({
  resumes,
  baseResume,
}: {
  resumes: GeneratedResume[];
  baseResume?: BaseResume;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewResumeId = searchParams.get('viewResume');

  // Convert BaseResume to a shape compatible with ResumeModal for viewing extracted text
  const primaryResumeForModal = useMemo(() => {
    if (!baseResume) return undefined;
    return {
      id: baseResume.id,
      content: baseResume.extracted_content || '',
      job_id: 'Master',
      created_at: baseResume.created_at,
    } as GeneratedResume;
  }, [baseResume]);

  const selectedResume = useMemo(() => {
    if (viewResumeId === baseResume?.id) return primaryResumeForModal;
    return resumes.find((r) => r.id === viewResumeId);
  }, [resumes, viewResumeId, baseResume, primaryResumeForModal]);

  const handleDownload = async (path: string, fileName: string, bucket: string = 'resumes') => {
    const loadingToast = toast.loading('Generating download link...');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
      if (error) throw error;
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Download started', { id: loadingToast });
      }
    } catch (e: unknown) {
      toast.error(`Failed to download: ${(e as Error).message}`, { id: loadingToast });
    }
  };

  const handleView = (id: string) => {
    router.push(`/resumes?viewResume=${id}`);
  };

  const handleCloseModal = () => {
    router.push('/resumes');
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Generated Resumes</h2>
      </div>

      <div className={styles.resumesGrid}>
        {baseResume && (
          <PrimaryResumeCard
            resume={baseResume}
            onDownload={(path, name) => handleDownload(path, name, 'base_resumes')}
            onView={handleView}
          />
        )}
        {resumes.map((r) => (
          <ResumeCard
            key={r.id}
            resume={r}
            onDownload={(path, name) => handleDownload(path, name, 'resumes')}
            onView={handleView}
          />
        ))}
      </div>

      {resumes.length === 0 && !baseResume && (
        <p className={styles.emptyState}>No resumes generated yet.</p>
      )}

      {selectedResume && <ResumeModal resume={selectedResume} onClose={handleCloseModal} />}
    </div>
  );
}

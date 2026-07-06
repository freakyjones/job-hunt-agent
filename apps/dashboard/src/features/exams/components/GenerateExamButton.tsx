'use client';

import { useState } from 'react';
import { generateExamAction } from '../actions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Spinner } from '@/features/core/components/Spinner';
import styles from '../../../app/(dashboard)/exams/page.module.css';

interface GenerateExamButtonProps {
  jobs: Array<{ id: string; company: string; role: string }>;
}

export function GenerateExamButton({ jobs }: GenerateExamButtonProps) {
  const [loading, setLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateExamAction(selectedJobId || undefined);

      if (!res.success) {
        alert(res.error || 'Failed to start generation');
        setLoading(false);
        return;
      }

      if (res.jobId) {
        // Subscribe to the queue to wait for the job to complete
        const channel = supabase
          .channel(`exam-job-${res.jobId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'exam_generation_jobs',
              filter: `id=eq.${res.jobId}`,
            },
            (payload) => {
              const status = payload.new.status;
              if (status === 'completed' && payload.new.exam_id) {
                channel.unsubscribe();
                router.push(`/exams/${payload.new.exam_id}`);
              } else if (status === 'failed') {
                channel.unsubscribe();
                alert(`Generation failed: ${payload.new.error_message || 'Unknown error'}`);
                setLoading(false);
              }
            }
          )
          .subscribe();
      }
    } catch (e) {
      console.error(e);
      alert('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.generatorContainer}>
      <select
        value={selectedJobId}
        onChange={(e) => setSelectedJobId(e.target.value)}
        className={styles.jobSelect}
        disabled={loading}
      >
        <option value="">General Assessment (Resume-only)</option>
        {jobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.role} at {job.company}
          </option>
        ))}
      </select>

      <button onClick={handleGenerate} className={styles.generateButton} disabled={loading}>
        {loading && <Spinner width={16} height={16} />}
        {loading ? 'Generating... (~30s)' : 'Generate New Exam'}
      </button>
    </div>
  );
}

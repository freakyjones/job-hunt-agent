import { JobsClient } from './JobsClient';
import { getJobs } from '../services/jobs';
import { redirect } from 'next/navigation';
import { getBaseResume } from '@/features/profile/services/profile';
import { createClient } from '@/utils/supabase/server';

export async function JobsDataFetcher() {
  const jobsResultPromise = getJobs();
  const resumePromise = getBaseResume();

  const [jobsResult, resumeResult] = await Promise.all([jobsResultPromise, resumePromise]);

  if (!resumeResult.data || !resumeResult.data.extracted_content) {
    redirect('/onboarding');
  }

  const masterResumeContent = resumeResult.data.extracted_content;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAnonymous = user?.is_anonymous ?? false;

  return (
    <>
      {jobsResult.error && (
        <div
          style={{
            padding: '16px',
            background: 'var(--danger)',
            color: '#fff',
            borderRadius: '8px',
            marginBottom: '24px',
            opacity: 0.9,
          }}
        >
          <strong>Network Error:</strong> {jobsResult.error}. Showing empty state. Please check your
          connection.
        </div>
      )}
      <JobsClient
        initialJobs={jobsResult.data || []}
        masterResume={masterResumeContent}
        isAnonymous={isAnonymous}
      />
    </>
  );
}

import { JobsClient } from '@/features/jobs/components/JobsClient';
import { getJobs, getRecentWorkflows } from '@/features/jobs/services/jobs';

import { redirect } from 'next/navigation';
import { getBaseResume } from '@/features/profile/services/profile';

export default async function JobsPage() {
  const jobsResultPromise = getJobs();
  const resumePromise = getBaseResume();
  const workflowsPromise = getRecentWorkflows();

  const [jobsResult, resumeResult, workflowsResult] = await Promise.all([
    jobsResultPromise,
    resumePromise,
    workflowsPromise,
  ]);

  if (!resumeResult.data || !resumeResult.data.extracted_content) {
    redirect('/onboarding');
  }

  const masterResumeContent = resumeResult.data.extracted_content;

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
        initialWorkflows={workflowsResult.data || []}
      />
    </>
  );
}

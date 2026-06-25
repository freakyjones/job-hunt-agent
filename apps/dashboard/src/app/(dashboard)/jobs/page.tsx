import { JobsClient } from '@/features/jobs/components/JobsClient';
import { getJobs } from '@/features/jobs/services/jobs';
import * as fs from 'fs';
import * as path from 'path';

export default async function JobsPage() {
  const jobsResultPromise = getJobs();

  const resumePromise = (async () => {
    try {
      const resumePath = path.join(process.cwd(), '../../resume.txt');
      if (fs.existsSync(resumePath)) {
        return await fs.promises.readFile(resumePath, 'utf8');
      } else {
        const localFallback = path.join(process.cwd(), 'resume.txt');
        if (fs.existsSync(localFallback)) {
          return await fs.promises.readFile(localFallback, 'utf8');
        }
      }
    } catch (e) {
      console.error('Could not read master resume', e);
    }
    return '';
  })();

  const [jobsResult, masterResumeContent] = await Promise.all([jobsResultPromise, resumePromise]);

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
      <JobsClient initialJobs={jobsResult.data || []} masterResume={masterResumeContent} />
    </>
  );
}

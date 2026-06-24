import { JobsClient } from '@/features/jobs/components/JobsClient';
import { getJobs } from '@/features/jobs/services/jobs';
import * as fs from 'fs';
import * as path from 'path';

export default async function JobsPage() {
    const jobsPromise = getJobs();
    
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
            console.error("Could not read master resume", e);
        }
        return '';
    })();

    const [jobs, masterResumeContent] = await Promise.all([jobsPromise, resumePromise]);

    return (
        <>
            <JobsClient initialJobs={jobs || []} masterResume={masterResumeContent} />
        </>
    );
}

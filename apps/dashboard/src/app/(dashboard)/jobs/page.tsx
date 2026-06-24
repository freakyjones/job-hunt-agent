import { JobsClient } from '@/features/jobs/components/JobsClient';
import { getJobsAction } from '@/app/actions';
import * as fs from 'fs';
import * as path from 'path';
import { RealtimeJobListener } from '@/features/jobs/components/RealtimeJobListener';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
    const response = await getJobsAction();
    
    if (!response.success) {
        throw new Error(response.error || "Failed to fetch jobs from Supabase");
    }
    
    let masterResumeContent = '';
    try {
        const resumePath = path.join(process.cwd(), '../../resume.txt');
        if (fs.existsSync(resumePath)) {
            masterResumeContent = fs.readFileSync(resumePath, 'utf8');
        } else {
            const localFallback = path.join(process.cwd(), 'resume.txt');
            if (fs.existsSync(localFallback)) masterResumeContent = fs.readFileSync(localFallback, 'utf8');
        }
    } catch (e) {
        console.error("Could not read master resume", e);
    }

    return (
        <>
            <RealtimeJobListener />
            <JobsClient initialJobs={response.data || []} masterResume={masterResumeContent} />
        </>
    );
}

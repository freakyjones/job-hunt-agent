import DashboardClient from './DashboardClient';
import { getJobsAction } from './actions';
import { RealtimeJobListener } from '../components/RealtimeJobListener';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const response = await getJobsAction();
    
    if (!response.success) {
        throw new Error(response.error || "Failed to fetch jobs from Supabase");
    }
    
    return (
        <>
            <RealtimeJobListener />
            <DashboardClient initialJobs={response.data || []} />
        </>
    );
}

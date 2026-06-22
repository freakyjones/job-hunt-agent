import DashboardClient from './DashboardClient';
import { getJobsAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const response = await getJobsAction();
    
    if (!response.success) {
        throw new Error(response.error || "Failed to fetch jobs from Supabase");
    }
    
    return <DashboardClient initialJobs={response.data || []} />;
}

import DashboardClient from './DashboardClient';
import { getJobsAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const response = await getJobsAction();
    const jobs = response.success ? response.data : [];
    
    return <DashboardClient initialJobs={jobs || []} />;
}

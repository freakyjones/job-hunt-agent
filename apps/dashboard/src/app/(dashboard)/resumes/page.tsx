import { ResumesClient } from '@/features/resumes/components/ResumesClient';
import { getResumesAction } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function ResumesPage() {
    const response = await getResumesAction();
    
    if (!response.success) {
        throw new Error(response.error || "Failed to fetch resumes from Supabase");
    }
    
    return <ResumesClient resumes={response.data || []} />;
}

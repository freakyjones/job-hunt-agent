import { ResumesClient } from '@/features/resumes/components/ResumesClient';
import { getResumesAction } from '@/app/actions';
import { getBaseResume } from '@/features/profile/services/profile';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ResumesPage() {
  const baseResumePromise = getBaseResume();
  const [response, baseResume] = await Promise.all([getResumesAction(), baseResumePromise]);

  if (!baseResume.data || !baseResume.data.extracted_content) {
    redirect('/onboarding');
  }

  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch resumes from Supabase');
  }

  return <ResumesClient resumes={response.data || []} baseResume={baseResume.data} />;
}

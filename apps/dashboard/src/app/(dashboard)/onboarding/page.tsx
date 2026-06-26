import { UploadResumeForm } from '@/features/profile/components/UploadResumeForm';
import { getBaseResume } from '@/features/profile/services/profile';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Onboarding - Job Hunt Agent',
};

export default async function OnboardingPage() {
  const { data: baseResume } = await getBaseResume();

  if (baseResume && baseResume.extracted_content) {
    // Already onboarded
    redirect('/jobs');
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '16px' }}>Welcome! Let&apos;s get started.</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
        Before we can evaluate jobs and generate tailored resumes, we need your master resume.
        Upload it below, and we&apos;ll extract the text automatically.
      </p>

      <UploadResumeForm />
    </div>
  );
}

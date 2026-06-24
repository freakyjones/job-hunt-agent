'use client';
import { GeneratedResume } from '@job-hunt/types';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

export function ResumesClient({ resumes }: { resumes: GeneratedResume[] }) {
  const handleDownload = async (path: string, fileName: string) => {
    const loadingToast = toast.loading('Generating download link...');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage.from('resumes').createSignedUrl(path, 60);
      if (error) throw error;
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Download started', { id: loadingToast });
      }
    } catch (e: unknown) {
      toast.error(`Failed to download: ${(e as Error).message}`, { id: loadingToast });
    }
  };

  return (
    <div>
      <h2>Generated Resumes</h2>
      {resumes.length === 0 ? (
        <p>No resumes generated yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {resumes.map((r) => (
            <div key={r.id} className="glass-panel" style={{ padding: '20px' }}>
              <h3>Resume for Job ID: {r.job_id || 'Generic'}</h3>
              <p>Tags: {r.tags?.join(', ')}</p>
              <p>Created: {new Date(r.created_at || '').toLocaleString()}</p>
              {r.pdf_url && (
                <button
                  className="button button-primary"
                  onClick={() => handleDownload(r.pdf_url!, `resume_${r.job_id || 'generic'}.pdf`)}
                  style={{ marginTop: '10px' }}
                >
                  📥 Download PDF
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

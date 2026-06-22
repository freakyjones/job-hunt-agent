'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Job } from '@job-hunt/types';

interface TailorResumeButtonProps {
    job: Job;
    masterResumeContent: string;
}

export function TailorResumeButton({ job, masterResumeContent }: TailorResumeButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const supabase = createClient();
            
            // Invoke the edge function
            const { data, error: invokeError } = await supabase.functions.invoke('tailor-resume', {
                body: {
                    jobDescription: job.description || job.role,
                    masterResume: masterResumeContent
                }
            });

            if (invokeError) throw new Error(invokeError.message);

            // The data is a Blob because the Edge Function returned an application/pdf
            if (data instanceof Blob) {
                const url = window.URL.createObjectURL(data);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `resume_${job.company.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error("Unexpected response type from Edge Function");
            }
            
        } catch (err: unknown) {
            console.error('Failed to generate resume:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to generate PDF');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'inline-block', marginLeft: '8px' }}>
            <button 
                className="button button-primary" 
                onClick={handleGenerate} 
                disabled={isLoading}
                style={{ background: isLoading ? '#6b7280' : '#4f46e5' }}
            >
                {isLoading ? '⏳ Generating...' : '📄 Tailor Resume PDF'}
            </button>
            {error && <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>{error}</span>}
        </div>
    );
}

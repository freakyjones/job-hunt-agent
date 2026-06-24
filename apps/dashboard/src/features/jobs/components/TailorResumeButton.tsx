'use client';

import React, { useState } from 'react';
import { Job } from '@job-hunt/types';

interface TailorResumeButtonProps {
    job: Job;
    masterResumeContent: string;
}

export const TailorResumeButton = React.memo(function TailorResumeButton({ job, masterResumeContent }: TailorResumeButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await fetch('/api/tailor-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobId: job.id,
                    jobDescription: job.description || job.role,
                    masterResume: masterResumeContent
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.error || `Request failed with status ${res.status}`);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `resume_${job.company.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
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
});

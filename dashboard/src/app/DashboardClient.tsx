'use client';

import { useState } from 'react';
import styles from './page.module.css';

type Job = {
    id: string;
    company: string;
    role: string;
    url: string;
    score: number;
    reasoning: string;
    status: string;
};

export default function DashboardClient({ initialJobs }: { initialJobs: Job[] }) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs);
    const [isTriggering, setIsTriggering] = useState(false);

    const handleTrigger = async () => {
        setIsTriggering(true);
        try {
            const res = await fetch('/api/trigger', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert("GitHub Action triggered successfully! Jobs will be updated in a few minutes.");
            } else {
                alert("Failed to trigger: " + data.error);
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        }
        setIsTriggering(false);
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        // Optimistic UI update
        setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
        
        try {
            await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, newStatus })
            });
        } catch (e) {
            console.error("Failed to update status");
        }
    };

    const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'EVALUATED');
    const notifiedJobs = jobs.filter(j => j.status === 'NOTIFIED');
    const errorJobs = jobs.filter(j => j.status === 'ERROR');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Agentic Job Hunt Dashboard</h1>
                <button 
                    className={`button button-primary ${isTriggering ? 'opacity-50' : ''}`}
                    onClick={handleTrigger}
                    disabled={isTriggering}
                >
                    {isTriggering ? 'Triggering...' : 'Force Scrape Now'}
                </button>
            </header>

            <div className={styles.stats}>
                <div className={`glass-panel ${styles.statCard} animate-fade-in`}>
                    <div className={styles.statValue}>{jobs.length}</div>
                    <div className={styles.statLabel}>Total Jobs Scraped</div>
                </div>
                <div className={`glass-panel ${styles.statCard} animate-fade-in`} style={{ animationDelay: '0.1s' }}>
                    <div className={styles.statValue}>{notifiedJobs.length}</div>
                    <div className={styles.statLabel}>High Matches</div>
                </div>
                <div className={`glass-panel ${styles.statCard} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
                    <div className={styles.statValue}>{pendingJobs.length}</div>
                    <div className={styles.statLabel}>Pending</div>
                </div>
                <div className={`glass-panel ${styles.statCard} animate-fade-in`} style={{ animationDelay: '0.3s' }}>
                    <div className={styles.statValue} style={{ color: 'var(--danger)' }}>{errorJobs.length}</div>
                    <div className={styles.statLabel}>Errors</div>
                </div>
            </div>

            <div className={styles.grid}>
                {jobs.map((job, index) => (
                    <div 
                        key={job.id} 
                        className={`glass-panel ${styles.jobCard} animate-fade-in`} 
                        data-status={job.status}
                        style={{ animationDelay: `${(index % 10) * 0.1}s` }}
                    >
                        <div className={styles.jobHeader}>
                            <div>
                                <h3 className={styles.jobTitle}>{job.role}</h3>
                                <p className={styles.jobCompany}>{job.company}</p>
                            </div>
                            {job.status === 'ERROR' ? (
                                <div className={styles.scoreBadge} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                                    ERR
                                </div>
                            ) : (
                                <div className={styles.scoreBadge} data-high={job.score >= 80}>
                                    {job.score}/100
                                </div>
                            )}
                        </div>

                        <div className={styles.reasoning}>
                            {job.reasoning || (job.status === 'ERROR' ? "Failed to evaluate (Rate limit or Parsing error)." : "Evaluation pending...")}
                        </div>

                        <div className={styles.actions}>
                            <a href={job.url} target="_blank" rel="noreferrer" className="button button-primary">
                                View Job
                            </a>
                            {job.status !== 'REJECTED' && job.status !== 'NOTIFIED' && job.status !== 'ERROR' && (
                                <>
                                    <button 
                                        className="button button-success"
                                        onClick={() => handleUpdateStatus(job.id, 'NOTIFIED')}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        className="button button-danger"
                                        onClick={() => handleUpdateStatus(job.id, 'REJECTED')}
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            {job.status === 'NOTIFIED' && (
                                <button className="button button-success" disabled style={{ opacity: 0.5 }}>Accepted</button>
                            )}
                            {job.status === 'REJECTED' && (
                                <button className="button button-danger" disabled style={{ opacity: 0.5 }}>Rejected</button>
                            )}
                            {job.status === 'ERROR' && (
                                <button className="button button-danger" disabled style={{ opacity: 0.5 }}>Errored</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

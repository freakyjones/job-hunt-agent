'use client';

import { useState, useOptimistic, useTransition, useMemo } from 'react';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { triggerGitHubAction, updateJobStatusAction } from './actions';
import { logout } from './login/actions';
import { Job, JobStatus } from '@job-hunt/types';

export default function DashboardClient({ initialJobs }: { initialJobs: Job[] }) {
    const [optimisticJobs, addOptimisticJob] = useOptimistic(
        initialJobs,
        (state: Job[], newJob: { id: string, status: JobStatus }) => {
            return state.map(j => j.id === newJob.id ? { ...j, status: newJob.status } : j);
        }
    );
    const [, startTransition] = useTransition();
    const [isTriggering, setIsTriggering] = useState(false);

    const handleTrigger = async (command: string) => {
        setIsTriggering(true);
        const loadingToast = toast.loading(`Waking up the agent for ${command}...`);
        try {
            const res = await triggerGitHubAction(command);
            if (res.success) {
                toast.success(`Agent ${command} triggered! Jobs will update shortly.`, { 
                    id: loadingToast,
                    style: {
                        background: '#10b981',
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '16px',
                        borderRadius: '8px'
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#10b981',
                    },
                });
            } else {
                toast.error(res.error ? `Failed to trigger: ${res.error}` : "Failed to trigger the agent", { 
                    id: loadingToast,
                    style: {
                        background: '#ef4444',
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '16px',
                        borderRadius: '8px'
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#ef4444',
                    },
                });
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? `Error: ${e.message}` : "An unexpected error occurred", { 
                id: loadingToast,
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    fontWeight: 'bold',
                    padding: '16px',
                    borderRadius: '8px'
                },
                iconTheme: {
                    primary: '#fff',
                    secondary: '#ef4444',
                },
            });
        }
        setIsTriggering(false);
    };

    const handleUpdateStatus = async (id: string, newStatus: Job['status']) => {
        startTransition(() => {
            addOptimisticJob({ id, status: newStatus });
        });
        
        try {
            const res = await updateJobStatusAction(id, newStatus);
            if (!res.success) {
                toast.error(res.error ? `Failed to sync: ${res.error}` : "Failed to sync status with Supabase", {
                    style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '8px' },
                    iconTheme: { primary: '#fff', secondary: '#ef4444' },
                });
            } else {
                toast.success(`Job marked as ${newStatus}`, {
                    style: { background: '#10b981', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '8px' },
                    iconTheme: { primary: '#fff', secondary: '#10b981' },
                });
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? `Error: ${e.message}` : "Failed to update status", {
                style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '8px' },
                iconTheme: { primary: '#fff', secondary: '#ef4444' },
            });
        }
    };

    const pendingJobs = useMemo(() => optimisticJobs.filter(j => j.status === JobStatus.PENDING || j.status === JobStatus.EVALUATED), [optimisticJobs]);
    const notifiedJobs = useMemo(() => optimisticJobs.filter(j => j.status === JobStatus.NOTIFIED), [optimisticJobs]);
    const errorJobs = useMemo(() => optimisticJobs.filter(j => j.status === JobStatus.ERROR), [optimisticJobs]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Agentic Job Hunt Dashboard</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className={`button button-primary ${isTriggering ? 'opacity-50' : ''}`}
                        onClick={() => handleTrigger('scrape')}
                        disabled={isTriggering}
                    >
                        {isTriggering ? 'Waking up...' : 'Force Scrape'}
                    </button>
                    <button 
                        className={`button button-secondary ${isTriggering ? 'opacity-50' : ''}`}
                        onClick={() => handleTrigger('evaluate')}
                        disabled={isTriggering}
                    >
                        Force Evaluate
                    </button>
                    <button 
                        className="button"
                        onClick={() => {
                            startTransition(async () => {
                                try {
                                    await logout();
                                } catch (e: unknown) {
                                    toast.error(e instanceof Error ? e.message : "Failed to sign out", { style: { background: '#ef4444', color: '#fff', borderRadius: '8px' }});
                                }
                            });
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <div className={styles.stats}>
                <div className={`glass-panel ${styles.statCard} animate-fade-in`}>
                    <div className={styles.statValue}>{optimisticJobs.length}</div>
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
                {optimisticJobs.map((job, index) => (
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
                            {job.status === JobStatus.ERROR ? (
                                <div className={styles.scoreBadge} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                                    ERR
                                </div>
                            ) : job.status === JobStatus.PENDING ? (
                                <div className={styles.pendingBadge}>
                                    PENDING
                                </div>
                            ) : (
                                <div className={styles.scoreBadge} data-high={(job.score || 0) >= 80}>
                                    {job.score || 0}/100
                                </div>
                            )}
                        </div>

                        <div className={styles.reasoning}>
                            {job.reasoning || (job.status === JobStatus.ERROR ? "Failed to evaluate (Rate limit or Parsing error)." : "Evaluation pending...")}
                        </div>

                        <div className={styles.actions}>
                            <a href={job.url || '#'} target="_blank" rel="noreferrer" className="button button-primary">
                                View Job
                            </a>
                            {job.status !== JobStatus.REJECTED && job.status !== JobStatus.NOTIFIED && job.status !== JobStatus.ERROR && (
                                <>
                                    <button 
                                        className="button button-success"
                                        onClick={() => handleUpdateStatus(job.id, JobStatus.NOTIFIED)}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        className="button button-danger"
                                        onClick={() => handleUpdateStatus(job.id, JobStatus.REJECTED)}
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            {job.status === JobStatus.NOTIFIED && (
                                <button className="button button-success" disabled style={{ opacity: 0.5 }}>Accepted</button>
                            )}
                            {job.status === JobStatus.REJECTED && (
                                <button className="button button-danger" disabled style={{ opacity: 0.5 }}>Rejected</button>
                            )}
                            {job.status === JobStatus.ERROR && (
                                <button className="button button-danger" disabled style={{ opacity: 0.5 }}>Errored</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

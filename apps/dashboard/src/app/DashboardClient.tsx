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
    
    type TabName = 'inbox' | 'queue' | 'applied' | 'rejected' | 'saved';
    const [activeTab, setActiveTab] = useState<TabName>('inbox');

    const handleTrigger = async (command: string) => {
        setIsTriggering(true);
        const loadingToast = toast.loading(`Waking up the agent for ${command}...`);
        try {
            const res = await triggerGitHubAction(command);
            if (res.success) {
                toast.success(`Agent ${command} triggered! Jobs will update shortly.`, { 
                    id: loadingToast,
                    style: { background: '#10b981', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '8px' },
                    iconTheme: { primary: '#fff', secondary: '#10b981' },
                });
            } else {
                toast.error(res.error ? `Failed to trigger: ${res.error}` : "Failed to trigger the agent", { 
                    id: loadingToast,
                    style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '8px' },
                    iconTheme: { primary: '#fff', secondary: '#ef4444' },
                });
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? `Error: ${e.message}` : "An unexpected error occurred", { 
                id: loadingToast,
                style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '8px' },
                iconTheme: { primary: '#fff', secondary: '#ef4444' },
            });
        }
        setIsTriggering(false);
    };

    const handleUpdateStatus = async (id: string, newStatus: JobStatus, oldStatus: JobStatus) => {
        // Optimistic UI Update - Instant Removal/Move
        startTransition(() => {
            addOptimisticJob({ id, status: newStatus });
        });
        
        // Immediate Database Sync
        const res = await updateJobStatusAction(id, newStatus);
        
        if (!res.success) {
            toast.error(res.error ? `Failed to sync: ${res.error}` : "Failed to sync status with Supabase", {
                style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '8px' },
            });
            // Revert on failure
            startTransition(() => { addOptimisticJob({ id, status: oldStatus }); });
            return;
        }

        // Show Undo Toast
        toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px' }}>Job marked as {newStatus}</span>
                <button 
                    onClick={async () => {
                        toast.dismiss(t.id);
                        // Optimistic Undo
                        startTransition(() => { addOptimisticJob({ id, status: oldStatus }); });
                        // Database Undo Sync
                        await updateJobStatusAction(id, oldStatus);
                        toast.success('Undone successfully', { style: { background: '#10b981', color: '#fff' }});
                    }}
                    style={{ 
                        padding: '6px 12px', 
                        background: 'rgba(255,255,255,0.2)', 
                        border: 'none', 
                        borderRadius: '6px', 
                        color: '#fff', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                    UNDO
                </button>
            </div>
        ), {
            duration: 5000,
            style: { background: '#333', color: '#fff', padding: '12px 16px', borderRadius: '8px' },
        });
    };

    // Filtered Arrays
    const inboxJobs = useMemo(() => optimisticJobs.filter(j => j.status === JobStatus.PENDING || j.status === JobStatus.EVALUATED || j.status === JobStatus.ERROR), [optimisticJobs]);
    const queueJobs = useMemo(() => optimisticJobs.filter(j => j.status === JobStatus.ACCEPTED || j.status === JobStatus.APPLYING), [optimisticJobs]);
    const appliedJobs = useMemo(() => optimisticJobs.filter(j => j.status === JobStatus.APPLIED), [optimisticJobs]);
    const rejectedJobs = useMemo(() => optimisticJobs.filter(j => j.status === JobStatus.REJECTED), [optimisticJobs]);
    const savedJobs = useMemo(() => optimisticJobs.filter(j => j.status === JobStatus.SAVED), [optimisticJobs]);

    const displayJobs = useMemo(() => {
        if (activeTab === 'inbox') return inboxJobs;
        if (activeTab === 'queue') return queueJobs;
        if (activeTab === 'applied') return appliedJobs;
        if (activeTab === 'saved') return savedJobs;
        return rejectedJobs;
    }, [activeTab, inboxJobs, queueJobs, appliedJobs, rejectedJobs, savedJobs]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Agentic Job Hunt Dashboard</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={`button button-primary ${isTriggering ? 'opacity-50' : ''}`} onClick={() => handleTrigger('scrape')} disabled={isTriggering}>
                        {isTriggering ? 'Waking up...' : 'Force Scrape'}
                    </button>
                    <button className={`button button-secondary ${isTriggering ? 'opacity-50' : ''}`} onClick={() => handleTrigger('evaluate')} disabled={isTriggering}>
                        Force Evaluate
                    </button>
                    <button className={`button button-primary ${isTriggering ? 'opacity-50' : ''}`} onClick={() => handleTrigger('apply')} disabled={isTriggering} style={{ background: '#10b981', borderColor: '#10b981' }}>
                        Force Apply
                    </button>
                    <button className="button" onClick={() => startTransition(async () => { await logout(); })}>
                        Sign Out
                    </button>
                </div>
            </header>

            {/* TAB NAVIGATION */}
            <div className={styles.tabsContainer}>
                <button 
                    className={`${styles.tab} ${activeTab === 'inbox' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('inbox')}
                >
                    📥 Inbox <span className={styles.badge}>{inboxJobs.length}</span>
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'queue' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('queue')}
                >
                    🤖 Bot Queue <span className={styles.badge}>{queueJobs.length}</span>
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'saved' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('saved')}
                >
                    🔖 Saved (Manual) <span className={styles.badge}>{savedJobs.length}</span>
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'applied' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('applied')}
                >
                    ✅ Applied <span className={styles.badge}>{appliedJobs.length}</span>
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'rejected' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    🗑️ Rejected <span className={styles.badge}>{rejectedJobs.length}</span>
                </button>
            </div>

            {/* EMPTY STATE */}
            {displayJobs.length === 0 && (
                <div className={styles.emptyState}>
                    {activeTab === 'inbox' ? (
                        <>
                            <h2>🎉 Inbox Zero!</h2>
                            <p>You&apos;re all caught up. The AI is hunting for more jobs.</p>
                        </>
                    ) : (
                        <>
                            <h2>No jobs here yet.</h2>
                            <p>Keep reviewing your inbox to fill this list.</p>
                        </>
                    )}
                </div>
            )}

            <div className={styles.grid}>
                {displayJobs.map((job, index) => {
                    const isAutoApplicable = job.url?.includes('lever.co') || job.url?.includes('greenhouse.io');
                    return (
                    <div key={job.id} className={`glass-panel ${styles.jobCard} animate-fade-in`} data-status={job.status} style={{ animationDelay: `${(index % 10) * 0.05}s` }}>
                        <div className={styles.jobHeader}>
                            <div>
                                <h3 className={styles.jobTitle}>{job.role}</h3>
                                <p className={styles.jobCompany}>{job.company}</p>
                            </div>
                            {job.status === JobStatus.ERROR ? (
                                <div className={styles.scoreBadge} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>ERR</div>
                            ) : job.status === JobStatus.PENDING ? (
                                <div className={styles.pendingBadge}>PENDING</div>
                            ) : (
                                <div className={styles.scoreBadge} data-high={(job.score || 0) >= 80}>{job.score || 0}/100</div>
                            )}
                        </div>

                        <div className={styles.reasoning}>
                            {job.reasoning || (job.status === JobStatus.ERROR ? "Failed to evaluate or apply." : "Evaluation pending...")}
                        </div>

                        <div className={styles.actions}>
                            <a href={job.url || '#'} target="_blank" rel="noreferrer" className="button button-primary">View Job</a>
                            {/* Actions only show if in inbox/eval state */}
                            {(job.status === JobStatus.PENDING || job.status === JobStatus.EVALUATED || job.status === JobStatus.ERROR) && (
                                <>
                                    {isAutoApplicable ? (
                                        <button className="button button-success" onClick={() => handleUpdateStatus(job.id, JobStatus.ACCEPTED, job.status as JobStatus)}>Queue for Bot</button>
                                    ) : (
                                        <button className="button button-secondary" onClick={() => handleUpdateStatus(job.id, JobStatus.SAVED, job.status as JobStatus)}>Save (Manual)</button>
                                    )}
                                    <button className="button button-danger" onClick={() => handleUpdateStatus(job.id, JobStatus.REJECTED, job.status as JobStatus)}>Reject</button>
                                </>
                            )}
                            {job.status === JobStatus.ACCEPTED && <button className="button button-success" disabled style={{ opacity: 0.5 }}>Queued</button>}
                            {job.status === JobStatus.SAVED && <button className="button button-secondary" disabled style={{ opacity: 0.5 }}>Saved</button>}
                            {job.status === JobStatus.APPLYING && <button className="button button-success" disabled style={{ opacity: 0.5 }}>Applying</button>}
                            {job.status === JobStatus.APPLIED && <button className="button button-success" disabled style={{ opacity: 0.5 }}>Applied</button>}
                            {job.status === JobStatus.REJECTED && <button className="button button-danger" disabled style={{ opacity: 0.5 }}>Rejected</button>}
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
}

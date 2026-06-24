'use client';

import { useState, useOptimistic, useTransition, useMemo } from 'react';
import styles from '@/app/page.module.css';
import toast from 'react-hot-toast';
import { updateJobStatusAction } from '@/app/actions';
import { Job, JobStatus } from '@job-hunt/types';
import { DashboardTabs, TabName } from './DashboardTabs';
import { JobCard } from './JobCard';

export function JobsClient({ initialJobs, masterResume }: { initialJobs: Job[], masterResume: string }) {
    const [optimisticJobs, addOptimisticJob] = useOptimistic(
        initialJobs,
        (state: Job[], newJob: { id: string, status: JobStatus }) => {
            return state.map(j => j.id === newJob.id ? { ...j, status: newJob.status } : j);
        }
    );
    const [, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<TabName>('inbox');

    const handleUpdateStatus = async (id: string, newStatus: JobStatus, oldStatus: JobStatus) => {
        // Optimistic UI Update - Instant Removal/Move
        startTransition(() => {
            addOptimisticJob({ id, status: newStatus });
        });
        
        // Immediate Database Sync
        const res = await updateJobStatusAction(id, newStatus);
        
        if (!res.success) {
            toast.error(res.error ? `Failed to sync: ${res.error}` : "Failed to sync status with Supabase");
            startTransition(() => { addOptimisticJob({ id, status: oldStatus }); });
            return;
        }

        toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px' }}>Job marked as {newStatus}</span>
                <button 
                    onClick={async () => {
                        toast.dismiss(t.id);
                        startTransition(() => { addOptimisticJob({ id, status: oldStatus }); });
                        await updateJobStatusAction(id, oldStatus);
                        toast.success('Undone successfully');
                    }}
                    style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
                >
                    UNDO
                </button>
            </div>
        ), { duration: 5000, style: { background: '#333', color: '#fff' } });
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
            <DashboardTabs 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                counts={{
                    inbox: inboxJobs.length,
                    queue: queueJobs.length,
                    saved: savedJobs.length,
                    applied: appliedJobs.length,
                    rejected: rejectedJobs.length
                }} 
            />

            {displayJobs.length === 0 && (
                <div className={styles.emptyState}>
                    <h2>No jobs here yet.</h2>
                </div>
            )}

            <div className={styles.grid}>
                {displayJobs.map((job, index) => (
                    <JobCard 
                        key={job.id} 
                        job={job} 
                        index={index} 
                        onUpdateStatus={handleUpdateStatus} 
                        masterResume={masterResume} 
                    />
                ))}
            </div>
        </div>
    );
}

'use client';

import { useState, useOptimistic, useTransition, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/app/page.module.css';
import toast from 'react-hot-toast';
import { updateJobStatusAction, triggerGitHubAction } from '@/app/actions';
import { Job, JobStatus } from '@job-hunt/types';
import { DashboardTabs, TabName } from './DashboardTabs';
import { JobCard } from './JobCard';
import { WorkflowStatusPanel } from './WorkflowStatusPanel';
import { WorkflowRun } from '../services/jobs';

const RealtimeJobListener = dynamic(
  () => import('./RealtimeJobListener').then((mod) => mod.RealtimeJobListener),
  { ssr: false }
);

export function JobsClient({
  initialJobs,
  masterResume,
  initialWorkflows = [],
}: {
  initialJobs: Job[];
  masterResume: string;
  initialWorkflows?: WorkflowRun[];
}) {
  const [optimisticJobs, addOptimisticJob] = useOptimistic(
    initialJobs,
    (state: Job[], newJob: { id: string; status: JobStatus }) => {
      return state.map((j) => (j.id === newJob.id ? { ...j, status: newJob.status } : j));
    }
  );
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabName>('inbox');
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTrigger = async (command: string) => {
    setIsTriggering(true);
    const loadingToast = toast.loading(`Waking up the agent for ${command}...`);
    try {
      const res = await triggerGitHubAction(command);
      if (res.success) {
        toast.success(`Agent ${command} triggered!`, { id: loadingToast });
      } else {
        toast.error(`Failed to trigger: ${res.error}`, { id: loadingToast });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? `Error: ${e.message}` : 'An unexpected error occurred', {
        id: loadingToast,
      });
    }
    setIsTriggering(false);
  };
  const handleUpdateStatus = useCallback(
    async (id: string, newStatus: JobStatus, oldStatus: JobStatus) => {
      // Optimistic UI Update - Instant Removal/Move
      startTransition(() => {
        addOptimisticJob({ id, status: newStatus });
      });

      // Immediate Database Sync
      const res = await updateJobStatusAction(id, newStatus);

      if (!res.success) {
        toast.error(
          res.error ? `Failed to sync: ${res.error}` : 'Failed to sync status with Supabase'
        );
        startTransition(() => {
          addOptimisticJob({ id, status: oldStatus });
        });
        return;
      }

      toast(
        (t) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px' }}>Job marked as {newStatus}</span>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                startTransition(() => {
                  addOptimisticJob({ id, status: oldStatus });
                });
                await updateJobStatusAction(id, oldStatus);
                toast.success('Undone successfully');
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              UNDO
            </button>
          </div>
        ),
        { duration: 5000, style: { background: '#333', color: '#fff' } }
      );
    },
    [addOptimisticJob]
  );

  // Single-Pass Array Reduction Grouping
  const groupedJobs = useMemo(() => {
    return optimisticJobs.reduce(
      (acc, job) => {
        if (
          job.status === JobStatus.PENDING ||
          job.status === JobStatus.EVALUATED ||
          job.status === JobStatus.ERROR
        )
          acc.inbox.push(job);
        else if (job.status === JobStatus.ACCEPTED || job.status === JobStatus.APPLYING)
          acc.queue.push(job);
        else if (job.status === JobStatus.APPLIED) acc.applied.push(job);
        else if (job.status === JobStatus.REJECTED) acc.rejected.push(job);
        else if (job.status === JobStatus.SAVED) acc.saved.push(job);
        return acc;
      },
      { inbox: [], queue: [], applied: [], rejected: [], saved: [] } as Record<string, Job[]>
    );
  }, [optimisticJobs]);

  const displayJobs = useMemo(() => {
    if (activeTab === 'inbox') return groupedJobs.inbox;
    if (activeTab === 'queue') return groupedJobs.queue;
    if (activeTab === 'applied') return groupedJobs.applied;
    if (activeTab === 'saved') return groupedJobs.saved;
    return groupedJobs.rejected;
  }, [activeTab, groupedJobs]);

  return (
    <div className={styles.container}>
      <RealtimeJobListener />
      <WorkflowStatusPanel initialWorkflows={initialWorkflows} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            inbox: groupedJobs.inbox.length,
            queue: groupedJobs.queue.length,
            saved: groupedJobs.saved.length,
            applied: groupedJobs.applied.length,
            rejected: groupedJobs.rejected.length,
          }}
        />

        <div className={styles.devTools}>
          <span className={styles.devLabel}>Dev Tools</span>
          <button
            className={styles.buttonSmall}
            onClick={() => handleTrigger('scrape')}
            disabled={isTriggering}
            style={isTriggering ? { opacity: 0.5 } : undefined}
          >
            Scrape
          </button>
          <button
            className={styles.buttonSmall}
            onClick={() => handleTrigger('evaluate')}
            disabled={isTriggering}
            style={isTriggering ? { opacity: 0.5 } : undefined}
          >
            Evaluate
          </button>
          <button
            className={styles.buttonSmall}
            onClick={() => handleTrigger('apply')}
            disabled={isTriggering}
            style={isTriggering ? { opacity: 0.5 } : undefined}
          >
            Apply
          </button>
        </div>
      </div>

      {displayJobs.length === 0 && (
        <div className={styles.emptyState}>
          <h2>No jobs here yet.</h2>
        </div>
      )}

      <div className={styles.grid}>
        {displayJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onUpdateStatus={handleUpdateStatus}
            masterResume={masterResume}
          />
        ))}
      </div>
    </div>
  );
}

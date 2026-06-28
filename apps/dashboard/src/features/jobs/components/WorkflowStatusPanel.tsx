'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { WorkflowRun } from '../services/jobs';
import styles from './WorkflowStatusPanel.module.css';

export function WorkflowStatusPanel({ initialWorkflows }: { initialWorkflows: WorkflowRun[] }) {
  const [workflows, setWorkflows] = useState<WorkflowRun[]>(initialWorkflows);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel('github-workflows')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'github_workflow_runs' },
        (payload) => {
          setWorkflows((prev) => {
            const updated = payload.new as WorkflowRun;
            if (payload.eventType === 'INSERT') {
              // Add to top and limit to 5
              return [updated, ...prev].slice(0, 5);
            } else if (payload.eventType === 'UPDATE') {
              return prev.map((w) => (w.run_id === updated.run_id ? updated : w));
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (workflows.length === 0) {
    return null;
  }

  const getStatusClass = (status: string, conclusion: string | null) => {
    if (status === 'queued') return styles.queued;
    if (status === 'in_progress') return styles.inProgress;
    if (status === 'completed') {
      return conclusion === 'success' ? styles.completedSuccess : styles.completedFailure;
    }
    return styles.queued;
  };

  const formatStatus = (status: string, conclusion: string | null) => {
    if (status === 'queued') return 'Queued';
    if (status === 'in_progress') return 'In Progress';
    if (status === 'completed') {
      return conclusion === 'success' ? 'Success' : `Failed (${conclusion || 'unknown'})`;
    }
    return status;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Agent Workflow Status</h3>
      </div>
      <div className={styles.workflowList}>
        {workflows.map((w) => (
          <div key={w.id || w.run_id} className={styles.workflowItem}>
            <div className={styles.workflowInfo}>
              <span className={styles.workflowName}>{w.workflow_name || 'Job Hunt Agent'}</span>
              <span className={styles.workflowMeta}>
                Run ID: {w.run_id} | Updated:{' '}
                {new Date(w.updated_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className={styles.statusWrapper}>
              <div
                className={`${styles.statusIndicator} ${getStatusClass(w.status, w.conclusion)}`}
              />
              <span>{formatStatus(w.status, w.conclusion)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

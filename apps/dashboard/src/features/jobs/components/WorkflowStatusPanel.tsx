'use client';

import { useState, useMemo } from 'react';
import { WorkflowRun } from '../services/jobs';
import styles from './WorkflowStatusPanel.module.css';

export function WorkflowStatusPanel({ workflows }: { workflows: WorkflowRun[] }) {
  const [dismissedRunIds, setDismissedRunIds] = useState<number[]>([]);

  const handleDismiss = (runId: number) => {
    setDismissedRunIds((prev) => [...prev, runId]);
  };

  const visibleWorkflows = useMemo(() => {
    return workflows.filter((w) => !dismissedRunIds.includes(w.run_id));
  }, [workflows, dismissedRunIds]);

  if (visibleWorkflows.length === 0) {
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
        {visibleWorkflows.map((w) => (
          <div key={w.id || w.run_id} className={styles.workflowItem}>
            <div className={styles.workflowInfo}>
              <span className={styles.workflowName}>{w.workflow_name || 'Job Hunt Agent'}</span>
              <span className={styles.workflowMeta} suppressHydrationWarning>
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
              <button
                onClick={() => handleDismiss(w.run_id)}
                className={styles.dismissButton}
                aria-label="Dismiss run status"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

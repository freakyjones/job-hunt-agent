'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { triggerGitHubAction, triggerNetworkingAction } from '@/app/actions';
import { useWorkflowRuns } from '@/features/jobs/hooks/useWorkflowRuns';
import { WorkflowRun } from '@/features/jobs/services/jobs';
import { WorkflowStatusPanel } from '@/features/jobs/components/WorkflowStatusPanel';
import styles from './FloatingAgentWidget.module.css';

export function FloatingAgentWidget({ initialWorkflows }: { initialWorkflows: WorkflowRun[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  // Realtime subscription via the global hook
  const workflows = useWorkflowRuns(initialWorkflows);

  // Check if any agent is currently running
  const isActionRunning = workflows.some(
    (w) => w.status === 'in_progress' || w.status === 'queued'
  );

  const handleTrigger = async (command: string) => {
    setIsTriggering(true);
    const loadingToast = toast.loading(`Waking up the agent for ${command}...`);
    try {
      let res;
      if (command === 'network-agent') {
        res = await triggerNetworkingAction();
      } else {
        res = await triggerGitHubAction(command);
      }

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

  const isDisabled = isTriggering || isActionRunning;

  return (
    <div className={styles.widgetContainer}>
      {/* The Popover Panel */}
      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.popoverHeader}>
            <h3>Agent Command Center</h3>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className={styles.popoverContent}>
            <div className={styles.devTools}>
              <span className={styles.devLabel}>Manual Triggers</span>
              <div className={styles.buttonGroup}>
                <button
                  className={styles.buttonSmall}
                  onClick={() => handleTrigger('scrape')}
                  disabled={isDisabled}
                  style={isDisabled ? { opacity: 0.5 } : undefined}
                >
                  Scrape Jobs
                </button>
                <button
                  className={styles.buttonSmall}
                  onClick={() => handleTrigger('evaluate')}
                  disabled={isDisabled}
                  style={isDisabled ? { opacity: 0.5 } : undefined}
                >
                  Evaluate
                </button>
                <button
                  className={`${styles.buttonSmall} ${styles.networkBtn}`}
                  onClick={() => handleTrigger('network-agent')}
                  disabled={isDisabled}
                  style={isDisabled ? { opacity: 0.5 } : undefined}
                >
                  Network Agent
                </button>
              </div>
            </div>

            <div className={styles.statusSection}>
              {workflows.length > 0 ? (
                <WorkflowStatusPanel workflows={workflows} />
              ) : (
                <div className={styles.emptyStatus}>No active agent tasks.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* The Floating Action Button */}
      <button
        className={`${styles.fab} ${isActionRunning ? styles.fabPulsing : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Agent Command Center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
          <path d="m14 7 3 3" />
          <path d="M5 6v4" />
          <path d="M19 14v4" />
          <path d="M10 2v2" />
          <path d="M7 8H3" />
          <path d="M21 16h-4" />
          <path d="M11 3H9" />
        </svg>
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { triggerGitHubAction } from '@/app/actions';
import styles from './DevToolsPanel.module.css';

export function DevToolsPanel() {
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

  return (
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
      {/* <button
        className={styles.buttonSmall}
        onClick={() => handleTrigger('apply')}
        disabled={isTriggering}
        style={isTriggering ? { opacity: 0.5 } : undefined}
      >
        Apply
      </button> */}
    </div>
  );
}

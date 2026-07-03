'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { triggerGitHubAction, triggerNetworkingAction } from '@/app/actions';
import styles from './DevToolsPanel.module.css';

export function DevToolsPanel({ isActionRunning = false }: { isActionRunning?: boolean }) {
  const [isTriggering, setIsTriggering] = useState(false);

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
    <div className={styles.devTools}>
      <span className={styles.devLabel}>Dev Tools</span>
      <button
        className={styles.buttonSmall}
        onClick={() => handleTrigger('scrape')}
        disabled={isDisabled}
        style={isDisabled ? { opacity: 0.5 } : undefined}
      >
        Scrape
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
        className={styles.buttonSmall}
        onClick={() => handleTrigger('network-agent')}
        disabled={isDisabled}
        style={
          isDisabled
            ? { opacity: 0.5, borderColor: '#3ecf8e', color: '#3ecf8e' }
            : { borderColor: '#3ecf8e', color: '#3ecf8e' }
        }
      >
        Network Agent
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

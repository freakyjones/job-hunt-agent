import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { WorkflowRun } from '../services/jobs';

export function useWorkflowRuns(initialWorkflows: WorkflowRun[]) {
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
            if (updated && updated.dismissed) {
              return prev.filter((w) => w.run_id !== updated.run_id);
            }
            if (payload.eventType === 'INSERT') {
              // Add to top and limit to 10
              return [updated, ...prev].slice(0, 10);
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

  return workflows;
}

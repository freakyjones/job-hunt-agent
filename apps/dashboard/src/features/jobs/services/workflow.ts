import { createAdminClient } from '@/utils/supabase/server';

export async function dismissWorkflowRunService(runId: number, userId: string) {
  try {
    const supabase = createAdminClient();

    // Verify the workflow run belongs to the user before dismissing
    const { data: existingRun, error: fetchError } = await supabase
      .from('github_workflow_runs')
      .select('id')
      .eq('run_id', runId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingRun) {
      return { error: new Error('Workflow run not found or unauthorized') };
    }

    const { error: updateError } = await supabase
      .from('github_workflow_runs')
      .update({ dismissed: true, updated_at: new Date().toISOString() })
      .eq('run_id', runId)
      .eq('user_id', userId);

    if (updateError) {
      return { error: new Error(updateError.message) };
    }

    return { data: { success: true } };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const expectedToken = process.env.CI_INTERNAL_TOKEN;

    if (!expectedToken) {
      console.error('[Github Link User] CI_INTERNAL_TOKEN is not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { run_id, user_id, workflow_name } = payload;

    if (!run_id || !user_id) {
      return NextResponse.json({ error: 'Missing run_id or user_id' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Use upsert so if the webhook beats this route, or this route beats the webhook, they merge safely
    // By only providing run_id, user_id, and workflow_name, it preserves other columns like `status` if they exist.
    const { error } = await supabase.from('github_workflow_runs').upsert(
      {
        run_id,
        user_id,
        ...(workflow_name ? { workflow_name } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'run_id' }
    );

    if (error) {
      console.error('[Github Link User] Database Error:', error.message);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[Github Link User] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

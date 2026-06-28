import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (secret) {
      if (!signature || !verifySignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // We only care about workflow_run events
    if (payload.workflow_run) {
      const run = payload.workflow_run;
      const supabase = createAdminClient();

      const { error } = await supabase.from('github_workflow_runs').upsert(
        {
          run_id: run.id,
          status: run.status,
          conclusion: run.conclusion,
          workflow_name: run.name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'run_id' }
      );

      if (error) {
        console.error('[Github Webhook] Database Error:', error.message);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[Github Webhook] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (signatureBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
}

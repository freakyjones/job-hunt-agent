import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const metrics = Array.isArray(body.metrics) ? body.metrics : body.name ? [body] : [];

    if (metrics.length > 0) {
      const inserts = metrics.map((m: any) => ({
        level: 'info',
        message: `Core Web Vitals Metric: ${m.name}`,
        context: m,
      }));

      const supabase = await createClient();
      await supabase.from('system_logs').insert(inserts);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to record telemetry' }, { status: 500 });
  }
}

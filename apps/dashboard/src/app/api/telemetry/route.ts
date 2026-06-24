import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const supabase = await createClient();

    await supabase.from('system_logs').insert({
      level: 'info',
      message: 'Core Web Vitals Metric',
      context: body,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to record telemetry' }, { status: 500 });
  }
}

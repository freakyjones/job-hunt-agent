import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        await supabase.from('system_logs').insert({
            level: 'info',
            message: 'Core Web Vitals Metric',
            context: body
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to record telemetry' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@job-hunt/logger';

export async function POST(req: NextRequest) {
  try {
    // Basic Security Check
    const authHeader = req.headers.get('x-telemetry-token');
    const expectedToken = process.env.TELEMETRY_SECRET_TOKEN || 'local-dev-secret';

    if (authHeader !== expectedToken) {
      logger.warn('[Telemetry Webhook] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    // Log beautifully using Pino
    const context = payload.context || {};
    if (payload.level === 'error') {
      logger.error(
        { ...context },
        `[Edge Function: ${payload.source || 'unknown'}] ${payload.message}`
      );
    } else {
      logger.info(
        { ...context },
        `[Edge Function: ${payload.source || 'unknown'}] ${payload.message}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    logger.error('Failed to parse incoming telemetry webhook');
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

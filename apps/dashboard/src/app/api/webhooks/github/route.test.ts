import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '@/utils/supabase/server';
import crypto from 'crypto';

vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
}));

describe('POST /api/webhooks/github', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GITHUB_WEBHOOK_SECRET: 'webhook_secret' };
  });

  const createMockRequest = (textBody: string, signature: string | null = null) => {
    return {
      text: vi.fn().mockResolvedValue(textBody),
      headers: {
        get: vi.fn().mockImplementation((name) => {
          if (name === 'x-hub-signature-256') return signature;
          return null;
        }),
      },
    } as unknown as NextRequest;
  };

  it('should return 401 if GITHUB_WEBHOOK_SECRET is set but signature is invalid', async () => {
    const req = createMockRequest(JSON.stringify({}), 'invalid_signature');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should upsert workflow status to supabase on valid request', async () => {
    const body = {
      workflow_run: {
        id: 123456,
        name: 'Job Hunt Agent Scraper',
        status: 'in_progress',
        conclusion: null,
      },
    };
    const bodyText = JSON.stringify(body);

    // Generate valid signature using webhook_secret
    const hmac = crypto.createHmac('sha256', 'webhook_secret');
    const signature = 'sha256=' + hmac.update(bodyText).digest('hex');

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabaseServer.createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        upsert: mockUpsert,
      }),
    } as any);

    const req = createMockRequest(bodyText, signature);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const resJson = await res.json();
    expect(resJson.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        run_id: 123456,
        status: 'in_progress',
        conclusion: null,
        workflow_name: 'Job Hunt Agent Scraper',
      }),
      { onConflict: 'run_id' }
    );
  });
});

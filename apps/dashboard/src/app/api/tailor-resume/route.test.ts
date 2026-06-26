import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as supabaseServer from '@/utils/supabase/server';
import { GoogleGenAI } from '@google/genai';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  Type: { OBJECT: 'object', STRING: 'string', ARRAY: 'array' },
}));

// Mock pdfmake since it tries to read the VFS
vi.mock('pdfmake/build/pdfmake.js', () => ({
  createPdf: vi.fn().mockReturnValue({
    getBuffer: vi.fn().mockResolvedValue(Buffer.from('pdf data')),
  }),
}));

vi.mock('pdfmake/build/standard-fonts/Helvetica.js', () => ({
  vfs: {},
}));

describe('POST /api/tailor-resume', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test_key' };
  });

  const createMockRequest = (body: any) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  it('should return 400 if missing inputs', async () => {
    const req = createMockRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 401 if unauthorized', async () => {
    const req = createMockRequest({ jobId: '1', jobDescription: 'JD', masterResume: 'MR' });

    vi.mocked(supabaseServer.createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Auth err') }),
      },
    } as any);

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should use fallback model if primary model fails', async () => {
    const req = createMockRequest({ jobId: '1', jobDescription: 'JD', masterResume: 'MR' });

    const mockStorage = {
      from: vi.fn().mockReturnValue({ upload: vi.fn().mockResolvedValue({ error: null }) }),
    };
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabaseServer.createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      storage: mockStorage,
      from: vi.fn().mockReturnValue({ insert: mockInsert }),
    } as any);

    const mockGenerateContent = vi
      .fn()
      .mockRejectedValueOnce(new Error('Rate Limit on Flash'))
      .mockResolvedValueOnce({
        text: JSON.stringify({
          name: 'Test',
          contact: 'email',
          summary: 'sum',
          skills: [],
          experience: [],
        }),
      });

    vi.mocked(GoogleGenAI).mockImplementation(function () {
      return {
        models: { generateContent: mockGenerateContent },
      } as any;
    } as any);

    // Suppress console.error/warn during the test
    const consoleSpyErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleSpyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ model: 'gemini-2.5-flash' })
    );
    expect(mockGenerateContent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: 'gemma-4-31b-it' })
    );

    consoleSpyErr.mockRestore();
    consoleSpyWarn.mockRestore();
  });
});

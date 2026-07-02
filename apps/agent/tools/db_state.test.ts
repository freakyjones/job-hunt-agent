import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DBStateManager } from './db_state';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

describe('DBStateManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('should throw error if userId is missing', () => {
    expect(() => new (DBStateManager as any)()).toThrow(
      'userId is required for DBStateManager to ensure tenant isolation.'
    );
  });

  it('should throw error if Supabase credentials are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => new DBStateManager('test-user-id')).toThrow(
      'Missing Supabase credentials in .env'
    );
  });

  it('should initialize successfully when credentials are provided', () => {
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key';

    expect(() => new DBStateManager('test-user-id')).not.toThrow();
    expect(createClient).toHaveBeenCalledWith('http://localhost:54321', 'test_key');
  });

  it('addPendingJobs should use upsert with onConflict url and ignoreDuplicates true', async () => {
    process.env.SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert });

    vi.mocked(createClient).mockReturnValue({
      from: mockFrom,
    } as any);

    const manager = new DBStateManager('test-user-id');

    const mockJobs = [{ company: 'Google', role: 'SWE', url: 'https://g.co', status: 'PENDING' }];

    await manager.addPendingJobs(mockJobs as any);

    expect(mockFrom).toHaveBeenCalledWith('jobs');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ company: 'Google', url: 'https://g.co' })]),
      { onConflict: 'url', ignoreDuplicates: true }
    );
  });

  it('updateJobStatus should handle payload conditionally', async () => {
    process.env.SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test';

    const mockEq2 = vi.fn().mockResolvedValue({ error: null });
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    vi.mocked(createClient).mockReturnValue({
      from: mockFrom,
    } as any);

    // Suppress console.log for the test
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const manager = new DBStateManager('test-user-id');

    await manager.updateJobStatus('job123', 'EVALUATED' as any, 95, 'Great fit');

    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'EVALUATED',
      score: 95,
      reasoning: 'Great fit',
    });
    expect(mockEq1).toHaveBeenCalledWith('id', 'job123');
    expect(mockEq2).toHaveBeenCalledWith('user_id', 'test-user-id');

    consoleSpy.mockRestore();
  });
});

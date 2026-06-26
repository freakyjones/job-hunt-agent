import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getJobs, updateJobStatus } from './jobs';
import * as supabaseServer from '@/utils/supabase/server';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Jobs Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getJobs', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return jobs data on successful fetch', async () => {
      const mockData = [{ id: '1', title: 'Software Engineer', score: 95 }];
      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(supabaseServer.createClient).mockResolvedValue({
        from: mockFrom,
      } as any);

      const result = await getJobs();
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeUndefined();
      expect(mockFrom).toHaveBeenCalledWith('jobs');
      expect(mockOrder).toHaveBeenCalledWith('score', { ascending: false, nullsFirst: false });
    });

    it('should retry on exception and resolve if a retry succeeds', async () => {
      vi.useFakeTimers();

      const mockData = [{ id: '1', title: 'Software Engineer', score: 95 }];
      const mockLimit = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error 1'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce({ data: mockData, error: null });

      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(supabaseServer.createClient).mockResolvedValue({
        from: mockFrom,
      } as any);

      // We need to advance timers while the promise is pending.
      // Since await will pause execution, we can start the promise, then advance timers.
      const promise = getJobs();

      // Advance first wait (500ms)
      await vi.advanceTimersByTimeAsync(500);
      // Advance second wait (1000ms)
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result.data).toEqual(mockData);
      expect(mockLimit).toHaveBeenCalledTimes(3);
    });

    it('should fail after 3 exceptions', async () => {
      vi.useFakeTimers();

      const mockLimit = vi.fn().mockRejectedValue(new Error('Persistent network error'));

      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(supabaseServer.createClient).mockResolvedValue({
        from: mockFrom,
      } as any);

      const promise = getJobs();
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result.data).toBeNull();
      expect(result.error).toBe('Persistent network error');
      expect(mockLimit).toHaveBeenCalledTimes(3);
    });

    it('should return error if Supabase query returns an error object without throwing', async () => {
      const mockLimit = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Supabase Query Error' } });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(supabaseServer.createClient).mockResolvedValue({
        from: mockFrom,
      } as any);

      const result = await getJobs();
      expect(result.data).toBeNull();
      expect(result.error).toBe('Supabase Query Error');
      expect(mockLimit).toHaveBeenCalledTimes(1); // Should not retry on DB error, only on throw
    });
  });

  describe('updateJobStatus', () => {
    it('should throw validation error if status is invalid', async () => {
      await expect(updateJobStatus('1', 'INVALID_STATUS')).rejects.toThrow();
    });

    it('should successfully update job status', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      vi.mocked(supabaseServer.createClient).mockResolvedValue({
        from: mockFrom,
      } as any);

      // Assuming 'SAVED' is a valid status from JobStatusEnum
      await updateJobStatus('1', 'SAVED');

      expect(mockFrom).toHaveBeenCalledWith('jobs');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'SAVED' });
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error if Supabase update fails', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      vi.mocked(supabaseServer.createClient).mockResolvedValue({
        from: mockFrom,
      } as any);

      await expect(updateJobStatus('1', 'SAVED')).rejects.toThrow('Update failed');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateExamAction } from './actions';
import * as examService from './services/exam.service';
import { verifyAuth } from '../core/services/auth';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('../core/services/auth', () => ({
  verifyAuth: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('./services/exam.service', () => ({
  queueExamGeneration: vi.fn(),
  checkExistingExamGeneration: vi.fn().mockResolvedValue({}),
  triggerExamGeneration: vi.fn(),
}));

describe('actions.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateExamAction', () => {
    it('should extract error message if queueExamGeneration throws a native Error', async () => {
      vi.mocked(verifyAuth).mockResolvedValue({ user: { id: 'test-user-id' } } as any);
      vi.mocked(examService.queueExamGeneration).mockRejectedValue(
        new Error('Native error extracted correctly')
      );

      const result = await generateExamAction('job-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Native error extracted correctly');
    });

    it('should safely convert primitive/unknown errors using String()', async () => {
      vi.mocked(verifyAuth).mockResolvedValue({ user: { id: 'test-user-id' } } as any);
      vi.mocked(examService.queueExamGeneration).mockRejectedValue({ code: 500 });

      const result = await generateExamAction('job-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('should return error payload when verifyAuth throws exception', async () => {
      vi.mocked(verifyAuth).mockRejectedValue(new Error('Unauthorized request'));

      const result = await generateExamAction('job-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized request');
      expect(examService.queueExamGeneration).not.toHaveBeenCalled();
    });

    it('should return success and jobId on success', async () => {
      vi.mocked(verifyAuth).mockResolvedValue({ user: { id: 'test-user-id' } } as any);
      vi.mocked(examService.queueExamGeneration).mockResolvedValue({ jobId: 'job-123' } as any);

      const result = await generateExamAction('job-123');
      expect(result.success).toBe(true);
      expect(result).toEqual({ success: true, jobId: 'job-123' });
    });
  });
});

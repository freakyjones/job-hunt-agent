import { describe, it, expect, vi } from 'vitest';
import { calculateExamScoreAndFeedback, queueExamGeneration } from './exam.service';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'job-id', status: 'pending' }, error: null }),
  })),
}));

describe('exam.service', () => {
  describe('calculateExamScoreAndFeedback', () => {
    it('should calculate 100% when all answers are correct', () => {
      const questions = [
        { id: 'q1', exam_answers: { correct_option: 'A', explanation: 'exp1' } },
        { id: 'q2', exam_answers: [{ correct_option: 'B', explanation: 'exp2' }] },
      ];
      const payload = [
        { question_id: 'q1', selected_option: 'A' },
        { question_id: 'q2', selected_option: 'B' },
      ];

      const result = calculateExamScoreAndFeedback(questions, payload);
      expect(result.percentageScore).toBe(100);
      expect(result.feedback['q1']?.correct).toBe(true);
      expect(result.feedback['q2']?.correct).toBe(true);
    });

    it('should calculate partial score correctly', () => {
      const questions = [
        { id: 'q1', exam_answers: { correct_option: 'A', explanation: 'exp1' } },
        { id: 'q2', exam_answers: { correct_option: 'B', explanation: 'exp2' } },
      ];
      const payload = [
        { question_id: 'q1', selected_option: 'A' },
        { question_id: 'q2', selected_option: 'C' },
      ];

      const result = calculateExamScoreAndFeedback(questions, payload);
      expect(result.percentageScore).toBe(50);
      expect(result.feedback['q1']?.correct).toBe(true);
      expect(result.feedback['q2']?.correct).toBe(false);
    });

    it('should evaluate missing submissions as incorrect without crashing', () => {
      const questions = [
        { id: 'q1', exam_answers: { correct_option: 'A' } },
        { id: 'q2', exam_answers: { correct_option: 'B' } },
      ];
      const payload = [{ question_id: 'q1', selected_option: 'A' }]; // Missing q2

      const result = calculateExamScoreAndFeedback(questions, payload);
      expect(result.percentageScore).toBe(50);
      expect(result.feedback['q2']?.correct).toBe(false);
    });

    it('should handle undefined exam_answers safely', () => {
      const questions = [{ id: 'q1', exam_answers: undefined }];
      const payload = [{ question_id: 'q1', selected_option: 'A' }];

      const result = calculateExamScoreAndFeedback(questions, payload);
      expect(result.percentageScore).toBe(0);
      expect(result.feedback['q1']).toBeUndefined();
    });
  });

  describe('queueExamGeneration', () => {
    it('should successfully call insert on exam_generation_jobs with pending status', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: 'job-id', status: 'pending' }, error: null }),
      } as any;
      const result = await queueExamGeneration(mockSupabase, 'test-user-id', 'test-job-id');
      expect(result.jobId).toBe('job-id');
    });
  });
});

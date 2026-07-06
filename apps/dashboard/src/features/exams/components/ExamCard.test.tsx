/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExamCard } from './ExamCard';

// Next.js uses standard imports. We need to mock Next.js Link and navigation if used, but assume ExamCard receives props.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('ExamCard Component', () => {
  const defaultProps = {
    jobId: 'job-123',
    jobTitle: 'Software Engineer',
    company: 'Tech Corp',
    exam: { id: 'exam-123', status: 'PENDING' },
  } as any;

  it('renders "Generating..." disabled button when status is processing', () => {
    // If the component uses useOptimistic internally, it should be natively handled by jsdom/testing-library for React 18/19
    render(<ExamCard {...defaultProps} exam={{ id: 'exam-1', status: 'PROCESSING' }} />);

    const button = screen.getByRole('button', { name: /Generating/i });
    expect(button).toBeDefined();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders "Take Exam" primary button when status is pending', () => {
    render(<ExamCard {...defaultProps} exam={{ id: 'exam-1', status: 'PENDING' }} />);

    const link = screen.getByRole('link', { name: /Take Exam/i });
    expect(link).toBeDefined();
  });

  it('renders score badge and "Review Results" button when status is completed', () => {
    render(<ExamCard {...defaultProps} exam={{ id: 'exam-1', status: 'COMPLETED', score: 85 }} />);

    const link = screen.getByRole('link', { name: /Review Results/i });
    expect(link).toBeDefined();

    const scoreLabel = screen.getByText(/Score:/i);
    expect(scoreLabel).toBeDefined();
    const scoreValue = screen.getByText(/85%/i);
    expect(scoreValue).toBeDefined();
  });
});

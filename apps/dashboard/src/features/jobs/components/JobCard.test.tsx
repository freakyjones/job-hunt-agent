/** @vitest-environment jsdom */

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JobCard } from './JobCard';

// Mock TailorResumeButton
vi.mock('./TailorResumeButton', () => ({
  TailorResumeButton: () => <button data-testid="tailor-btn">Tailor Resume</button>,
}));

describe('JobCard Component', () => {
  const mockUpdateStatus = vi.fn();

  const baseJob = {
    id: '123',
    role: 'Frontend Developer',
    company: 'Tech Innovators',
    status: 'PENDING',
    url: 'https://careers.google.com/job',
    score: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders job title and company', () => {
    render(
      <JobCard job={baseJob as any} masterResume="My Resume" onUpdateStatus={mockUpdateStatus} />
    );
    expect(screen.getByText('Frontend Developer')).toBeDefined();
    expect(screen.getByText('Tech Innovators')).toBeDefined();
  });

  it('renders PENDING badge when status is PENDING', () => {
    render(
      <JobCard job={baseJob as any} masterResume="My Resume" onUpdateStatus={mockUpdateStatus} />
    );
    expect(screen.getByText('PENDING')).toBeDefined();
  });

  it('renders score badge with AI gradient if score is >= 80', () => {
    const highMatchJob = { ...baseJob, status: 'EVALUATED', score: 95 };
    render(
      <JobCard
        job={highMatchJob as any}
        masterResume="My Resume"
        onUpdateStatus={mockUpdateStatus}
      />
    );
    const scoreBadge = screen.getByText('95/100');
    expect(scoreBadge).toBeDefined();
    expect(scoreBadge.className).toContain('text-ai-gradient');
  });

  it('renders standard score badge if score is < 80', () => {
    const lowMatchJob = { ...baseJob, status: 'EVALUATED', score: 50 };
    render(
      <JobCard
        job={lowMatchJob as any}
        masterResume="My Resume"
        onUpdateStatus={mockUpdateStatus}
      />
    );
    const scoreBadge = screen.getByText('50/100');
    expect(scoreBadge).toBeDefined();
    expect(scoreBadge.className).not.toContain('text-ai-gradient');
  });

  it('renders ERR badge for ERROR status', () => {
    const errorJob = { ...baseJob, status: 'ERROR' };
    render(
      <JobCard job={errorJob as any} masterResume="My Resume" onUpdateStatus={mockUpdateStatus} />
    );
    expect(screen.getByText('ERR')).toBeDefined();
    expect(screen.getByText('Failed to evaluate or apply.')).toBeDefined();
  });

  it('fires onUpdateStatus with SAVED when Save is clicked for non-auto-applicable job', () => {
    const evaluatedJob = { ...baseJob, status: 'EVALUATED', url: 'https://careers.google.com/job' };
    render(
      <JobCard
        job={evaluatedJob as any}
        masterResume="My Resume"
        onUpdateStatus={mockUpdateStatus}
      />
    );

    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);
    expect(mockUpdateStatus).toHaveBeenCalledWith('123', 'SAVED', 'EVALUATED');
  });

  it('fires onUpdateStatus with ACCEPTED when Queue is clicked for auto-applicable job', () => {
    const autoApplyJob = {
      ...baseJob,
      status: 'EVALUATED',
      url: 'https://boards.greenhouse.io/tech/123',
    };
    render(
      <JobCard
        job={autoApplyJob as any}
        masterResume="My Resume"
        onUpdateStatus={mockUpdateStatus}
      />
    );

    const queueBtn = screen.getByText('Queue');
    fireEvent.click(queueBtn);
    expect(mockUpdateStatus).toHaveBeenCalledWith('123', 'ACCEPTED', 'EVALUATED');
  });

  it('fires onUpdateStatus with REJECTED when Reject is clicked', () => {
    render(
      <JobCard job={baseJob as any} masterResume="My Resume" onUpdateStatus={mockUpdateStatus} />
    );

    const rejectBtn = screen.getByText('Reject');
    fireEvent.click(rejectBtn);
    expect(mockUpdateStatus).toHaveBeenCalledWith('123', 'REJECTED', 'PENDING');
  });
});

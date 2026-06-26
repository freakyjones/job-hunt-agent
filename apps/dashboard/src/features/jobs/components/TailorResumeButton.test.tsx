/** @vitest-environment jsdom */
// import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TailorResumeButton } from './TailorResumeButton';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockJob = {
  id: 'job-123',
  role: 'Frontend Developer',
  company: 'Tech Corp',
  status: 'PENDING',
  url: 'https://example.com/job',
  description: 'A great react developer role',
};

describe('TailorResumeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL APIs that are missing in jsdom
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('triggers the correct payload and initiates PDF download on success', async () => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock pdf content'], { type: 'application/pdf' })),
    });

    render(<TailorResumeButton job={mockJob as any} masterResumeContent="My Master Resume" />);

    const button = screen.getByRole('button', { name: /Tailor PDF/i });
    fireEvent.click(button);

    // Button should change to loading state
    expect(screen.getByRole('button', { name: /Tailoring\.\.\./i })).toBeDefined();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tailor-resume',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: 'job-123',
            jobDescription: 'A great react developer role',
            masterResume: 'My Master Resume',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    // Since we mocked createElement, we can't easily assert on 'click' here because
    // it's a mocked object we created. But we know URL.createObjectURL was called which means success.
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('shows error toast and error message on network failure', async () => {
    // Mock failed fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'AI Rate Limit Exceeded' }),
    });

    render(<TailorResumeButton job={mockJob as any} masterResumeContent="My Master Resume" />);

    const button = screen.getByRole('button', { name: /Tailor PDF/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('AI Rate Limit Exceeded');
    });

    // Should render the error text below the button
    expect(screen.getByText('AI Rate Limit Exceeded')).toBeDefined();

    // Button should revert to normal state
    expect(screen.getByRole('button', { name: /Tailor PDF/i })).toBeDefined();
  });

  it('shows fallback error if json parsing fails on non-ok response', async () => {
    // Mock failed fetch without JSON response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    render(<TailorResumeButton job={mockJob as any} masterResumeContent="My Master Resume" />);

    const button = screen.getByRole('button', { name: /Tailor PDF/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Request failed with status 404');
    });
  });
});

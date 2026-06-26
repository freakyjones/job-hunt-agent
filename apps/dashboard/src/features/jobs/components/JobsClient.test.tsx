/** @vitest-environment jsdom */

import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JobsClient } from './JobsClient';
import * as actions from '../../../app/actions';
import toast from 'react-hot-toast';

vi.mock('../../../app/actions', () => ({
  updateJobStatusAction: vi.fn(),
}));

vi.mock('react-hot-toast', () => {
  const toastMock: any = vi.fn((content) => {
    if (toastMock.mockRender) {
      toastMock.mockRender(content);
    }
    return 'toast-id';
  });
  toastMock.error = vi.fn();
  toastMock.success = vi.fn();
  toastMock.dismiss = vi.fn();
  toastMock.mockRender = null;
  return { default: toastMock };
});

vi.mock('./RealtimeJobListener', () => ({
  RealtimeJobListener: () => <div data-testid="realtime-listener" />,
}));

const mockJobs = [
  {
    id: '1',
    role: 'Frontend Developer',
    company: 'Tech Corp',
    status: 'PENDING',
    url: 'https://example.com/1',
  },
  {
    id: '2',
    role: 'Backend Developer',
    company: 'Server LLC',
    status: 'SAVED',
    url: 'https://example.com/2',
  },
];

vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useOptimistic: (initialValue: any, reducer: any) => {
      const [state, setState] = actual.useState(initialValue);
      const dispatch = (action: any) => {
        setState((current: any) => reducer(current, action));
      };
      return [state, dispatch];
    },
  };
});

describe('JobsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders initial jobs in the correct tabs', () => {
    render(<JobsClient initialJobs={mockJobs as any} masterResume="Resume" />);
    // Active tab defaults to Inbox (PENDING)
    expect(screen.getByText('Frontend Developer')).toBeDefined();
    expect(screen.queryByText('Backend Developer')).toBeNull();

    // Switch to Saved tab
    const savedBtns = screen.getAllByRole('button', { name: /Saved/i });
    fireEvent.click(savedBtns[0]);

    expect(screen.queryByText('Frontend Developer')).toBeNull();
    expect(screen.getByText('Backend Developer')).toBeDefined();
  });

  it('optimistically moves job when status is updated', async () => {
    let resolveAction: any;
    const actionPromise = new Promise((r) => {
      resolveAction = r;
    });
    vi.mocked(actions.updateJobStatusAction).mockReturnValue(actionPromise as any);

    render(<JobsClient initialJobs={mockJobs as any} masterResume="Resume" />);

    // In Inbox
    expect(screen.getByText('Frontend Developer')).toBeDefined();

    // Click Reject (moves to REJECTED)
    await act(async () => {
      fireEvent.click(screen.getByText('Reject'));
    });

    // It should instantly disappear from Inbox because of optimistic update
    expect(screen.queryByText('Frontend Developer')).toBeNull();

    // Check if actions was called
    expect(actions.updateJobStatusAction).toHaveBeenCalledWith('1', 'REJECTED');

    resolveAction({ success: true });
  });

  it('reverts optimistic update on network failure', async () => {
    vi.mocked(actions.updateJobStatusAction).mockResolvedValue({
      success: false,
      error: 'DB Error',
    } as any);

    render(<JobsClient initialJobs={mockJobs as any} masterResume="Resume" />);

    // In Inbox
    expect(screen.getByText('Frontend Developer')).toBeDefined();

    // Click Reject
    await act(async () => {
      fireEvent.click(screen.getByText('Reject'));
    });

    // Wait for the state to revert after await updateJobStatusAction
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeDefined();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to sync: DB Error');
  });

  it('handles UNDO functionality correctly', async () => {
    vi.mocked(actions.updateJobStatusAction).mockResolvedValue({ success: true } as any);

    render(<JobsClient initialJobs={mockJobs as any} masterResume="Resume" />);

    // Intercept the toast render so we can click the UNDO button
    let toastContent: any;
    (toast as any).mockRender = (content: any) => {
      toastContent = content;
    };

    // Click Reject
    await act(async () => {
      fireEvent.click(screen.getByText('Reject'));
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
    });

    // Render the toast content into a separate container to interact with it
    const element =
      typeof toastContent === 'function' ? toastContent({ id: 'toast-id' }) : toastContent;
    render(element);

    // Click UNDO in the toast
    const undoBtn = await screen.findByText('UNDO');
    await act(async () => {
      fireEvent.click(undoBtn);
    });

    // Wait for the job to reappear in Inbox
    await waitFor(() => {
      const jobCards = screen.getAllByText('Frontend Developer');
      expect(jobCards.length).toBeGreaterThan(0);
    });

    // Ensure it sent the revert request
    expect(actions.updateJobStatusAction).toHaveBeenCalledWith('1', 'PENDING');
  });
});

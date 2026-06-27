'use client';

import dynamic from 'next/dynamic';

const Toaster = dynamic(() => import('react-hot-toast').then((m) => m.Toaster), {
  ssr: false,
});

const WebVitalsReporter = dynamic(
  () => import('@/components/WebVitalsReporter').then((m) => m.WebVitalsReporter),
  {
    ssr: false,
  }
);

export function ClientProviders() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-high-contrast)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-sans)',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'var(--bg-surface)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'var(--bg-surface)',
            },
          },
        }}
      />
      <WebVitalsReporter />
    </>
  );
}

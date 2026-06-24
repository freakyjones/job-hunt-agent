'use client';

import { useReportWebVitals } from 'next/web-vitals';

import { useEffect } from 'react';

// Next.js 15+ compatible Web Vitals batching
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const metricsQueue: any[] = [];

function flushQueue() {
  if (metricsQueue.length === 0) return;
  const currentQueue = [...metricsQueue];
  metricsQueue.length = 0;

  fetch('/api/telemetry', {
    body: JSON.stringify({ metrics: currentQueue }),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true, // Crucial for visibilitychange flush
  }).catch(() => {
    // Silently fail in production to not spam console
  });
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    metricsQueue.push(metric);
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushQueue();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(flushQueue, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
      flushQueue();
    };
  }, []);

  return null;
}

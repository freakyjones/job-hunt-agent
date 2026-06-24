'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    fetch('/api/telemetry', {
      body: JSON.stringify(metric),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(console.error);
  });
  return null;
}

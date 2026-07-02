'use client';

import dynamic from 'next/dynamic';

export const AgentVisualDynamic = dynamic(
  () => import('./AgentVisual').then((mod) => mod.AgentVisual),
  { ssr: false }
);

import { Suspense } from 'react';
import Loading from './loading';
import { JobsDataFetcher } from '@/features/jobs/components/JobsDataFetcher';

export default function JobsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <JobsDataFetcher />
    </Suspense>
  );
}

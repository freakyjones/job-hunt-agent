import { NetworkDashboard } from '@/features/network/components/NetworkDashboard';

export const metadata = {
  title: 'Network | Job Hunt Agent',
  description: 'Manage target companies and warm leads.',
};

export default function NetworkPage() {
  return (
    <main>
      <NetworkDashboard />
    </main>
  );
}

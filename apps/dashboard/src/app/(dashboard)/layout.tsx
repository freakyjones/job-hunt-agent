import { Sidebar } from '@/features/core/components/Sidebar';
import { Header } from '@/features/core/components/Header';
import { FloatingAgentWidget } from '@/features/core/components/FloatingAgentWidget';
import { getRecentWorkflows } from '@/features/jobs/services/jobs';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const workflowsResult = await getRecentWorkflows();
  const initialWorkflows = workflowsResult.data || [];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <Header />
        <main style={{ flex: 1, padding: '0' }}>{children}</main>
      </div>
      <FloatingAgentWidget initialWorkflows={initialWorkflows} />
    </div>
  );
}

import { Sidebar } from '@/features/core/components/Sidebar';
import { Header } from '@/features/core/components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '20px' }}>
                <Header />
                <main style={{ flex: 1, marginTop: '20px' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}

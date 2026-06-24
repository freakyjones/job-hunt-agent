import Link from 'next/link';

export function Sidebar() {
    return (
        <aside style={{ width: '250px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRight: '1px solid rgba(255,255,255,0.1)', height: '100vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Agentic Job Hunt</h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link href="/jobs" className="button" style={{ display: 'block', textAlign: 'left', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>💼 Jobs</Link>
                <Link href="/resumes" className="button" style={{ display: 'block', textAlign: 'left', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>📄 Resumes</Link>
            </nav>
        </aside>
    );
}

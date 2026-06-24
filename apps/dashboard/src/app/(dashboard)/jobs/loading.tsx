export default function JobsLoading() {
    return (
        <div style={{ padding: '20px' }} className="animate-fade-in">
            <h2 style={{ marginBottom: '20px' }}>Loading Jobs...</h2>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="glass-panel" style={{ height: '180px', background: 'rgba(255,255,255,0.02)' }}></div>
                ))}
            </div>
        </div>
    );
}

import styles from './page.module.css';

export default function Loading() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Agentic Job Hunt Dashboard</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="button button-primary" style={{ opacity: 0.5 }}>Loading...</div>
                </div>
            </header>

            <div className={styles.stats}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`glass-panel ${styles.statCard}`} style={{ opacity: 0.5, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                        <div className={styles.statValue}>...</div>
                        <div className={styles.statLabel}>Loading</div>
                    </div>
                ))}
            </div>

            <div className={styles.grid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={`glass-panel ${styles.jobCard}`} style={{ opacity: 0.5, height: '200px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                ))}
            </div>
        </div>
    );
}

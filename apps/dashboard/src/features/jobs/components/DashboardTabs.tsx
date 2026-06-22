import styles from '../../../app/page.module.css';

export type TabName = 'inbox' | 'queue' | 'applied' | 'rejected' | 'saved';

interface DashboardTabsProps {
    activeTab: TabName;
    setActiveTab: (tab: TabName) => void;
    counts: {
        inbox: number;
        queue: number;
        saved: number;
        applied: number;
        rejected: number;
    }
}

export function DashboardTabs({ activeTab, setActiveTab, counts }: DashboardTabsProps) {
    return (
        <div className={styles.tabsContainer}>
            <button 
                className={`${styles.tab} ${activeTab === 'inbox' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('inbox')}
            >
                📥 Inbox <span className={styles.badge}>{counts.inbox}</span>
            </button>
            <button 
                className={`${styles.tab} ${activeTab === 'queue' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('queue')}
            >
                🤖 Bot Queue <span className={styles.badge}>{counts.queue}</span>
            </button>
            <button 
                className={`${styles.tab} ${activeTab === 'saved' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('saved')}
            >
                🔖 Saved (Manual) <span className={styles.badge}>{counts.saved}</span>
            </button>
            <button 
                className={`${styles.tab} ${activeTab === 'applied' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('applied')}
            >
                ✅ Applied <span className={styles.badge}>{counts.applied}</span>
            </button>
            <button 
                className={`${styles.tab} ${activeTab === 'rejected' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('rejected')}
            >
                🗑️ Rejected <span className={styles.badge}>{counts.rejected}</span>
            </button>
        </div>
    );
}

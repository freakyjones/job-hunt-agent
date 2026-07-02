import styles from '@/app/page.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.25; }
        }
        .skeleton {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
      `,
        }}
      />
      {/* Tabs and Dev Tools Skeleton Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px',
        }}
      >
        <div className={styles.tabsContainer}>
          <div className={`${styles.tab} ${styles.activeTab}`}>
            📥 Inbox{' '}
            <span
              className="skeleton"
              style={{
                width: '18px',
                height: '14px',
                display: 'inline-block',
                marginLeft: '6px',
                borderRadius: '12px',
              }}
            />
          </div>
          <div className={styles.tab}>
            🤖 Bot Queue{' '}
            <span
              className="skeleton"
              style={{
                width: '18px',
                height: '14px',
                display: 'inline-block',
                marginLeft: '6px',
                borderRadius: '12px',
              }}
            />
          </div>
          <div className={styles.tab}>
            🔖 Saved (Manual){' '}
            <span
              className="skeleton"
              style={{
                width: '18px',
                height: '14px',
                display: 'inline-block',
                marginLeft: '6px',
                borderRadius: '12px',
              }}
            />
          </div>
          <div className={styles.tab}>
            ✅ Applied{' '}
            <span
              className="skeleton"
              style={{
                width: '18px',
                height: '14px',
                display: 'inline-block',
                marginLeft: '6px',
                borderRadius: '12px',
              }}
            />
          </div>
          <div className={styles.tab}>
            🗑️ Rejected{' '}
            <span
              className="skeleton"
              style={{
                width: '18px',
                height: '14px',
                display: 'inline-block',
                marginLeft: '6px',
                borderRadius: '12px',
              }}
            />
          </div>
        </div>

        <div className={styles.devTools} style={{ opacity: 0.5 }}>
          <span className={styles.devLabel}>Dev Tools</span>
          <button className={styles.buttonSmall} disabled>
            Scrape
          </button>
          <button className={styles.buttonSmall} disabled>
            Evaluate
          </button>
          <button className={styles.buttonSmall} disabled>
            Apply
          </button>
        </div>
      </div>

      {/* Grid of Skeleton Job Cards */}
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={styles.jobCard}
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: '240px',
            }}
          >
            <div className={styles.jobHeader}>
              <div style={{ flexGrow: 1, marginRight: '16px' }}>
                {/* Title skeleton */}
                <div
                  className="skeleton"
                  style={{ width: '70%', height: '20px', marginBottom: '8px' }}
                />
                {/* Company skeleton */}
                <div className="skeleton" style={{ width: '40%', height: '14px' }} />
              </div>
              {/* Badge skeleton */}
              <div
                className="skeleton"
                style={{ width: '60px', height: '24px', borderRadius: '20px' }}
              />
            </div>

            {/* Reasoning skeleton */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexGrow: 1,
                margin: '8px 0',
              }}
            >
              <div className="skeleton" style={{ width: '100%', height: '12px' }} />
              <div className="skeleton" style={{ width: '95%', height: '12px' }} />
              <div className="skeleton" style={{ width: '80%', height: '12px' }} />
            </div>

            {/* Actions skeleton */}
            <div className={styles.actions} style={{ minHeight: '38px', gap: '10px' }}>
              <div className="skeleton" style={{ flex: 1, height: '38px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ flex: 1, height: '38px', borderRadius: '6px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

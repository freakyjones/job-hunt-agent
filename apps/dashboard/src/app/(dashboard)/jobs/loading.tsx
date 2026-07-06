import styles from '@/app/page.module.css';
import loadingStyles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      {/* Tabs and Dev Tools Skeleton Row */}
      <div className={loadingStyles.headerRow}>
        <div className={styles.tabsContainer}>
          <div className={`${styles.tab} ${styles.activeTab}`}>
            📥 Inbox <span className={`${loadingStyles.skeleton} ${loadingStyles.badgeSkeleton}`} />
          </div>
          <div className={styles.tab}>
            🤖 Bot Queue{' '}
            <span className={`${loadingStyles.skeleton} ${loadingStyles.badgeSkeleton}`} />
          </div>
          <div className={styles.tab}>
            🔖 Saved (Manual){' '}
            <span className={`${loadingStyles.skeleton} ${loadingStyles.badgeSkeleton}`} />
          </div>
          <div className={styles.tab}>
            ✅ Applied{' '}
            <span className={`${loadingStyles.skeleton} ${loadingStyles.badgeSkeleton}`} />
          </div>
          <div className={styles.tab}>
            🗑️ Rejected{' '}
            <span className={`${loadingStyles.skeleton} ${loadingStyles.badgeSkeleton}`} />
          </div>
        </div>

        <div className={`${styles.devTools} ${loadingStyles.devToolsDisabled}`}>
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
          <div key={i} className={`${styles.jobCard} ${loadingStyles.cardContent}`}>
            <div className={styles.jobHeader}>
              <div className={loadingStyles.titleArea}>
                {/* Title skeleton */}
                <div className={`${loadingStyles.skeleton} ${loadingStyles.titleSkeleton}`} />
                {/* Company skeleton */}
                <div className={`${loadingStyles.skeleton} ${loadingStyles.companySkeleton}`} />
              </div>
              {/* Badge skeleton */}
              <div className={`${loadingStyles.skeleton} ${loadingStyles.statusBadgeSkeleton}`} />
            </div>

            {/* Reasoning skeleton */}
            <div className={loadingStyles.reasoningArea}>
              <div className={`${loadingStyles.skeleton} ${loadingStyles.reasoningLine1}`} />
              <div className={`${loadingStyles.skeleton} ${loadingStyles.reasoningLine2}`} />
              <div className={`${loadingStyles.skeleton} ${loadingStyles.reasoningLine3}`} />
            </div>

            {/* Actions skeleton */}
            <div className={`${styles.actions} ${loadingStyles.actionsArea}`}>
              <div className={`${loadingStyles.skeleton} ${loadingStyles.actionButtonSkeleton}`} />
              <div className={`${loadingStyles.skeleton} ${loadingStyles.actionButtonSkeleton}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

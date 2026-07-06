import styles from '@/features/resumes/components/ResumesClient.module.css';
import cardStyles from '@/features/resumes/components/PrimaryResumeCard.module.css';
import loadingStyles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div className={`${loadingStyles.skeleton} ${loadingStyles.pageHeaderSkeleton}`} />
      </div>

      <div className={styles.resumesGrid}>
        {/* Primary Resume Skeleton (spans full width) */}
        <div className={`${cardStyles.cardPrimary} ${loadingStyles.primaryCard}`}>
          <div className={`${loadingStyles.skeleton} ${loadingStyles.primaryLabelSkeleton}`} />
          <div className={loadingStyles.primaryHeaderRow}>
            <div className={`${loadingStyles.skeleton} ${loadingStyles.primaryTitleSkeleton}`} />
            <div className={`${loadingStyles.skeleton} ${loadingStyles.primaryDateSkeleton}`} />
          </div>

          {/* Skeleton Resume Document layout */}
          <div className={loadingStyles.documentLayout}>
            <div className={`${loadingStyles.skeleton} ${loadingStyles.docLineFull}`} />
            <div className={`${loadingStyles.skeleton} ${loadingStyles.docLine95}`} />
            <div className={`${loadingStyles.skeleton} ${loadingStyles.docLine90}`} />
            <div className={`${loadingStyles.skeleton} ${loadingStyles.docLineShort}`} />
            <div className={`${loadingStyles.skeleton} ${loadingStyles.docLine85}`} />
            <div className={`${loadingStyles.skeleton} ${loadingStyles.docLine80}`} />
          </div>

          <div className={loadingStyles.actionsGrid}>
            <div className={`${loadingStyles.skeleton} ${loadingStyles.actionBtnSkeleton}`} />
            <div className={`${loadingStyles.skeleton} ${loadingStyles.actionBtnSkeleton}`} />
          </div>
        </div>

        {/* Small Tailored Resumes Skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className={`glass-panel ${loadingStyles.tailoredCard}`}>
            <div className={loadingStyles.tailoredHeader}>
              <div className={`${loadingStyles.skeleton} ${loadingStyles.tailoredTitle}`} />
              <div className={`${loadingStyles.skeleton} ${loadingStyles.tailoredDate}`} />
            </div>
            <div className={`${loadingStyles.skeleton} ${loadingStyles.tailoredCompany}`} />

            <div className={loadingStyles.tailoredLines}>
              <div className={`${loadingStyles.skeleton} ${loadingStyles.tailoredLineFull}`} />
              <div className={`${loadingStyles.skeleton} ${loadingStyles.tailoredLine90}`} />
              <div className={`${loadingStyles.skeleton} ${loadingStyles.tailoredLine95}`} />
            </div>

            <div className={loadingStyles.actionsGrid}>
              <div className={`${loadingStyles.skeleton} ${loadingStyles.actionBtnSkeleton}`} />
              <div className={`${loadingStyles.skeleton} ${loadingStyles.actionBtnSkeleton}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

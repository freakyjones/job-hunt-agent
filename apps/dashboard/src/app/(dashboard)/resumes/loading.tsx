import styles from '@/features/resumes/components/ResumesClient.module.css';
import cardStyles from '@/features/resumes/components/PrimaryResumeCard.module.css';

export default function Loading() {
  return (
    <div className={styles.pageWrapper}>
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
      <div className={styles.pageHeader}>
        <div className="skeleton" style={{ width: '220px', height: '38px', marginBottom: '8px' }} />
      </div>

      <div className={styles.resumesGrid}>
        {/* Primary Resume Skeleton (spans full width) */}
        <div
          className={cardStyles.cardPrimary}
          style={{
            border: '2px dashed var(--border-subtle)',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <div
            className="skeleton"
            style={{ width: '120px', height: '18px', borderRadius: '4px' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px',
            }}
          >
            <div className="skeleton" style={{ width: '200px', height: '24px' }} />
            <div className="skeleton" style={{ width: '80px', height: '14px' }} />
          </div>

          {/* Skeleton Resume Document layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
            <div className="skeleton" style={{ width: '100%', height: '14px' }} />
            <div className="skeleton" style={{ width: '95%', height: '14px' }} />
            <div className="skeleton" style={{ width: '90%', height: '14px' }} />
            <div className="skeleton" style={{ width: '40%', height: '14px', marginTop: '8px' }} />
            <div className="skeleton" style={{ width: '85%', height: '12px' }} />
            <div className="skeleton" style={{ width: '80%', height: '12px' }} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: 'auto',
            }}
          >
            <div className="skeleton" style={{ height: '38px' }} />
            <div className="skeleton" style={{ height: '38px' }} />
          </div>
        </div>

        {/* Small Tailored Resumes Skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-panel"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: '300px',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div className="skeleton" style={{ width: '150px', height: '20px' }} />
              <div className="skeleton" style={{ width: '60px', height: '14px' }} />
            </div>
            <div className="skeleton" style={{ width: '100px', height: '16px' }} />

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '12px 0' }}
            >
              <div className="skeleton" style={{ width: '100%', height: '12px' }} />
              <div className="skeleton" style={{ width: '90%', height: '12px' }} />
              <div className="skeleton" style={{ width: '95%', height: '12px' }} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: 'auto',
              }}
            >
              <div className="skeleton" style={{ height: '38px' }} />
              <div className="skeleton" style={{ height: '38px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client'; // Error components must be Client Components
 
import { useEffect } from 'react';
import styles from './page.module.css';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
 
  return (
    <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--danger)', fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error.message || "Failed to load the dashboard."}</p>
      <button
        className="button button-primary"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}

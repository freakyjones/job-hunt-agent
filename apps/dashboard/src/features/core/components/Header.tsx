'use client';

import { useState } from 'react';
import { Spinner } from './Spinner';
import styles from './Header.module.css';

export function Header() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Dashboard</h1>
      <>
        <button
          className="button button-secondary"
          disabled={isLoggingOut}
          onClick={async () => {
            setIsLoggingOut(true);
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            } catch (e) {
              console.error(e);
              setIsLoggingOut(false);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isLoggingOut && <Spinner width={16} height={16} />}
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </>
    </header>
  );
}

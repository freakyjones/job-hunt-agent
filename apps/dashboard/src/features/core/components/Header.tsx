'use client';
import { useTransition } from 'react';
import { logout } from '@/app/login/actions';
import styles from './Header.module.css';

export function Header() {
  const [, startTransition] = useTransition();

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.actions}>
        <button
          className="button button-secondary"
          onClick={() =>
            startTransition(async () => {
              await logout();
            })
          }
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

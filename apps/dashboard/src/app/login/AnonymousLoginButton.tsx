'use client';

import { useState } from 'react';
import { Spinner } from '@/features/core/components/Spinner';
import pageStyles from '../page.module.css';

export function AnonymousLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`button button-secondary ${pageStyles.heroButton}`}
        disabled={isLoading}
        onClick={async () => {
          setIsLoading(true);
          try {
            await fetch('/api/auth/anonymous', { method: 'POST' });
            window.location.href = '/jobs';
          } catch (e) {
            console.error(e);
            setIsLoading(false);
          }
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {isLoading && <Spinner width={16} height={16} />}
        {isLoading ? 'Setting up sandbox...' : 'Try it out anonymously'}
      </button>
    </>
  );
}

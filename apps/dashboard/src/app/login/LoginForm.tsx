'use client';

import { useActionState } from 'react';
import { login, signup } from './actions';
import styles from './login.module.css';

const initialState = { error: null, success: false };

export function LoginForm() {
  const [loginState, loginAction, isLoginPending] = useActionState(login, initialState);
  const [signupState, signupAction, isSignupPending] = useActionState(signup, initialState);

  const error = loginState?.error || signupState?.error;

  return (
    <form className={styles.form}>
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}
      <div className={styles.inputGroup}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          className={styles.input}
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
        />
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input className={styles.input} id="password" name="password" type="password" required />
      </div>
      <div className={styles.buttonGroup}>
        <button
          type="submit"
          formAction={loginAction}
          className={styles.primaryButton}
          disabled={isLoginPending || isSignupPending}
        >
          {isLoginPending ? 'Logging in...' : 'Log in'}
        </button>
        <button
          type="submit"
          formAction={signupAction}
          className={styles.secondaryButton}
          disabled={isLoginPending || isSignupPending}
        >
          {isSignupPending ? 'Signing up...' : 'Sign up'}
        </button>
      </div>
    </form>
  );
}

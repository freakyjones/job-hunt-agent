'use client'

import { useActionState, useEffect } from 'react'
import { login, signup } from './actions'
import styles from './login.module.css'
import toast from 'react-hot-toast'

const initialState = { error: null, success: false }

export function LoginForm() {
  const [loginState, loginAction, isLoginPending] = useActionState(login, initialState)
  const [signupState, signupAction, isSignupPending] = useActionState(signup, initialState)

  useEffect(() => {
    if (loginState?.error) {
      toast.error(loginState.error, { style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '8px' } })
    }
  }, [loginState])

  useEffect(() => {
    if (signupState?.error) {
      toast.error(signupState.error, { style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', padding: '16px', borderRadius: '8px' } })
    }
  }, [signupState])

  return (
    <form className={styles.form}>
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
        <input
          className={styles.input}
          id="password"
          name="password"
          type="password"
          required
        />
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
  )
}

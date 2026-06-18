import { login, signup } from './actions'
import styles from './login.module.css'

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          Job Hunt Agent
        </h1>
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
              formAction={login}
              className={styles.primaryButton}
            >
              Log in
            </button>
            <button
              formAction={signup}
              className={styles.secondaryButton}
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

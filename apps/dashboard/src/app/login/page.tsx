import styles from './login.module.css'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          Job Hunt Agent
        </h1>
        <LoginForm />
      </div>
    </div>
  )
}

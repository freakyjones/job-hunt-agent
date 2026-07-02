import pageStyles from '../page.module.css';
import { LoginForm } from './LoginForm';
import { Logo } from '@/features/core/components/Logo';
import { AgentVisual } from './AgentVisual';
import { AnonymousLoginButton } from './AnonymousLoginButton';

export default function LoginPage() {
  return (
    <main className={pageStyles.splitLayout}>
      <div className={pageStyles.aurora} />

      <div className={pageStyles.leftPane}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          className="animate-fade-in"
        >
          <Logo size={48} />
          <h1
            className={`${pageStyles.heroTitle} text-ai-gradient`}
            style={{ textAlign: 'left', margin: 0 }}
          >
            Job Hunt Agent
          </h1>
        </div>

        <p
          className={`${pageStyles.heroSubtitle} animate-fade-in`}
          style={{ textAlign: 'left', marginTop: '24px', maxWidth: '440px' }}
        >
          Autonomous intelligence platform for discovering, evaluating, and applying to
          high-performance roles.
        </p>

        <div
          className="animate-fade-in"
          style={{
            width: '100%',
            marginTop: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexGrow: 1,
          }}
        >
          <AgentVisual />
        </div>
      </div>

      <div className={pageStyles.rightPane}>
        <div
          className={`glass-panel ${pageStyles.heroCard}`}
          style={{ padding: '40px', maxWidth: '400px', width: '100%' }}
        >
          <div
            className="animate-fade-in"
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <LoginForm />

            <div
              style={{
                margin: '10px 0',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ margin: '0 10px' }}>OR</span>
              <span style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            <AnonymousLoginButton />
          </div>
        </div>
      </div>
    </main>
  );
}

import pageStyles from '../page.module.css';
import { LoginForm } from './LoginForm';
import { Logo } from '@/features/core/components/Logo';
import { AnonymousLoginButton } from './AnonymousLoginButton';
import { AgentVisualDynamic } from './AgentVisualDynamic';

export default function LoginPage() {
  return (
    <main className={pageStyles.splitLayout}>
      <div className={pageStyles.aurora} />

      <div className={pageStyles.leftPane}>
        <div className={pageStyles.heroLogoContainer}>
          <Logo size={48} />
          <h1 className={`${pageStyles.heroTitle} ${pageStyles.heroTitleLeft} text-ai-gradient`}>
            Job Hunt Agent
          </h1>
        </div>

        <p className={`${pageStyles.heroSubtitle} ${pageStyles.heroSubtitleLeft} animate-fade-in`}>
          Autonomous intelligence platform for discovering, evaluating, and applying to
          high-performance roles.
        </p>

        <div className={`${pageStyles.heroVisualContainer} animate-fade-in`}>
          <AgentVisualDynamic />
        </div>
      </div>

      <div className={pageStyles.rightPane}>
        <div className={`glass-panel ${pageStyles.heroCard} ${pageStyles.loginFormWrapper}`}>
          <div className={`${pageStyles.loginFormInner} animate-fade-in`}>
            <LoginForm />

            <div className={pageStyles.divider}>
              <span className={pageStyles.dividerLine} />
              <span className={pageStyles.dividerText}>OR</span>
              <span className={pageStyles.dividerLine} />
            </div>

            <AnonymousLoginButton />
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { Logo } from './Logo';

export function Sidebar() {
  const pathname = usePathname();
  const isJobs = pathname ? pathname.startsWith('/jobs') : true;
  const isResumes = pathname ? pathname.startsWith('/resumes') : false;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Logo size={24} />
        Agentic Job Hunt
      </div>
      <nav className={styles.nav}>
        <Link href="/jobs" className={`${styles.navLink} ${isJobs ? styles.navLinkActive : ''}`}>
          💼 Jobs
        </Link>
        <Link
          href="/resumes"
          className={`${styles.navLink} ${isResumes ? styles.navLinkActive : ''}`}
        >
          📄 Resumes
        </Link>
      </nav>
    </aside>
  );
}

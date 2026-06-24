'use client';
import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { triggerGitHubAction } from '@/app/actions';
import { logout } from '@/app/login/actions';
import styles from '@/app/page.module.css';

export function Header() {
    const [, startTransition] = useTransition();
    const [isTriggering, setIsTriggering] = useState(false);

    const handleTrigger = async (command: string) => {
        setIsTriggering(true);
        const loadingToast = toast.loading(`Waking up the agent for ${command}...`);
        try {
            const res = await triggerGitHubAction(command);
            if (res.success) {
                toast.success(`Agent ${command} triggered!`, { id: loadingToast });
            } else {
                toast.error(`Failed to trigger: ${res.error}`, { id: loadingToast });
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? `Error: ${e.message}` : "An unexpected error occurred", { id: loadingToast });
        }
        setIsTriggering(false);
    };

    return (
        <header className={styles.header}>
            <h1 className={styles.title}>Dashboard</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button className={`button button-primary ${isTriggering ? 'opacity-50' : ''}`} onClick={() => handleTrigger('scrape')} disabled={isTriggering}>
                    Force Scrape
                </button>
                <button className={`button button-secondary ${isTriggering ? 'opacity-50' : ''}`} onClick={() => handleTrigger('evaluate')} disabled={isTriggering}>
                    Force Evaluate
                </button>
                <button className={`button button-primary ${isTriggering ? 'opacity-50' : ''}`} onClick={() => handleTrigger('apply')} disabled={isTriggering} style={{ background: '#10b981', borderColor: '#10b981' }}>
                    Force Apply
                </button>
                <button className="button" onClick={() => startTransition(async () => { await logout(); })}>
                    Sign Out
                </button>
            </div>
        </header>
    );
}

'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import debounce from 'lodash.debounce';

export function RealtimeJobListener() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const debouncedRefresh = debounce(() => {
            router.refresh();
        }, 2000);

        // 1. Listen for Supabase Realtime changes
        const channel = supabase
            .channel('job-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'jobs' },
                () => {
                    // When the database changes, tell Next.js to re-fetch Server Components safely
                    debouncedRefresh();
                }
            )
            .subscribe();

        // 2. Listen for tab focus (Resilience against dropped connections)
        let lastFocus = 0;
        const handleFocus = () => {
            const now = Date.now();
            if (now - lastFocus > 10000) {
                lastFocus = now;
                router.refresh();
            }
        };
        window.addEventListener('focus', handleFocus);

        // Cleanup on unmount
        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('focus', handleFocus);
            debouncedRefresh.cancel();
        };
    }, [supabase, router]);

    return null; // Invisible component
}

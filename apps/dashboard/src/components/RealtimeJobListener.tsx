'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function RealtimeJobListener() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // 1. Listen for Supabase Realtime changes
        const channel = supabase
            .channel('job-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'jobs' },
                () => {
                    // When the database changes, tell Next.js to re-fetch Server Components
                    router.refresh();
                }
            )
            .subscribe();

        // 2. Listen for tab focus (Resilience against dropped connections)
        const handleFocus = () => {
            router.refresh();
        };
        window.addEventListener('focus', handleFocus);

        // Cleanup on unmount
        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('focus', handleFocus);
        };
    }, [supabase, router]);

    return null; // Invisible component
}

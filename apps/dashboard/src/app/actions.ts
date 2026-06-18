'use server';

import { revalidatePath } from 'next/cache';
import { Job, JobStatusEnum } from '@job-hunt/types';
import { createClient } from '@/utils/supabase/server';

export async function getJobsAction() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('score', { ascending: false, nullsFirst: false });

        if (error) {
            throw new Error(error.message);
        }

        return { success: true, data: data as Job[] };
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error("Failed to get jobs:", e.message);
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Unknown error' };
    }
}

export async function updateJobStatusAction(id: string, newStatusStr: string) {
    try {
        const newStatus = JobStatusEnum.parse(newStatusStr);
        const supabase = await createClient();
        
        const { error } = await supabase
            .from('jobs')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            throw new Error(error.message);
        }

        revalidatePath('/');
        return { success: true };
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(e.message);
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Unknown error' };
    }
}

export async function triggerGitHubAction(command: string = 'all') {
    try {
        const githubToken = process.env.GITHUB_PAT;
        const owner = process.env.GITHUB_OWNER || 'freakyjones';
        const repo = process.env.GITHUB_REPO || 'job-hunt-agent';

        if (!githubToken) {
            return { success: false, error: "Missing GITHUB_PAT env variable" };
        }

        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/job_hunt.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ref: 'main', inputs: { command } }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`GitHub API error: ${res.status} - ${err}`);
        }

        return { success: true };
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error(e.message);
            return { success: false, error: e.message };
        }
        return { success: false, error: 'Unknown error' };
    }
}

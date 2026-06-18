import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Job, JobStatus } from '@job-hunt/types';
import { logger } from '../utils/logger';

/**
 * Manages the connection to Supabase Postgres for tracking job state.
 */
export class DBStateManager {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase credentials in .env");
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async init() {
        // With Supabase, connection is handled transparently.
        // We can just verify the connection by doing a simple select.
        const { error } = await this.supabase.from('jobs').select('id').limit(1);
        if (error) {
            throw new Error("Failed to connect to Supabase: " + error.message);
        }
    }

    private cachedIds: Set<string> | null = null;

    private async loadIdsFromCache() {
        if (!this.cachedIds) {
            const { data, error } = await this.supabase.from('jobs').select('id');
            if (error) throw new Error(error.message);
            this.cachedIds = new Set(data.map(row => row.id));
        }
        return this.cachedIds;
    }

    /**
     * Checks if a job URL has already been processed to ensure idempotency.
     */
    async isJobProcessed(jobUrlHash: string): Promise<boolean> {
        const ids = await this.loadIdsFromCache();
        return ids.has(jobUrlHash);
    }

    /**
     * Adds a newly scraped job to the Database.
     */
    async addPendingJob(job: Job): Promise<void> {
        logger.info(`Added pending job: ${job.company} - ${job.role}`);
        
        const { error } = await this.supabase.from('jobs').insert([{
            id: job.id,
            company: job.company,
            role: job.role,
            url: job.url || '',
            status: job.status
        }]);

        if (error) {
            throw new Error("Failed to insert job: " + error.message);
        }
        
        // Update cache
        if (this.cachedIds) {
            this.cachedIds.add(job.id);
        }
    }

    /**
     * Updates the job score and status.
     */
    async updateJobStatus(jobId: string, status: JobStatus, score?: number, reasoning?: string): Promise<void> {
        const payload: any = { status };
        if (score !== undefined) payload.score = score;
        if (reasoning !== undefined) payload.reasoning = reasoning;

        const { error } = await this.supabase
            .from('jobs')
            .update(payload)
            .eq('id', jobId);

        if (error) {
            console.error(`Failed to update job ${jobId}:`, error.message);
        } else {
            console.log(`Updated job ${jobId} to status ${status}`);
        }
    }

    /**
     * Returns all jobs with a specific status.
     */
    async getJobsByStatus(status: JobStatus): Promise<Job[]> {
        const { data, error } = await this.supabase
            .from('jobs')
            .select('*')
            .eq('status', status);

        if (error) {
            throw new Error("Failed to fetch jobs: " + error.message);
        }

        return data as Job[];
    }
}

import { GoogleSpreadsheet } from 'google-spreadsheet';

export enum JobStatus {
    PENDING = 'PENDING',
    EVALUATED = 'EVALUATED',
    APPLYING = 'APPLYING',
    APPLIED = 'APPLIED',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED'
}

export interface JobRecord {
    id: string;          // MD5 hash of URL
    company: string;
    role: string;
    url: string;
    score?: number;
    matchReason?: string;
    status: JobStatus;
}

/**
 * Manages the connection to Google Sheets for tracking job state.
 */
export class SheetsStateManager {
    private doc: GoogleSpreadsheet;

    constructor(documentId: string) {
        this.doc = new GoogleSpreadsheet(documentId);
    }

    async init(credentials: any) {
        // Authenticate with the Google Sheets API
        await this.doc.useServiceAccountAuth(credentials);
        await this.doc.loadInfo(); 
    }

    /**
     * Checks if a job URL has already been processed to ensure idempotency.
     */
    async isJobProcessed(jobUrlHash: string): Promise<boolean> {
        // TODO: Query the sheets to verify hash
        return false;
    }

    /**
     * Adds a newly scraped job to the Pending tab.
     */
    async addPendingJob(job: JobRecord): Promise<void> {
        console.log(`Added pending job: ${job.company} - ${job.role}`);
        // TODO: Append row to "1. Pending" sheet
    }

    /**
     * Updates the job score and moves it to Evaluated/Applied.
     */
    async updateJobStatus(jobId: string, status: JobStatus, score?: number): Promise<void> {
        console.log(`Updated job ${jobId} to status ${status}`);
        // TODO: Update specific row in Google Sheets
    }
}

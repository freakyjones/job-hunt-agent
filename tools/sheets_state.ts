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
import { JWT } from 'google-auth-library';

export class SheetsStateManager {
    private documentId: string;
    private doc?: GoogleSpreadsheet;

    constructor(documentId: string) {
        this.documentId = documentId;
    }

    async init(credentials: any) {
        // Authenticate with the Google Sheets API using v5 syntax
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.doc = new GoogleSpreadsheet(this.documentId, serviceAccountAuth);
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

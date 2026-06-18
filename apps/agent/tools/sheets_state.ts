import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';

export enum JobStatus {
    PENDING = 'PENDING',
    EVALUATED = 'EVALUATED',
    NOTIFIED = 'NOTIFIED',
    APPLYING = 'APPLYING',
    APPLIED = 'APPLIED',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
    ERROR = 'ERROR'
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
    private documentId: string;
    private doc?: GoogleSpreadsheet;
    private sheet?: GoogleSpreadsheetWorksheet;

    constructor(documentId: string) {
        this.documentId = documentId;
    }

    async init(credentials: any) {
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.doc = new GoogleSpreadsheet(this.documentId, serviceAccountAuth);
        await this.doc.loadInfo(); 
        this.sheet = this.doc.sheetsByIndex[0]; // Assume first tab
        
        // Auto-initialize headers if the sheet is empty
        try {
            await this.sheet.loadHeaderRow();
        } catch (e: any) {
            if (e.message.includes('No values in the header row')) {
                console.log("Empty sheet detected. Initializing header row...");
                await this.sheet.setHeaderRow(['ID', 'Company', 'Role', 'URL', 'Score', 'Reasoning', 'Status']);
            } else {
                throw e;
            }
        }
    }

    private ensureSheet() {
        if (!this.sheet) throw new Error("Google Sheet not initialized. Call init() first.");
        return this.sheet;
    }

    private cachedRows: any[] | null = null;

    private async loadRowsFromCache() {
        if (!this.cachedRows) {
            const sheet = this.ensureSheet();
            this.cachedRows = await sheet.getRows();
        }
        return this.cachedRows;
    }

    /**
     * Checks if a job URL has already been processed to ensure idempotency.
     */
    async isJobProcessed(jobUrlHash: string): Promise<boolean> {
        const rows = await this.loadRowsFromCache();
        return rows.some(row => row.get('ID') === jobUrlHash);
    }

    /**
     * Adds a newly scraped job to the Pending tab.
     */
    async addPendingJob(job: JobRecord): Promise<void> {
        const sheet = this.ensureSheet();
        console.log(`Added pending job: ${job.company} - ${job.role}`);
        const newRow = await sheet.addRow({
            ID: job.id,
            Company: job.company,
            Role: job.role,
            URL: job.url,
            Status: job.status
        });
        
        // Update cache
        if (this.cachedRows) {
            this.cachedRows.push(newRow);
        }
    }

    /**
     * Updates the job score and moves it to Evaluated/Applied.
     */
    async updateJobStatus(jobId: string, status: JobStatus, score?: number, reasoning?: string): Promise<void> {
        const rows = await this.loadRowsFromCache();
        const row = rows.find(r => r.get('ID') === jobId);
        
        if (row) {
            row.set('Status', status);
            if (score !== undefined) row.set('Score', score.toString());
            if (reasoning !== undefined) row.set('Reasoning', reasoning);
            await row.save();
            console.log(`Updated job ${jobId} to status ${status}`);
        } else {
            console.log(`Job ID ${jobId} not found to update.`);
        }
    }

    /**
     * Retrieves all jobs with a specific status.
     */
    async getJobsByStatus(status: JobStatus): Promise<any[]> {
        const rows = await this.loadRowsFromCache();
        return rows.filter(row => row.get('Status') === status);
    }
}

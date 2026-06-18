import * as fs from 'fs';
import * as path from 'path';
import { SheetsStateManager } from './tools/sheets_state';
import { JobStatus } from '@job-hunt/types';

async function reset() {
    const rootCredsPath = path.join(__dirname, '../../google-credentials.json');
    const credsPath = rootCredsPath;
    
    const credentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    const docId = process.env.GOOGLE_SHEETS_DOCUMENT_ID;
    
    const sheets = new SheetsStateManager(docId!);
    await sheets.init(credentials);
    
    const errorJobs = await sheets.getJobsByStatus(JobStatus.ERROR);
    console.log(`Found ${errorJobs.length} errored jobs. Resetting...`);
    
    for (const job of errorJobs) {
        await sheets.updateJobStatus(job.get('ID'), JobStatus.PENDING, 0, '');
    }
    console.log("Done.");
}

reset().catch(console.error);

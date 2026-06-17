import * as fs from 'fs';
import * as crypto from 'crypto';
import { createAgent } from '../agent/index';
import { scrapeNaukri } from '../tools/scrape_naukri';
import { scrapeIndeed } from '../tools/scrape_indeed';
import { SheetsStateManager, JobStatus, JobRecord } from '../tools/sheets_state';
import { sendEmailNotification } from '../tools/email_notify';

/**
 * Main entry point for the Job Hunt Agent GitHub Actions workflows.
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    console.log(`Starting Zero-Cost Job Hunt Agent - Mode: ${command}`);

    // Initialize Sheets State Manager
    const credentials = JSON.parse(fs.readFileSync('./google-credentials.json', 'utf8'));
    const docId = process.env.GOOGLE_SHEETS_DOCUMENT_ID;
    if (!docId) throw new Error("Missing GOOGLE_SHEETS_DOCUMENT_ID");
    
    const sheets = new SheetsStateManager(docId);
    await sheets.init(credentials);

    if (command === 'scrape') {
        console.log('Running Workflow A: Scraper...');
        
        // 1. Fetch live jobs from Naukri & Indeed
        const allJobs: any[] = [];
        const keyword = "React Developer";
        const location = "Remote India";

        console.log("Scraping Naukri...");
        const naukriJobs = await scrapeNaukri(keyword, location);
        allJobs.push(...naukriJobs);

        console.log("Scraping Indeed...");
        const indeedJobs = await scrapeIndeed(keyword, location);
        allJobs.push(...indeedJobs);
        
        console.log(`Found a total of ${allJobs.length} jobs.`);
        
        for (const details of allJobs) {
            const id = crypto.createHash('md5').update(details.url).digest('hex');
            
            if (await sheets.isJobProcessed(id)) {
                console.log(`Skipping already processed: ${details.url}`);
                continue;
            }

            try {
                const job: JobRecord = {
                    id,
                    company: details.company,
                    role: details.title,
                    url: details.url,
                    status: JobStatus.PENDING
                };
                
                // We could do deep scraping here, but snippet is enough for a basic match
                // We'll write the dummy JD for now or use the snippet
                await sheets.addPendingJob(job);
            } catch (e: any) {
                console.error(`Failed to process ${details.url}:`, e.message);
            }
        }

    } else if (command === 'evaluate') {
        console.log('Running Workflow B: Evaluator...');
        
        const pendingJobs = await sheets.getJobsByStatus(JobStatus.PENDING);
        if (pendingJobs.length === 0) {
            console.log("No pending jobs to evaluate.");
            return;
        }

        const agent = createAgent();
        const resumeText = fs.readFileSync('./resume.txt', 'utf8');

        for (const row of pendingJobs) {
            const url = row.get('URL');
            const id = row.get('ID');
            const role = row.get('Role');
            const company = row.get('Company');
            
            console.log(`Evaluating ${company} - ${role}...`);
            try {
                // In a production app, the Scraper would save the full Description to a DB/Sheet.
                // For this demo, we simulate the JD text for WWR jobs if we didn't scrape Lever.
                const dummyJob = `Job at ${company} for ${role}. We need a remote developer with strong frontend skills.`;
                
                const result = await agent.evaluateJob(dummyJob, resumeText);
                console.log(`Score: ${result.score}/100`);
                
                await sheets.updateJobStatus(id, JobStatus.EVALUATED, result.score, result.matchReason);

                // Anti-Rate-Limit Delay for Gemini Free Tier (15 Requests Per Minute max)
                console.log("Waiting 15 seconds to respect Gemini API rate limits...");
                await new Promise(resolve => setTimeout(resolve, 15000));

            } catch (e: any) {
                console.error(`Evaluation failed for ${url}:`, e.message);
                
                // If it failed due to 429 quota, we should back off significantly
                if (e.message.includes('429')) {
                    console.log("Hit rate limit. Waiting 60 seconds before continuing...");
                    await new Promise(resolve => setTimeout(resolve, 60000));
                }
            }
        }
        
    } else if (command === 'apply') {
        console.log('Running Workflow C: Auto-Applier...');
        
        const evalJobs = await sheets.getJobsByStatus(JobStatus.EVALUATED);
        for (const row of evalJobs) {
            const score = parseInt(row.get('Score'), 10);
            
            // Threshold for triggering an application or notification
            if (!isNaN(score) && score >= 80) {
                console.log(`Found high-match job (${score}/100): ${row.get('Company')}`);
                
                await sendEmailNotification({
                    subject: `[Job Hunt Agent] High Match: ${row.get('Company')} (${score}/100)`,
                    body: `<h2>Perfect Job Found!</h2>
                           <p><strong>Company:</strong> ${row.get('Company')}</p>
                           <p><strong>Role:</strong> ${row.get('Role')}</p>
                           <p><strong>Score:</strong> ${score}/100</p>
                           <p><strong>Agent Reasoning:</strong> ${row.get('Reasoning')}</p>
                           <br/>
                           <a href="${row.get('URL')}">Click here to Apply manually</a>`
                });
                
                await sheets.updateJobStatus(row.get('ID'), JobStatus.NOTIFIED);
            }
        }
    } else {
        console.log('Unknown command. Please use scrape, evaluate, or apply.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

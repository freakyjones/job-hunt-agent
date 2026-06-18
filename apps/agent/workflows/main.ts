import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createAgent } from '../agent/index';
import { scrapeNaukri } from '../tools/scrape_naukri';
import { scrapeIndeed } from '../tools/scrape_indeed';
import { DBStateManager } from '../tools/db_state';
import { Job, JobStatus } from '@job-hunt/types';
import { sendEmailNotification } from '../tools/email_notify';
import { logger } from '../utils/logger';

// Load .env for local testing
const envPath = path.join(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Global Crash Handlers
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function logFatalErrorToSupabase(error: Error, type: string) {
    try {
        logger.error(`[${type}] Intercepted fatal crash. Attempting to notify Supabase...`, error.stack);
        
        if (supabaseAdmin) {
            await Promise.race([
                supabaseAdmin.from('jobs').insert({
                    id: crypto.randomBytes(16).toString('hex'),
                    company: 'SYSTEM CRASH',
                    role: type,
                    status: JobStatus.ERROR,
                    reasoning: `Fatal Crash (${type}): ${error.message}\n\nStack: ${error.stack}`
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 5000))
            ]);
            logger.info('Successfully logged fatal error to Supabase.');
        }
    } catch (supabaseErr: any) {
        logger.error('Failed to log fatal error to Supabase (Network down?). Proceeding to crash.', supabaseErr.message);
    } finally {
        process.exit(1);
    }
}

process.on('uncaughtException', (err) => logFatalErrorToSupabase(err, 'UncaughtException'));
process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logFatalErrorToSupabase(err, 'UnhandledRejection');
});
process.on('SIGTERM', () => {
    logFatalErrorToSupabase(new Error('Process received SIGTERM (GitHub Runner Timeout)'), 'SIGTERM');
});

/**
 * Main entry point for the Job Hunt Agent GitHub Actions workflows.
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    logger.info(`Starting Zero-Cost Job Hunt Agent - Mode: ${command}`);

    // Initialize Database State Manager (Supabase)
    const db = new DBStateManager();
    await db.init();

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
            // Use company + title for deduplication instead of URL which often has dynamic tracking params
            const stableString = `${details.company.trim().toLowerCase()}||${details.title.trim().toLowerCase()}`;
            const id = crypto.createHash('md5').update(stableString).digest('hex');
            
            if (await db.isJobProcessed(id)) {
                console.log(`Skipping already processed: ${details.url}`);
                continue;
            }

            try {
                const job: Job = {
                    id,
                    company: details.company,
                    role: details.title,
                    url: details.url,
                    status: JobStatus.PENDING
                };
                
                await db.addPendingJob(job);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    console.error(`Failed to process ${details.url}:`, e.message);
                }
            }
        }

    } else if (command === 'evaluate') {
        console.log('Running Workflow B: Evaluator...');
        
        const pendingJobs = await db.getJobsByStatus(JobStatus.PENDING);
        if (pendingJobs.length === 0) {
            console.log("No pending jobs to evaluate.");
            return;
        }

        const agent = createAgent();
        const rootResumePath = path.join(__dirname, '../../../resume.txt');
        const localResumePath = './resume.txt';
        const resumePath = fs.existsSync(rootResumePath) ? rootResumePath : localResumePath;
        const masterResume = fs.readFileSync(resumePath, 'utf8');

        for (const job of pendingJobs) {
            console.log(`Evaluating ${job.company} - ${job.role}...`);
            let success = false;
            let attempts = 0;
            const maxAttempts = 3;

            while (!success && attempts < maxAttempts) {
                try {
                    attempts++;
                    // In a production app, the Scraper would save the full Description to a DB/Sheet.
                    const dummyJob = `Job at ${job.company} for ${job.role}. We need a remote developer with strong frontend skills.`;
                    
                    const result = await agent.evaluateJob(dummyJob, masterResume);
                    console.log(`Score: ${result.score}/100`);
                    
                    await db.updateJobStatus(job.id, JobStatus.EVALUATED, result.score, result.matchReason);
                    success = true;

                    // Anti-Rate-Limit Delay for Gemini Free Tier (15 Requests Per Minute max)
                    console.log("Waiting 15 seconds to respect Gemini API rate limits...");
                    await new Promise(resolve => setTimeout(resolve, 15000));

                } catch (e: unknown) {
                    if (e instanceof Error) {
                        console.error(`Evaluation failed for ${job.url} (Attempt ${attempts}):`, e.message);
                        
                        if (e.message.includes('429')) {
                            const backoff = 30000 * Math.pow(2, attempts - 1); // 30s, 60s, 120s
                            console.log(`Hit rate limit. Exponential backoff: Waiting ${backoff/1000} seconds...`);
                            await new Promise(resolve => setTimeout(resolve, backoff));
                        } else if (e.message.includes('503')) {
                            console.log(`Service unavailable. Waiting 30 seconds...`);
                            await new Promise(resolve => setTimeout(resolve, 30000));
                        } else {
                            // For parsing errors or fatal errors, don't retry.
                            break; 
                        }
                    }
                }
            }

            if (!success) {
                console.log(`Marking job ${job.id} as ERROR after ${attempts} attempts.`);
                await db.updateJobStatus(job.id, JobStatus.ERROR);
            }
        }
        
    } else if (command === 'apply') {
        console.log('Running Workflow C: Auto-Applier...');
        
        const evalJobs = await db.getJobsByStatus(JobStatus.EVALUATED);
        for (const job of evalJobs) {
            const score = job.score;
            
            // Threshold for triggering an application or notification
            if (score !== undefined && score >= 80) {
                console.log(`Found high-match job (${score}/100): ${job.company}`);
                
                await sendEmailNotification({
                    subject: `[Job Hunt Agent] High Match: ${job.company} (${score}/100)`,
                    body: `<h2>Perfect Job Found!</h2>
                           <p><strong>Company:</strong> ${job.company}</p>
                           <p><strong>Role:</strong> ${job.role}</p>
                           <p><strong>Score:</strong> ${score}/100</p>
                           <p><strong>Agent Reasoning:</strong> ${job.reasoning}</p>
                           <br/>
                           <a href="${job.url}">Click here to Apply manually</a>`
                });
                
                await db.updateJobStatus(job.id, JobStatus.NOTIFIED);
            }
        }
    } else {
        console.log('Unknown command. Please use scrape, evaluate, or apply.');
    }
}

if (require.main === module) {
    main().catch(async (e) => {
        console.error("Fatal workflow error:", e);
        try {
            await sendEmailNotification({
                subject: `[Job Hunt Agent] Fatal Crash`,
                body: `<p>The GitHub Action workflow crashed!</p><pre>${e instanceof Error ? e.stack : e}</pre>`
            });
        } catch (emailErr) {
            console.error("Failed to send crash email:", emailErr);
        }
        process.exit(1);
    });
}

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createAgent } from '../agent/index';
import { scrapeNaukri } from '../tools/scrape_naukri';
import { scrapeIndeed } from '../tools/scrape_indeed';
import { scrapeRssFeed } from '../tools/scrape_rss';
import { pollATS } from '../tools/poll_ats';
import { TARGET_COMPANIES } from '../tools/companies';
import { DBStateManager } from '../tools/db_state';
import { Job, JobStatus } from '@job-hunt/types';
import { sendEmailNotification } from '../tools/email_notify';
import { logger } from '../utils/logger';
import { AutoApplier } from '../tools/auto_apply';
import { TailoringAgent } from '../agent/tailor';

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

async function runScrape(db: DBStateManager) {
    console.log('Running Workflow A: Scraper...');
    
    // 1. Fetch live jobs
    const allJobs: any[] = [];
    const boardJobs: any[] = [];
    const atsJobs: any[] = [];
    const keyword = "React Developer";
    const location = "Remote India";

    console.log("Scraping Naukri...");
    try {
        const naukriJobs = await scrapeNaukri(keyword, location);
        boardJobs.push(...naukriJobs);
    } catch (e: any) {
        console.error("Naukri scrape failed:", e.message);
    }

    console.log("Scraping Indeed...");
    try {
        const indeedJobs = await scrapeIndeed(keyword, location);
        boardJobs.push(...indeedJobs);
    } catch (e: any) {
        console.error("Indeed scrape failed:", e.message);
    }
    
    console.log("Polling Top 50 ATS Target Companies...");
    try {
        const chunks = [];
        for (let i = 0; i < TARGET_COMPANIES.length; i += 10) chunks.push(TARGET_COMPANIES.slice(i, i + 10));
        for (const chunk of chunks) {
            const results = await Promise.all(chunk.map(c => pollATS(c, "React").catch(e => {
                console.error(`Failed ATS poll for ${c.name}:`, e.message);
                return [];
            })));
            atsJobs.push(...results.flat());
        }
    } catch (e: any) {
        console.error("ATS Polling failed:", e.message);
    }

    console.log("Scraping WeWorkRemotely RSS...");
    try {
        const urls = await scrapeRssFeed('https://weworkremotely.com/categories/remote-programming-jobs.rss');
        const atsUrls = urls.filter(u => u.includes('lever.co') || u.includes('greenhouse.io'));
        atsUrls.forEach(url => atsJobs.push({ 
            title: "Remote Developer (WWR)", 
            company: "WWR Startup", 
            description: "", 
            url, 
            atsType: url.includes('lever') ? 'lever' : 'greenhouse' 
        }));
    } catch (e: any) {
        console.error("RSS scrape failed:", e.message);
    }

    // The 50/50 Split Logic (Shuffle to ensure diversity)
    const shuffledBoards = boardJobs.sort(() => 0.5 - Math.random()).slice(0, 15);
    const shuffledAts = atsJobs.sort(() => 0.5 - Math.random()).slice(0, 15);
    allJobs.push(...shuffledBoards, ...shuffledAts);
    
    console.log(`Found ${boardJobs.length} board jobs, ${atsJobs.length} ATS jobs. Selected 50/50 mix (${shuffledBoards.length} + ${shuffledAts.length}).`);
    
    let addedCount = 0;
    for (const details of allJobs) {
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
            addedCount++;
        } catch (e: unknown) {
            if (e instanceof Error) {
                console.error(`Failed to process ${details.url}:`, e.message);
            }
        }
    }

    await sendEmailNotification({
        subject: `[Job Hunt Agent] Scraper Summary`,
        body: `<h2>Scraping Complete</h2>
               <p><strong>Total Jobs Found:</strong> ${allJobs.length}</p>
               <p><strong>New Jobs Added:</strong> ${addedCount}</p>`
    });
}

async function runEvaluate(db: DBStateManager) {
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

    let evaluatedCount = 0;
    let errorCount = 0;

    for (const job of pendingJobs) {
        console.log(`Evaluating ${job.company} - ${job.role}...`);
        let success = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!success && attempts < maxAttempts) {
            try {
                attempts++;
                
                const jobDescription = job.description || `Job at ${job.company} for ${job.role}.`;
                
                const result = await agent.evaluateJob(jobDescription, masterResume);
                console.log(`Score: ${result.score}/100`);
                
                await db.updateJobStatus(job.id, JobStatus.EVALUATED, result.score, result.matchReason);
                success = true;
                evaluatedCount++;

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
                        break; 
                    }
                }
            }
        }

        if (!success) {
            console.log(`Marking job ${job.id} as ERROR after ${attempts} attempts.`);
            await db.updateJobStatus(job.id, JobStatus.ERROR);
            errorCount++;
        }
    }
    
    await sendEmailNotification({
        subject: `[Job Hunt Agent] Evaluator Summary`,
        body: `<h2>Evaluation Complete</h2>
               <p><strong>Total Jobs Evaluated:</strong> ${evaluatedCount}</p>
               <p><strong>Evaluation Errors:</strong> ${errorCount}</p>`
    });
}

async function runApply(db: DBStateManager) {
    console.log('Running Workflow C: Auto-Applier...');
    
    let acceptedJobs = await db.getJobsByStatus(JobStatus.ACCEPTED);
    
    // Safety Filter: Ensure AutoApplier ONLY attempts Lever or Greenhouse URLs
    acceptedJobs = acceptedJobs.filter(j => j.url?.includes('lever.co') || j.url?.includes('greenhouse.io'));
    
    if (acceptedJobs.length === 0) {
        console.log("No jobs in the queue to auto-apply.");
        return;
    }

    const autoApplier = new AutoApplier();
    const tailor = new TailoringAgent();
    
    console.log(`Found ${acceptedJobs.length} jobs in the ACCEPTED queue.`);
    
    const rootResumePath = path.join(__dirname, '../../../resume.txt');
    const localResumePath = './resume.txt';
    const masterResumePath = fs.existsSync(rootResumePath) ? rootResumePath : localResumePath;
    const masterResume = fs.existsSync(masterResumePath) ? fs.readFileSync(masterResumePath, 'utf8') : '';

    for (const job of acceptedJobs) {
        console.log(`Auto-Applying to accepted job: ${job.company}`);
        await db.updateJobStatus(job.id, JobStatus.APPLYING);
        try {
            let customResumePath = undefined;
            if (masterResume && job.description) {
                try {
                    customResumePath = await tailor.tailorResume(masterResume, job.description, job.company);
                } catch (e: any) {
                    console.error(`Tailoring failed for ${job.company}, falling back to master resume:`, e.message);
                }
            }

            const success = await autoApplier.execute(job.url || '', job.company, customResumePath);
            if (success) {
                await db.updateJobStatus(job.id, JobStatus.APPLIED);
                await sendEmailNotification({
                    subject: `[Job Hunt Agent] Auto-Applied to ${job.company}`,
                    body: `<p>Successfully applied to ${job.company} for the ${job.role} position.</p>`
                });
            } else {
                console.error(`Could not auto-apply to ${job.company}. Ensure ATS is supported and job is open.`);
                await db.updateJobStatus(job.id, JobStatus.ERROR);
            }
        } catch (err) {
            console.error(`Failed to auto-apply to ${job.company}`, err);
            await db.updateJobStatus(job.id, JobStatus.ERROR);
        }
    }
}

/**
 * Main entry point for the Job Hunt Agent GitHub Actions workflows.
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'all'; // Default to 'all' for cron triggers

    logger.info(`Starting Zero-Cost Job Hunt Agent - Mode: ${command}`);

    // Initialize Database State Manager (Supabase)
    const db = new DBStateManager();
    await db.init();

    if (command === 'scrape') {
        await runScrape(db);
        await runEvaluate(db);
    } else if (command === 'evaluate') {
        await runEvaluate(db);
    } else if (command === 'apply') {
        await runApply(db);
    } else if (command === 'all') {
        await runScrape(db);
        await runEvaluate(db);
        await runApply(db);
    } else {
        console.log('Unknown command. Please use scrape, evaluate, apply, or all.');
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

import { SYSTEM_PROMPT } from '../agent/system_prompt';
import { createAgent } from '../agent/index';

/**
 * Main entry point for the Job Hunt Agent GitHub Actions workflows.
 * 
 * Run with an argument to specify the workflow:
 * npm run start -- scrape
 * npm run start -- evaluate
 * npm run start -- apply
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    console.log(`Starting Zero-Cost Job Hunt Agent - Mode: ${command}`);

    if (command === 'scrape') {
        console.log('Running Workflow A: Scraper...');
        // TODO: Call RSS scraper and Playwright scrapers
        // TODO: Save to Google Sheets Pending Tab
    } else if (command === 'evaluate') {
        console.log('Running Workflow B: Evaluator...');
        
        const agent = createAgent();
        
        // Dummy values for testing the structure
        const dummyJob = "We are looking for a Senior React Engineer with 5 years of experience in AWS.";
        const dummyResume = "Junior Developer. 1 year of experience with React. No AWS experience.";
        
        console.log("Starting 1:1 Evaluation with Gemini 1.5...");
        try {
            const result = await agent.evaluateJob(dummyJob, dummyResume);
            console.log("\n--- Evaluation Result ---");
            console.log(`Score: ${result.score}/100`);
            console.log(`Reasoning: ${result.matchReason}`);
            console.log(`Missing Skills: ${result.missingSkills.join(', ')}`);
        } catch (error) {
            console.error("Evaluation Failed:", error);
        }
        
    } else if (command === 'apply') {
        console.log('Running Workflow C: Auto-Applier...');
        // TODO: Trigger Playwright automation for high-scoring jobs
    } else {
        console.log('Unknown command. Please use scrape, evaluate, or apply.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

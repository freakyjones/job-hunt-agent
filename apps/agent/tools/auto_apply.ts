import { getBrowser } from './playwright_core';
import { applyToGreenhouse } from './apply_greenhouse';
import { applyToLever } from './apply_lever';

export class AutoApplier {
    async execute(jobUrl: string, company: string): Promise<boolean> {
        console.log(`Starting Auto-Applier for ${company} at ${jobUrl}`);

        let atsType = 'unknown';
        if (jobUrl.includes('greenhouse.io')) atsType = 'greenhouse';
        else if (jobUrl.includes('lever.co')) atsType = 'lever';

        if (atsType === 'unknown') {
            console.log(`Skipping auto-apply for ${company}. Only Lever and Greenhouse are supported.`);
            return false;
        }

        const browser = await getBrowser(true); // Headless mode
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            let success = false;
            if (atsType === 'greenhouse') {
                success = await applyToGreenhouse(page, jobUrl);
            } else if (atsType === 'lever') {
                success = await applyToLever(page, jobUrl);
            }

            if (success) {
                console.log(`Successfully applied to ${company}`);
            } else {
                console.log(`Failed to verify successful application for ${company}`);
            }
            return success;
        } catch (error: any) {
            console.error(`Error during auto-application for ${company}:`, error.message);
            return false;
        } finally {
            await browser.close();
        }
    }
}

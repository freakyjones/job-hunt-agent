import { getBrowser } from './playwright_core';
import { applyToGreenhouse } from './apply_greenhouse';
import { applyToLever } from './apply_lever';
import type { Browser } from 'playwright';

export class AutoApplier {
  private browser: Browser | null = null;

  async init() {
    if (!this.browser) {
      this.browser = await getBrowser(true); // Headless mode
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async execute(jobUrl: string, company: string, customResumePath?: string): Promise<boolean> {
    console.log(`Starting Auto-Applier for ${company} at ${jobUrl}`);

    let atsType = 'unknown';
    if (jobUrl.includes('greenhouse.io')) atsType = 'greenhouse';
    else if (jobUrl.includes('lever.co')) atsType = 'lever';

    if (atsType === 'unknown') {
      console.log(`Skipping auto-apply for ${company}. Only Lever and Greenhouse are supported.`);
      return false;
    }

    if (!this.browser) {
      await this.init();
    }

    const context = await this.browser!.newContext();
    try {
      const page = await context.newPage();
      let success = false;
      if (atsType === 'greenhouse') {
        success = await applyToGreenhouse(page, jobUrl, customResumePath);
      } else if (atsType === 'lever') {
        success = await applyToLever(page, jobUrl, customResumePath);
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
      await context.close();
    }
  }
}

import { getBrowser } from './playwright_core';

export interface JobDetails {
  title: string;
  company: string;
  description: string;
  url: string;
  atsType: 'lever' | 'greenhouse' | 'unknown';
}

/**
 * Scrapes a Lever job posting page.
 * Lever job postings generally have a very consistent DOM structure.
 */
export async function scrapeLever(url: string): Promise<JobDetails> {
  console.log(`Scraping Lever job posting: ${url}`);

  const browser = await getBrowser(true);
  try {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Human-like random delay
      await page.waitForTimeout(1000 + Math.random() * 2000);

      // Extract title and description
      const title = await page
        .locator('.posting-headline h2')
        .innerText()
        .catch(() => 'Unknown Title');
      const company = await page
        .locator('.posting-headline .sort-by-time')
        .first()
        .innerText()
        .catch(() => 'Unknown Company'); // Rough heuristic for lever

      // Lever usually stores the core JD in multiple section-wrapper div's
      const descriptionLocators = await page
        .locator('.section-wrapper .posting-requirements')
        .all();
      let description = '';
      for (const loc of descriptionLocators) {
        description += (await loc.innerText()) + '\n\n';
      }

      // Fallback if the specific structure isn't found
      if (!description.trim()) {
        description = await page
          .locator('.section-wrapper')
          .innerText()
          .catch(() => '');
      }

      return {
        title: title.trim(),
        company: company.trim(),
        description: description.trim(),
        url,
        atsType: 'lever',
      };
    } finally {
      await context.close();
    }
  } catch (error) {
    console.error(
      `Failed to scrape Lever URL: ${url}`,
      error instanceof Error ? error.message : error
    );
    throw new Error(`Scrape Failed: ${error}`);
  } finally {
    await browser.close();
  }
}

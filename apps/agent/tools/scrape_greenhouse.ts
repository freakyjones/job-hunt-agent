import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { JobDetails } from './scrape_lever';

chromium.use(stealth());

/**
 * Scrapes a Greenhouse job posting page.
 * Greenhouse uses #content and #header for job details.
 */
export async function scrapeGreenhouse(url: string): Promise<JobDetails> {
  console.log(`Scraping Greenhouse job posting: ${url}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForTimeout(1000 + Math.random() * 2000);

    const title = await page
      .locator('#header h1')
      .innerText()
      .catch(() => 'Unknown Title');
    const company = await page
      .locator('#header .company-name')
      .innerText()
      .catch(() => 'Unknown Company');

    // The main JD usually lives in #content
    const description = await page
      .locator('#content')
      .innerText()
      .catch(() => '');

    return {
      title: title.trim(),
      company: company.replace('at', '').trim(),
      description: description.trim(),
      url,
      atsType: 'greenhouse',
    };
  } catch (error) {
    console.error(
      `Failed to scrape Greenhouse URL: ${url}`,
      error instanceof Error ? error.message : error
    );
    throw new Error(`Scrape Failed: ${error}`);
  } finally {
    await browser.close();
  }
}

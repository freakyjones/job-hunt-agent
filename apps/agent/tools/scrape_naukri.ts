import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { JobDetails } from './scrape_lever'; // Reusing interface

chromium.use(stealth());

/**
 * Scrapes Naukri for the specified search query.
 */
export async function scrapeNaukri(
  keyword: string = 'react developer',
  location: string = ''
): Promise<JobDetails[]> {
  console.log(`Scraping Naukri for: ${keyword} in ${location || 'Anywhere'}`);

  const jobs: JobDetails[] = [];
  const browser = await chromium.launch({ headless: true });

  // Create context with standard user agent to avoid basic blocks
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    const query = encodeURIComponent(keyword);
    const locQuery = location ? encodeURIComponent(location) : '';
    const url = `https://www.naukri.com/${query.replace(/%20/g, '-')}-jobs${locQuery ? '-in-' + locQuery : ''}`;

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait for job list to load (Naukri uses class 'srp-jobtuple-wrapper' or 'jobTuple')
    await page.waitForTimeout(3000 + Math.random() * 2000);

    // Grab the job cards
    const jobCards = await page.locator('.srp-jobtuple-wrapper, .jobTuple').all();
    console.log(`Found ${jobCards.length} job cards on Naukri.`);

    const maxCards = Math.min(jobCards.length, 10);
    for (let i = 0; i < maxCards; i++) {
      const card = jobCards[i];

      try {
        const titleLoc = card.locator('.title');
        const title = await titleLoc.innerText();
        const url = (await titleLoc.getAttribute('href')) || '';

        const company = await card
          .locator('.comp-name')
          .innerText()
          .catch(() => 'Unknown Company');
        const jobUrl = url.startsWith('http') ? url : `https://www.naukri.com${url}`;

        // Open job URL in new page to get full description
        let fullDescription = '';
        if (jobUrl) {
          const jobPage = await context.newPage();
          try {
            await jobPage.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
            fullDescription = await jobPage
              .locator('.job-desc, .dang-inner-html')
              .innerText()
              .catch(() => '');
          } catch (e) {
            console.error('Failed to load full JD for ' + jobUrl);
          } finally {
            await jobPage.close();
          }
        }

        if (title && jobUrl) {
          jobs.push({
            title: title.trim(),
            company: company.trim(),
            description: fullDescription.trim(),
            url: jobUrl,
            atsType: 'unknown',
          });
        }
      } catch (cardError) {
        console.error(
          'Error parsing a Naukri job card:',
          cardError instanceof Error ? cardError.message : cardError
        );
      }
    }
  } catch (error) {
    console.error('Failed to scrape Naukri:', error instanceof Error ? error.message : error);
    try {
      await page.screenshot({
        path: `playwright-screenshots/naukri_error_${Date.now()}.png`,
        fullPage: true,
      });
    } catch (e) {
      console.error('Failed to take screenshot:', e instanceof Error ? e.message : e);
    }
    throw error; // Rethrow to let the main workflow know it failed
  } finally {
    await browser.close();
  }

  return jobs;
}

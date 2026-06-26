import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { JobDetails } from './scrape_lever';

chromium.use(stealth());

/**
 * Scrapes Indeed India for the specified search query.
 */
export async function scrapeIndeed(
  keyword: string = 'react developer',
  location: string = ''
): Promise<JobDetails[]> {
  console.log(`Scraping Indeed for: ${keyword} in ${location || 'Anywhere'}`);

  const jobs: JobDetails[] = [];
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
  });

  const page = await context.newPage();
  const interceptedJobs: Map<string, JobDetails> = new Map();

  // API Interception
  page.on('response', async (response) => {
    const resUrl = response.url();
    if (
      resUrl.includes('/graphql') ||
      resUrl.includes('/api/') ||
      resUrl.includes('mobiledatasvc')
    ) {
      try {
        const contentType = response.headers()['content-type'];
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();

          // Recursive function to find job keys
          const extractJobs = (obj: any) => {
            if (!obj) return;
            if (typeof obj === 'object') {
              // Indeed typically uses jobkey, title, and company in JSON payloads
              if (obj.jobkey && obj.title && obj.company) {
                interceptedJobs.set(obj.jobkey, {
                  title: obj.title,
                  company: obj.company,
                  description: obj.snippet || obj.description || '',
                  url: `https://in.indeed.com/viewjob?jk=${obj.jobkey}`,
                  atsType: 'unknown',
                });
              }
              Object.values(obj).forEach(extractJobs);
            }
          };
          extractJobs(json);
        }
      } catch (e) {
        // Ignore parsing errors for non-JSON or aborted responses
      }
    }
  });

  try {
    const query = encodeURIComponent(keyword);
    const locQuery = location ? encodeURIComponent(location) : '';
    const url = `https://in.indeed.com/jobs?q=${query}&l=${locQuery}`;

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait for the job cards to appear, passing potential Cloudflare challenge
    await page.waitForSelector('.job_seen_beacon', { timeout: 45000 });

    // Give network requests a moment to finish and be processed
    await page.waitForTimeout(3000);

    if (interceptedJobs.size > 0) {
      console.log(
        `Successfully intercepted ${interceptedJobs.size} jobs via background APIs! Skipping DOM parsing.`
      );
      jobs.push(...Array.from(interceptedJobs.values()));
      return jobs;
    }

    console.log(`API Interception yielded 0 results. Falling back to DOM parsing.`);

    // Grab the job cards
    const jobCards = await page.locator('.job_seen_beacon').all();
    console.log(`Found ${jobCards.length} job cards on Indeed via DOM.`);

    for (let i = 0; i < jobCards.length; i++) {
      const card = jobCards[i];

      try {
        const titleLoc = card.locator('h2.jobTitle a, a.jcs-JobTitle').first();
        const title = await titleLoc.innerText();
        const urlPath = (await titleLoc.getAttribute('href')) || '';
        const jobUrl = urlPath.startsWith('http') ? urlPath : `https://in.indeed.com${urlPath}`;

        const company = await card
          .locator('.companyName, [data-testid="company-name"]')
          .innerText()
          .catch(() => 'Unknown Company');

        // Click the card to open the side panel
        await card.click();
        await page.waitForSelector('#jobDescriptionText', { timeout: 5000 }).catch(() => {});

        // Extract full description from the side panel
        const fullDescription = await page
          .locator('#jobDescriptionText')
          .innerText()
          .catch(() => '');

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
          'Error parsing an Indeed job card:',
          cardError instanceof Error ? cardError.message : cardError
        );
      }
    }
  } catch (error) {
    console.error(
      'Failed to scrape Indeed (Cloudflare block likely):',
      error instanceof Error ? error.message : error
    );
    try {
      await page.screenshot({
        path: `playwright-screenshots/indeed_error_${Date.now()}.png`,
        fullPage: true,
      });
    } catch (e) {
      console.error('Failed to take screenshot:', e instanceof Error ? e.message : e);
    }
    throw error;
  } finally {
    await browser.close();
  }

  return jobs;
}

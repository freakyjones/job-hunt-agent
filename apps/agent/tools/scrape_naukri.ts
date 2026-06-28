import { getBrowser } from './playwright_core';
import { JobDetails } from './scrape_lever'; // Reusing interface

/**
 * Scrapes Naukri for the specified search query.
 */
export async function scrapeNaukri(
  keyword: string = 'react developer',
  location: string = ''
): Promise<JobDetails[]> {
  console.log(`Scraping Naukri for: ${keyword} in ${location || 'Anywhere'}`);

  const jobs: JobDetails[] = [];
  const browser = await getBrowser(true);

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    try {
      const page = await context.newPage();
      const interceptedJobs: Map<string, JobDetails> = new Map();

      // API Interception
      page.on('response', async (response) => {
        const resUrl = response.url();
        if (resUrl.includes('/jobapi/') || resUrl.includes('/api/')) {
          try {
            const contentType = response.headers()['content-type'];
            if (contentType && contentType.includes('application/json')) {
              const json = await response.json();

              const extractJobs = (obj: any) => {
                if (!obj) return;
                if (typeof obj === 'object') {
                  if (obj.jobId && obj.title && obj.companyName) {
                    const relativeUrl = obj.jdURL || `/job-listings-${obj.jobId}`;
                    const absoluteUrl = relativeUrl.startsWith('http')
                      ? relativeUrl
                      : `https://www.naukri.com${relativeUrl}`;
                    interceptedJobs.set(obj.jobId, {
                      title: obj.title,
                      company: obj.companyName,
                      description: obj.jobDescription || '',
                      url: absoluteUrl,
                      atsType: 'unknown',
                    });
                  }
                  Object.values(obj).forEach(extractJobs);
                }
              };
              extractJobs(json);
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
      });

      try {
        const query = encodeURIComponent(keyword);
        const locQuery = location ? encodeURIComponent(location) : '';
        const url = `https://www.naukri.com/${query.replace(/%20/g, '-')}-jobs-in-${locQuery.replace(/%20/g, '-')}`;

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for job cards to render
        await page.waitForSelector('.srp-jobtuple, article.jobTuple', { timeout: 30000 });

        // Wait a bit for requests to settle
        await page.waitForTimeout(3000);

        if (interceptedJobs.size > 0) {
          console.log(`Successfully intercepted ${interceptedJobs.size} Naukri jobs via API!`);
          jobs.push(...Array.from(interceptedJobs.values()).slice(0, 10));
          return jobs;
        }

        console.log('No API jobs intercepted. Falling back to DOM parsing...');
        const cards = await page.locator('.srp-jobtuple, article.jobTuple').all();
        console.log(`Found ${cards.length} Naukri job cards.`);

        const maxCards = Math.min(cards.length, 10);
        for (let i = 0; i < maxCards; i++) {
          const card = cards[i];
          try {
            const titleLoc = card.locator('a.title').first();
            const title = await titleLoc.innerText();
            const url = (await titleLoc.getAttribute('href')) || '';

            const company = await card
              .locator('.comp-name, .companyName')
              .first()
              .innerText()
              .catch(() => 'Unknown Company');
            const jobUrl = url.startsWith('http') ? url : `https://www.naukri.com${url}`;

            // Open job URL in new page to get full description
            let fullDescription = '';
            if (jobUrl) {
              const jobPage = await context.newPage();
              try {
                await jobPage.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
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
        throw error;
      }
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }

  return jobs;
}

import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { JobDetails } from './scrape_lever';

chromium.use(stealth());

/**
 * Scrapes Indeed India for the specified search query.
 */
export async function scrapeIndeed(keyword: string = "react developer", location: string = ""): Promise<JobDetails[]> {
    console.log(`Scraping Indeed for: ${keyword} in ${location || 'Anywhere'}`);
    
    const jobs: JobDetails[] = [];
    const browser = await chromium.launch({ headless: true });
    
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1440, height: 900 },
        locale: 'en-IN',
        timezoneId: 'Asia/Kolkata',
    });
    
    const page = await context.newPage();

    try {
        const query = encodeURIComponent(keyword);
        const locQuery = location ? encodeURIComponent(location) : '';
        const url = `https://in.indeed.com/jobs?q=${query}&l=${locQuery}`;
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        
        // Wait to pass potential Cloudflare challenge
        await page.waitForTimeout(5000 + Math.random() * 3000);
        
        // Grab the job cards
        const jobCards = await page.locator('.job_seen_beacon').all();
        console.log(`Found ${jobCards.length} job cards on Indeed.`);
        
        for (let i = 0; i < Math.min(jobCards.length, 5); i++) {
            const card = jobCards[i];
            
            try {
                const titleLoc = card.locator('.jobTitle a');
                const title = await titleLoc.innerText();
                const urlPath = await titleLoc.getAttribute('href') || '';
                const jobUrl = urlPath.startsWith('http') ? urlPath : `https://in.indeed.com${urlPath}`;
                
                const company = await card.locator('.companyName, [data-testid="company-name"]').innerText().catch(() => 'Unknown Company');
                const snippet = await card.locator('.job-snippet').innerText().catch(() => '');
                
                if (title && jobUrl) {
                    jobs.push({
                        title: title.trim(),
                        company: company.trim(),
                        description: snippet.trim(),
                        url: jobUrl,
                        atsType: 'unknown'
                    });
                }
            } catch (cardError) {
                console.error("Error parsing an Indeed job card:", cardError);
            }
        }
        
    } catch (error) {
        console.error("Failed to scrape Indeed (Cloudflare block likely):", error);
    } finally {
        await browser.close();
    }
    
    return jobs;
}

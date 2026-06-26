/**
 * Simple RSS scraper for job boards (e.g., WeWorkRemotely, HackerNews).
 * Extracts job URLs to feed into the Playwright scrapers.
 */
export interface RssJobDetails {
  title: string;
  company: string;
  url: string;
}

export async function scrapeRssFeed(feedUrl: string): Promise<RssJobDetails[]> {
  console.log(`Fetching RSS feed: ${feedUrl}`);

  try {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`);
    }

    const xmlData = await response.text();

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    const jobs: RssJobDetails[] = [];
    const seenUrls = new Set<string>();

    while ((match = itemRegex.exec(xmlData)) !== null) {
      const itemXml = match[1];

      const titleMatch = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/.exec(itemXml);
      const linkMatch = /<link>(.*?)<\/link>/.exec(itemXml);

      let rawTitle = (titleMatch?.[1] || '').trim();
      const url = (linkMatch?.[1] || '').trim();

      if (url && url !== feedUrl && url.startsWith('http') && !seenUrls.has(url)) {
        seenUrls.add(url);

        let company = 'Unknown Company';
        let title = rawTitle;

        if (rawTitle.includes(':')) {
          const parts = rawTitle.split(':');
          company = parts[0].trim();
          title = parts.slice(1).join(':').trim();
        }

        jobs.push({ title, company, url });
      }
    }

    return jobs;
  } catch (error) {
    console.error(
      `Error scraping RSS feed ${feedUrl}:`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

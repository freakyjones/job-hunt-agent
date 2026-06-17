/**
 * Simple RSS scraper for job boards (e.g., WeWorkRemotely, HackerNews).
 * Extracts job URLs to feed into the Playwright scrapers.
 */
export async function scrapeRssFeed(feedUrl: string): Promise<string[]> {
    console.log(`Fetching RSS feed: ${feedUrl}`);
    
    try {
        const response = await fetch(feedUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch RSS: ${response.statusText}`);
        }
        
        const xmlData = await response.text();
        
        // Simple regex to extract URLs from <link> tags
        // In a production app, use an XML parser library like fast-xml-parser
        const linkRegex = /<link>(.*?)<\/link>/g;
        let match;
        const urls: string[] = [];
        
        while ((match = linkRegex.exec(xmlData)) !== null) {
            const url = match[1].trim();
            // Filter out the main site link, keeping only job posting links
            if (url && url !== feedUrl && url.startsWith('http')) {
                urls.push(url);
            }
        }
        
        return [...new Set(urls)]; // Return unique URLs
    } catch (error) {
        console.error(`Error scraping RSS feed ${feedUrl}:`, error);
        return [];
    }
}

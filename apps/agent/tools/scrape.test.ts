import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeNaukri } from './scrape_naukri';
import { chromium } from 'playwright-extra';

vi.mock('playwright-extra', () => ({
  chromium: {
    use: vi.fn(),
    launch: vi.fn(),
  },
}));

vi.mock('puppeteer-extra-plugin-stealth', () => ({
  default: vi.fn(),
}));

describe('Scraping Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scrapeNaukri (API Interception)', () => {
    it('should extract jobs from intercepted API responses and skip DOM parsing', async () => {
      let responseHandler: any = null;

      const mockPage = {
        on: vi.fn().mockImplementation((event, handler) => {
          if (event === 'response') {
            responseHandler = handler;
          }
        }),
        goto: vi.fn().mockImplementation(async () => {
          // Simulate the network response arriving during goto
          if (responseHandler) {
            await responseHandler({
              url: () => 'https://www.naukri.com/jobapi/v3/search',
              headers: () => ({ 'content-type': 'application/json' }),
              json: async () => ({
                jobDetails: {
                  jobId: '12345',
                  title: 'React Developer',
                  companyName: 'Tech Corp',
                  jdURL: '/job-listings-12345',
                  jobDescription: 'Great job!',
                },
              }),
            });
          }
        }),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        locator: vi.fn(), // Should not be called because we intercept!
        close: vi.fn(),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
      };

      const mockBrowser = {
        newContext: vi.fn().mockResolvedValue(mockContext),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

      // Suppress console.log
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await scrapeNaukri('react', 'remote');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        title: 'React Developer',
        company: 'Tech Corp',
        description: 'Great job!',
        url: 'https://www.naukri.com/job-listings-12345',
        atsType: 'unknown',
      });

      // Assert DOM parsing was skipped
      expect(mockPage.locator).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });
  });
});

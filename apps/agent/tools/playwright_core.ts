import { chromium } from 'playwright-extra';
// @ts-ignore - plugin stealth doesn't have perfect types for playwright-extra
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

export async function getBrowser(headless: boolean = false) {
    return await chromium.launch({
        headless,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars'
        ]
    });
}

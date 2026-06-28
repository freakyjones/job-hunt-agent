import { Page } from 'playwright';
import * as path from 'path';
import profile from '../profile.json';

export async function applyToLever(
  page: Page,
  url: string,
  customResumePath?: string
): Promise<boolean> {
  console.log(`Navigating to Lever: ${url}`);

  if (!url.includes('/apply')) {
    await page.goto(url + '/apply', { waitUntil: 'networkidle' });
  } else {
    await page.goto(url, { waitUntil: 'networkidle' });
  }

  // Fill standard fields
  await page.fill('input[name="name"]', `${profile.firstName} ${profile.lastName}`);
  await page.fill('input[name="email"]', profile.email);
  await page.fill('input[name="phone"]', profile.phone);

  // Upload Resume
  const resumePath = customResumePath || path.resolve(__dirname, '../', profile.resumePath);
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
    await fileInputs[0].setInputFiles(resumePath);
  } else {
    throw new Error('No file input found for resume upload');
  }

  // Links (Lever uses dynamic inputs for urls, we try generic selectors)
  const inputs = await page.$$('input[type="text"]');
  for (const input of inputs) {
    const nameAttr = (await input.getAttribute('name')) || '';
    if (nameAttr.toLowerCase().includes('linkedin')) {
      await input.fill(profile.linkedin).catch(() => {});
    } else if (nameAttr.toLowerCase().includes('github')) {
      await input.fill(profile.github).catch(() => {});
    } else if (
      nameAttr.toLowerCase().includes('portfolio') ||
      nameAttr.toLowerCase().includes('website')
    ) {
      await input.fill(profile.portfolio).catch(() => {});
    }
  }

  console.log('Lever form filled.');

  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    console.log('Found submit button! Clicking...');
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
  }

  const success = await page.isVisible('text="submitted"');
  return success;
}

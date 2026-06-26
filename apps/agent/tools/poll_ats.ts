import { TargetCompany } from './companies';
import { JobDetails } from './scrape_lever'; // Re-use the interface

export async function pollATS(company: TargetCompany, keyword: string): Promise<JobDetails[]> {
  console.log(`Polling ATS for ${company.name}...`);
  try {
    if (company.type === 'greenhouse') {
      return await pollGreenhouse(company, keyword);
    } else if (company.type === 'lever') {
      return await pollLever(company, keyword);
    }
  } catch (e: any) {
    if (e.message && e.message.includes('HTTP 404')) {
      console.log(`Failed to poll ${company.name}: HTTP 404 Not Found`);
    } else {
      console.error(`Failed to poll ${company.name}:`, e instanceof Error ? e.message : e);
    }
  }
  return [];
}

async function pollGreenhouse(company: TargetCompany, keyword: string): Promise<JobDetails[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${company.token}/jobs?content=true`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const jobs: JobDetails[] = [];
  for (const job of data.jobs || []) {
    if (job.title.toLowerCase().includes(keyword.toLowerCase())) {
      // Strip HTML from content for a cleaner description
      const cleanDesc = (job.content || '').replace(/<[^>]*>?/gm, '');
      jobs.push({
        title: job.title.trim(),
        company: company.name,
        description: cleanDesc.substring(0, 3000), // Keep it reasonable for AI
        url: job.absolute_url,
        atsType: 'greenhouse',
      });
    }
  }
  return jobs;
}

async function pollLever(company: TargetCompany, keyword: string): Promise<JobDetails[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${company.token}?mode=json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const jobs: JobDetails[] = [];
  for (const posting of data || []) {
    if (posting.text.toLowerCase().includes(keyword.toLowerCase())) {
      const cleanDesc = (posting.descriptionPlain || posting.description || '').replace(
        /<[^>]*>?/gm,
        ''
      );
      jobs.push({
        title: posting.text.trim(),
        company: company.name,
        description: cleanDesc.substring(0, 3000),
        url: posting.hostedUrl,
        atsType: 'lever',
      });
    }
  }
  return jobs;
}

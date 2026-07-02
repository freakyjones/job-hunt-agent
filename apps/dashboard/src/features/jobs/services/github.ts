export async function triggerScraperWorkflow(
  command: string = 'all',
  userId?: string,
  userEmail?: string
): Promise<void> {
  const githubToken = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_OWNER || 'freakyjones';
  const repo = process.env.GITHUB_REPO || 'job-hunt-agent';

  if (!githubToken) {
    throw new Error('Missing GITHUB_PAT env variable');
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/job_hunt.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'feat/multi-tenant-scraper-fix',
        inputs: { command, user_id: userId, user_email: userEmail },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} - ${err}`);
  }
}

import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function check() {
  const token = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_OWNER || 'freakyjones';
  const repo = process.env.GITHUB_REPO || 'job-hunt-agent';

  if (!token) {
    console.error('Missing GITHUB_PAT');
    return;
  }

  // Get run details
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs/28586174843`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!res.ok) {
    console.error('Error fetching run:', await res.text());
    return;
  }

  const run = await res.json();
  console.log('Run details:', {
    id: run.id,
    status: run.status,
    conclusion: run.conclusion,
    event: run.event,
    head_branch: run.head_branch,
  });

  // Let's also fetch the jobs inserted today
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log(
    'Latest 10 jobs inserted:',
    jobs?.map((j: any) => ({
      id: j.id,
      company: j.company,
      role: j.role,
      user_id: j.user_id,
      created_at: j.created_at,
      url: j.url,
    })),
    error
  );
}

check().catch(console.error);

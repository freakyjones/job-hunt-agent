import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function check() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials');
    return;
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.from('jobs').select('url');
  if (error) {
    console.error('Error fetching:', error instanceof Error ? error.message : error);
    return;
  }

  let leverCount = 0;
  let greenhouseCount = 0;
  let indeedCount = 0;
  let naukriCount = 0;
  let otherCount = 0;

  for (const job of data || []) {
    const url = job.url || '';
    if (url.includes('lever.co')) leverCount++;
    else if (url.includes('greenhouse.io')) greenhouseCount++;
    else if (url.includes('indeed.com')) indeedCount++;
    else if (url.includes('naukri.com')) naukriCount++;
    else otherCount++;
  }

  console.log(`Lever jobs: ${leverCount}`);
  console.log(`Greenhouse jobs: ${greenhouseCount}`);
  console.log(`Indeed jobs: ${indeedCount}`);
  console.log(`Naukri jobs: ${naukriCount}`);
  console.log(`Other jobs: ${otherCount}`);
  console.log(`Total jobs: ${data?.length}`);
}

check().catch(console.error);

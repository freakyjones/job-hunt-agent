import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import * as dotenv from 'dotenv';
import { TargetCompany } from '@job-hunt/types';

dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const parser = new Parser();

export async function checkRSSFeeds() {
  console.log('Fetching active target companies...');
  const { data: companies, error } = await supabase.from('target_companies').select('*');

  if (error || !companies) {
    console.error('Failed to fetch target companies:', error);
    return;
  }

  for (const company of companies as TargetCompany[]) {
    console.log(`Checking RSS feed for ${company.company_name} at ${company.rss_feed_url}...`);
    try {
      const feed = await parser.parseURL(company.rss_feed_url);

      for (const item of feed.items) {
        if (!item.link || !item.title) continue;

        // Attempt to insert the signal. Due to the UNIQUE constraint on source_url,
        // duplicates will just fail gracefully or we can check first.
        const { error: insertError } = await supabase.from('company_signals').insert({
          company_id: company.id,
          source_url: item.link,
          title: item.title,
          content_summary: item.contentSnippet || item.content || '',
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        });

        if (insertError) {
          // 23505 is the unique violation code in Postgres
          if (insertError.code !== '23505') {
            console.error(`Error inserting signal ${item.title}:`, insertError);
          }
        } else {
          console.log(`[NEW SIGNAL] Added: ${item.title}`);
        }
      }
    } catch (err) {
      console.error(`Failed to parse feed for ${company.company_name}:`, err);
    }
  }
}

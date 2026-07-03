import { checkRSSFeeds } from './monitor';
import { processSignals } from './agent/graph';

async function main() {
  console.log('=== Starting Networking Agent Worker ===');

  console.log('\n[Phase 1] Monitoring Signals...');
  await checkRSSFeeds();

  console.log('\n[Phase 2] Processing Signals & Generating Leads...');
  await processSignals();

  console.log('\n=== Worker Finished ===');
}

main().catch((err) => {
  console.error('Worker failed with error:', err);
  process.exit(1);
});

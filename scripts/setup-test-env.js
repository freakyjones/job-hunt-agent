const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // 1. Run supabase status
  console.log('Fetching Supabase status...');
  const stdout = execSync('npx supabase status', { encoding: 'utf-8' });

  // 2. Strip ANSI escape/color codes
  const cleanStdout = stdout.replace(/\u001b\[[0-9;]*m/g, '');

  // 3. Match keys using regex (compatible with both old and new Supabase CLI formats, supporting ASCII pipes and Unicode box drawings)
  const anonKeyMatch = cleanStdout.match(/(?:anon key\s*:\s*|Publishable\s*[│|]\s*)(\S+)/i);
  const serviceRoleKeyMatch = cleanStdout.match(
    /(?:service_role key\s*:\s*|Secret\s*[│|]\s*)(\S+)/i
  );
  const apiUrlMatch = cleanStdout.match(/(?:API URL\s*:\s*|Project URL\s*[│|]\s*)(\S+)/i);

  if (!anonKeyMatch || !serviceRoleKeyMatch) {
    console.error('Raw Status Output:\n', stdout);
    throw new Error('Failed to find anon key or service_role key in supabase status output.');
  }

  const anonKey = anonKeyMatch[1].trim();
  const serviceRoleKey = serviceRoleKeyMatch[1].trim();
  const apiUrl = apiUrlMatch ? apiUrlMatch[1].trim() : 'http://127.0.0.1:54321';

  // 4. Create the env file content
  const envContent =
    [
      `NEXT_PUBLIC_SUPABASE_URL=${apiUrl}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`,
      `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`,
    ].join('\n') + '\n';

  // 5. Write to apps/dashboard/.env.test.local
  const targetPath = path.resolve(__dirname, '..', 'apps', 'dashboard', '.env.test.local');
  fs.writeFileSync(targetPath, envContent);

  console.log(`Successfully wrote emulator keys to ${targetPath}`);
} catch (error) {
  console.error('Failed to setup test environment keys:', error.message);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mcwarivltkjplzezkvgu.supabase.co';

const url = `${supabaseUrl}/functions/v1/process-exams`;
console.info('Fetching', url);

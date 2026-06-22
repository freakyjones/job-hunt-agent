import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
    console.log("Resetting ERROR jobs to PENDING...");
    const { data, error } = await supabase
        .from('jobs')
        .update({ status: 'PENDING' })
        .eq('status', 'ERROR')
        .select();

    if (error) {
        console.error("Reset failed:", error.message);
    } else {
        console.log(`Reset ${data?.length || 0} jobs.`);
    }
}

reset();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { sendEmailNotification } from './apps/agent/tools/email_notify.ts';

dotenv.config();

async function testAll() {
    console.log("1. Testing Supabase Connection...");
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase credentials in .env");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Simple query to test connection
        const { error } = await supabase.from('jobs').select('id').limit(1);
        
        if (error) {
            throw new Error(error.message);
        }
        
        console.log(`✅ Supabase Success! Connected successfully.`);
    } catch (e: any) {
        console.error("❌ Supabase Error:", e.message);
    }

    console.log("\n2. Testing Resend Email Connection...");
    try {
        await sendEmailNotification({
            subject: "🚀 Job Hunt Agent: Test Email",
            body: "<h2>Hello!</h2><p>This is a test from your Zero-Cost Job Hunt Agent to prove the Resend API is working perfectly.</p>"
        });
        console.log(`✅ Resend Email sent successfully to ${process.env.EMAIL_TO}!`);
    } catch (e: any) {
        console.error("❌ Resend Error:", e.message);
    }
}

testAll().then(() => console.log("\nTest complete.")).catch(console.error);

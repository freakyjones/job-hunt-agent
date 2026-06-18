import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

// Create a Supabase client with the Service Role key
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
    console.log("Fetching existing users...");
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
        console.error("Failed to list users:", listError.message);
        return;
    }

    if (users.length > 0) {
        console.log(`Found ${users.length} existing users. Deleting them...`);
        for (const user of users) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`Failed to delete user ${user.email}:`, deleteError.message);
            } else {
                console.log(`Deleted user ${user.email}`);
            }
        }
    } else {
        console.log("No existing users found.");
    }

    console.log("Creating new user: abhilashpandey8170@gmail.com");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: 'abhilashpandey8170@gmail.com',
        password: 'jobhunt123',
        email_confirm: true // This auto-confirms the email!
    });

    if (error) {
        console.error("Failed to create user:", error.message);
    } else {
        console.log("Successfully created user!");
        console.log("User ID:", data.user.id);
    }
}

main();

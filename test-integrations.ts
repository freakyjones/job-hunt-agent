import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as fs from 'fs';
import { sendEmailNotification } from './tools/email_notify';

async function testAll() {
    console.log("1. Testing Google Sheets Connection...");
    try {
        const credentials = JSON.parse(fs.readFileSync('./google-credentials.json', 'utf8'));
        const docId = process.env.GOOGLE_SHEETS_DOCUMENT_ID;
        if (!docId) throw new Error("GOOGLE_SHEETS_DOCUMENT_ID is missing from .env");
        
        try {
            const serviceAccountAuth = new JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const doc = new GoogleSpreadsheet(docId, serviceAccountAuth);
            await doc.loadInfo();
            console.log(`✅ Google Sheets Success! Connected to Document: "${doc.title}"`);
        } catch (e: any) {
            console.error("❌ Google Sheets Error:", e.message);
        }
    } catch (e: any) {
        console.error("❌ Failed to read Google Credentials:", e.message);
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

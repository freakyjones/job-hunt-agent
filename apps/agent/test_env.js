const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function testEnv() {
    console.log("Checking Environment Variables...");

    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
    if (!process.env.GOOGLE_SHEETS_DOCUMENT_ID) throw new Error("GOOGLE_SHEETS_DOCUMENT_ID missing");
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) throw new Error("GOOGLE_SERVICE_ACCOUNT_BASE64 missing");

    console.log("✅ Basic variables exist.");

    try {
        console.log("Testing Google Sheets Connection...");
        const credsStr = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        const credentials = JSON.parse(credsStr);
        
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_DOCUMENT_ID, serviceAccountAuth);
        await doc.loadInfo();
        console.log("✅ Google Sheets connected successfully! Title: " + doc.title);
    } catch (e) {
        console.error("❌ Google Sheets Error:", e.message);
    }

    try {
        console.log("Testing Gemini Connection...");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Respond with the word 'OK'" }] }]
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        console.log("✅ Gemini connected successfully!");
    } catch (e) {
        console.error("❌ Gemini Error:", e.message);
    }
}

testEnv();

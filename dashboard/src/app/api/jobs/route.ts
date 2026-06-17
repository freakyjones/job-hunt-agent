import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// Parse base64 credentials if available (for Vercel deployment), else fallback to parsing JSON string (local dev)
function getCredentials() {
    const credsStr = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 
        ? Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
        : process.env.GOOGLE_CREDENTIALS_JSON;
        
    if (!credsStr) throw new Error("Missing GOOGLE_CREDENTIALS_JSON or GOOGLE_SERVICE_ACCOUNT_BASE64 in env.");
    return JSON.parse(credsStr);
}

export async function GET() {
    try {
        const credentials = getCredentials();
        const docId = process.env.GOOGLE_SHEETS_DOCUMENT_ID;
        if (!docId) throw new Error("Missing GOOGLE_SHEETS_DOCUMENT_ID");

        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(docId, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        const rows = await sheet.getRows();
        const jobs = rows.map(row => ({
            id: row.get('ID'),
            company: row.get('Company'),
            role: row.get('Role'),
            url: row.get('URL'),
            score: parseInt(row.get('Score') || '0', 10),
            reasoning: row.get('Reasoning'),
            status: row.get('Status'),
        }));

        // Sort jobs by score descending
        jobs.sort((a, b) => b.score - a.score);

        return NextResponse.json({ success: true, data: jobs });
    } catch (error: any) {
        console.error("Failed to fetch jobs:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { id, newStatus } = await req.json();
        if (!id || !newStatus) return NextResponse.json({ success: false, error: "Missing id or newStatus" }, { status: 400 });

        const credentials = getCredentials();
        const docId = process.env.GOOGLE_SHEETS_DOCUMENT_ID;
        if (!docId) throw new Error("Missing GOOGLE_SHEETS_DOCUMENT_ID");

        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(docId, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        const rows = await sheet.getRows();
        const row = rows.find(r => r.get('ID') === id);

        if (!row) {
            return NextResponse.json({ success: false, error: "Job ID not found" }, { status: 404 });
        }

        row.set('Status', newStatus);
        await row.save();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to update job status:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

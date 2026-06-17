import DashboardClient from './DashboardClient';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// Prevent Next.js from attempting to statically generate this page at build time (when ENV vars are missing)
export const dynamic = 'force-dynamic';

function getCredentials() {
    const credsStr = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 
        ? Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
        : process.env.GOOGLE_CREDENTIALS_JSON;
        
    if (!credsStr) throw new Error("Missing GOOGLE_CREDENTIALS_JSON or GOOGLE_SERVICE_ACCOUNT_BASE64 in env.");
    return JSON.parse(credsStr);
}

async function getJobs() {
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
        return jobs.sort((a, b) => b.score - a.score);
    } catch (e) {
        console.error(e);
        return [];
    }
}

export default async function Home() {
    const jobs = await getJobs();
    return <DashboardClient initialJobs={jobs} />;
}

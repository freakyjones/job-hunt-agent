'use server';

import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { revalidatePath } from 'next/cache';

function getCredentials() {
    const credsStr = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 
        ? Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
        : process.env.GOOGLE_CREDENTIALS_JSON;
        
    if (!credsStr) throw new Error("Missing GOOGLE_CREDENTIALS_JSON or GOOGLE_SERVICE_ACCOUNT_BASE64 in env.");
    return JSON.parse(credsStr);
}

export async function getJobsAction() {
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

        return { success: true, data: jobs.sort((a, b) => b.score - a.score) };
    } catch (e: any) {
        console.error("Failed to get jobs:", e);
        return { success: false, error: e.message };
    }
}

export async function updateJobStatusAction(id: string, newStatus: string) {
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
        const row = rows.find(r => r.get('ID') === id);

        if (!row) {
            return { success: false, error: 'Job not found' };
        }

        row.set('Status', newStatus);
        await row.save();

        revalidatePath('/'); // Force the dashboard to refresh server-side data
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function triggerGitHubAction() {
    try {
        const githubToken = process.env.GITHUB_PAT;
        const owner = process.env.GITHUB_OWNER || 'freakyjones';
        const repo = process.env.GITHUB_REPO || 'job-hunt-agent';

        if (!githubToken) {
            return { success: false, error: "Missing GITHUB_PAT env variable" };
        }

        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/job_hunt.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ref: 'main' }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`GitHub API error: ${res.status} - ${err}`);
        }

        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

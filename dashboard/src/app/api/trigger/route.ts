import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const githubToken = process.env.GITHUB_PAT;
        if (!githubToken) {
            return NextResponse.json({ success: false, error: "GITHUB_PAT not configured" }, { status: 500 });
        }

        // Replace with the user's actual repo and owner
        // Since we don't dynamically know it, we might need it via ENV or hardcoded
        const owner = "freakyjones"; // Derived from the git push logs
        const repo = "job-hunt-agent";
        
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/job_hunt.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${githubToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ref: 'main', // Trigger on main branch
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`GitHub API error: ${res.status} ${errorText}`);
        }

        return NextResponse.json({ success: true, message: "Scrape triggered successfully!" });
    } catch (error: any) {
        console.error("Failed to trigger GitHub Action:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

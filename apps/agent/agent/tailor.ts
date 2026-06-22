import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import { getBrowser } from '../tools/playwright_core';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export class TailoringAgent {
    private ai: GoogleGenAI;
    private modelName: string;

    constructor() {
        this.ai = new GoogleGenAI({});
        this.modelName = 'gemini-2.5-flash';
    }

    async tailorResume(masterResume: string, jobDescription: string, company: string): Promise<string> {
        console.log(`[TailoringAgent] Generating tailored resume for ${company}...`);

        const prompt = `
        You are an expert resume writer and career coach.
        I want to apply for a job. Rewrite my master resume to perfectly align with the job description.
        
        RULES:
        1. Keep my contact info and name at the top.
        2. Highlight and emphasize the skills from my experience that match the job description.
        3. Do NOT invent or fabricate any experience. If I don't have a required skill, do not add it.
        4. Keep it professional, concise, and ATS-friendly.
        5. Output ONLY raw Markdown text. No conversational filler, no extra code blocks. Just the raw markdown resume.

        <MasterResume>
        ${masterResume}
        </MasterResume>

        <JobDescription>
        ${jobDescription}
        </JobDescription>
        `;

        let response;
        try {
            response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: prompt,
            });
        } catch (error: unknown) {
            console.error('[TailoringAgent] Gemini API failed:', error);
            throw new Error('Failed to generate tailored resume content.');
        }

        const markdownText = response.text;
        if (!markdownText) {
            throw new Error('TailoringAgent returned empty response.');
        }

        // Convert Markdown to HTML
        const htmlBody = await marked.parse(markdownText);
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    font-size: 11pt;
                    line-height: 1.4;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                }
                h1, h2, h3 { color: #111; margin-bottom: 0.5em; }
                h1 { font-size: 24pt; border-bottom: 2px solid #333; padding-bottom: 5px; }
                h2 { font-size: 14pt; border-bottom: 1px solid #ccc; margin-top: 1.5em; padding-bottom: 3px; }
                h3 { font-size: 12pt; margin-top: 1em; }
                ul { padding-left: 20px; }
                li { margin-bottom: 5px; }
                p { margin-bottom: 10px; }
                a { color: #0066cc; text-decoration: none; }
            </style>
        </head>
        <body>
            ${htmlBody}
        </body>
        </html>
        `;

        // Generate PDF using Playwright
        const browser = await getBrowser(true); // Headless mode
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.setContent(htmlContent, { waitUntil: 'networkidle' });

        // Ensure output directory exists
        const outputDir = path.join(__dirname, '../../tailored_resumes');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate unique filename
        const safeCompany = company.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const hash = crypto.randomBytes(4).toString('hex');
        const pdfFilename = `resume_${safeCompany}_${hash}.pdf`;
        const pdfPath = path.join(outputDir, pdfFilename);

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
        });

        await browser.close();
        
        console.log(`[TailoringAgent] Saved custom PDF to ${pdfPath}`);
        return pdfPath;
    }
}

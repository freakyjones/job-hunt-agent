import { GoogleGenAI, Type, Schema } from '@google/genai';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfMake = require('pdfmake/build/pdfmake.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const helvetica = require('pdfmake/build/standard-fonts/Helvetica.js');

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

function cleanAndParseJSON(text: string) {
  let cleaned = text.trim();

  // Remove markdown code blocks if present
  const markdownRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = cleaned.match(markdownRegex);
  if (match) {
    cleaned = match[1].trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // Attempt to fix common LLM JSON syntax errors, specifically unescaped newlines inside strings
    try {
      const fixedNewlines = cleaned.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_, p1) => {
        return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
      });
      return JSON.parse(fixedNewlines);
    } catch (secondError) {
      throw firstError;
    }
  }
}

export class TailoringAgent {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor() {
    this.ai = new GoogleGenAI({});
    this.modelName = 'gemini-2.5-flash';
  }

  async tailorResume(
    masterResume: string,
    jobDescription: string,
    company: string
  ): Promise<string> {
    console.log(`[TailoringAgent] Generating tailored resume for ${company}...`);

    const systemInstruction = `
You are an expert resume writer and career coach.
I want to apply for a job. Rewrite my master resume to perfectly align with the job description.

RULES:
1. Keep my contact info and name at the top.
2. Highlight and emphasize the skills from my experience that match the job description.
3. Do NOT invent or fabricate any experience. If I don't have a required skill, do not add it.
4. Keep it professional, concise, and ATS-friendly.
5. You MUST output pure JSON data matching the required schema. Do NOT invent layout properties.
        `.trim();

    const prompt = `
        <MasterResume>
        ${masterResume}
        </MasterResume>

        <JobDescription>
        ${jobDescription}
        </JobDescription>
        `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        contact: { type: Type.STRING, description: 'Email | Phone | LinkedIn | Portfolio' },
        summary: { type: Type.STRING },
        skills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        experience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              company: { type: Type.STRING },
              duration: { type: Type.STRING },
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['role', 'company', 'duration', 'bullets'],
          },
        },
      },
      required: ['name', 'contact', 'summary', 'skills', 'experience'],
    };

    let response;
    try {
      response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });
    } catch (error: any) {
      console.warn(
        `[TailoringAgent] Primary model (${this.modelName}) failed, falling back to gemma-4-31b-it... Error:`,
        error instanceof Error ? error.message : error
      );
      try {
        response = await this.ai.models.generateContent({
          model: 'gemma-4-31b-it',
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          },
        });
      } catch (fallbackError: any) {
        console.error(
          '[TailoringAgent] Fallback model also failed:',
          fallbackError instanceof Error ? fallbackError.message : fallbackError
        );
        throw new Error('Failed to generate tailored resume content with both models.');
      }
    }

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('TailoringAgent returned empty response.');
    }

    const data = cleanAndParseJSON(jsonText);

    // Map experience array to pdfmake blocks safely
    const experienceBlocks: Record<string, unknown>[] = [];
    data.experience.forEach(
      (job: { role: string; company: string; duration: string; bullets: string[] }) => {
        experienceBlocks.push({
          text: `${job.role} - ${job.company}`,
          style: 'jobTitle',
        });
        experienceBlocks.push({
          text: job.duration,
          style: 'jobDuration',
        });
        experienceBlocks.push({
          ul: job.bullets,
          margin: [0, 5, 0, 15],
        });
      }
    );

    // 2. Hardcode the design layout safely matching the dashboard PDF layout
    const docDefinition = {
      content: [
        { text: data.name, style: 'header' },
        { text: data.contact, style: 'contact' },
        { text: 'Professional Summary', style: 'sectionHeader' },
        { text: data.summary, margin: [0, 5, 0, 20] },
        { text: 'Skills', style: 'sectionHeader' },
        { ul: data.skills, margin: [0, 5, 0, 20] },
        { text: 'Experience', style: 'sectionHeader' },
        ...experienceBlocks,
      ],
      styles: {
        header: { fontSize: 24, bold: true, alignment: 'center' },
        contact: { fontSize: 11, alignment: 'center', margin: [0, 5, 0, 20], color: '#555555' },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], color: '#333333' },
        jobTitle: { fontSize: 12, bold: true, margin: [0, 5, 0, 2] },
        jobDuration: { fontSize: 10, italics: true, color: '#777777', margin: [0, 0, 0, 5] },
      },
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.3,
      },
    };

    // Inject standard fonts into Virtual File System
    pdfMake.vfs = helvetica.vfs;
    pdfMake.fonts = fonts;

    const pdfDoc = pdfMake.createPdf(docDefinition);
    const pdfBuffer = await pdfDoc.getBuffer();

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

    fs.writeFileSync(pdfPath, pdfBuffer);

    console.log(`[TailoringAgent] Saved custom PDF to ${pdfPath}`);
    return pdfPath;
  }
}

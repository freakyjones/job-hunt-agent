import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createClient } from '@/utils/supabase/server';

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

export async function POST(req: NextRequest) {
  try {
    const { jobId, jobDescription, masterResume } = await req.json();

    if (!jobDescription || !masterResume) {
      return NextResponse.json(
        { error: 'Missing jobDescription or masterResume' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
You are an expert resume writer.
Extract my master resume and tailor it to the provided job description.

CRITICAL REQUIREMENT:
You must output pure JSON data matching the required schema. Do NOT invent layout properties.
Highlight skills from my experience that match the job description. Do NOT fabricate experience.
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
        summary: {
          type: Type.STRING,
          description: 'A highly tailored 2-3 sentence professional summary.',
        },
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
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });
    } catch (e) {
      console.error(
        `Primary model gemini-2.5-flash failed with error:`,
        e instanceof Error ? e.message : e
      );
      console.warn(`Falling back to gemma-4-31b-it due to potential rate limits...`);
      response = await ai.models.generateContent({
        model: 'gemma-4-31b-it',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });
    }

    const jsonText = response.text;
    if (!jsonText) throw new Error('LLM returned an empty response.');

    // 1. Get the tailored clean data JSON from the AI
    const tailoredData = cleanAndParseJSON(jsonText);

    // Map experience array to pdfmake blocks safely
    const experienceBlocks: Record<string, unknown>[] = [];
    tailoredData.experience.forEach(
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

    // 2. Hardcode the design layout safely
    const docDefinition = {
      content: [
        { text: tailoredData.name, style: 'header' },
        { text: tailoredData.contact, style: 'contact' },
        { text: 'Professional Summary', style: 'sectionHeader' },
        { text: tailoredData.summary, margin: [0, 5, 0, 20] },
        { text: 'Skills', style: 'sectionHeader' },
        { ul: tailoredData.skills, margin: [0, 5, 0, 20] },
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

    // 3. Generate the document binary chunk using isomorphic pdfmake + VFS
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfMake = require('pdfmake/build/pdfmake.js');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const helvetica = require('pdfmake/build/standard-fonts/Helvetica.js');

    // Inject standard fonts into Virtual File System to bypass fs.readFileSync on Vercel
    pdfMake.vfs = helvetica.vfs;
    pdfMake.fonts = fonts;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfDoc = pdfMake.createPdf(docDefinition as any);
    const pdfBuffer = await pdfDoc.getBuffer();

    // 4. Save to Database using the Supabase Server Client
    try {
      // Upload PDF to storage
      const fileName = `${user.id}/${jobId || 'generic'}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error(
          'Failed to upload PDF to storage:',
          uploadError instanceof Error ? uploadError.message : uploadError
        );
      }

      await supabase.from('generated_resumes').insert({
        job_id: jobId || null,
        content: jsonText,
        pdf_url: uploadError ? null : fileName,
        user_id: user.id,
        tags: ['pdf', 'tailored'],
      });
    } catch (dbErr) {
      console.error(
        'Failed to save generated resume to DB:',
        dbErr instanceof Error ? dbErr.message : dbErr
      );
      // We do not fail the request if saving to DB fails, still return the PDF.
    }

    // 5. Stream the binary directly back to the client
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="tailored_resume.pdf"',
      },
    });
  } catch (error: unknown) {
    console.error('Next.js API Route Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

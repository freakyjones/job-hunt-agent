import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type, Schema } from "npm:@google/genai@^2.8.0";
// Use esm.sh to automatically inject browser polyfills for Deno
import pdfMake from "https://esm.sh/pdfmake@0.2.10/build/pdfmake.js";
import pdfFonts from "https://esm.sh/pdfmake@0.2.10/build/vfs_fonts.js";

// Initialize virtual file system for fonts
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { jobId, jobDescription, masterResume } = await req.json();

        if (!jobDescription || !masterResume) {
            return new Response(JSON.stringify({ error: "Missing jobDescription or masterResume" }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable is missing in Supabase Secrets.");
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
        You are an expert resume writer.
        Extract my master resume and tailor it to the provided job description.
        
        CRITICAL REQUIREMENT:
        You must output pure JSON data matching the required schema. Do NOT invent layout properties.
        Highlight skills from my experience that match the job description. Do NOT fabricate experience.

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
                contact: { type: Type.STRING, description: "Email | Phone | LinkedIn | Portfolio" },
                summary: { type: Type.STRING, description: "A highly tailored 2-3 sentence professional summary." },
                skills: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of relevant skills matching the job description." 
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
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["role", "company", "duration", "bullets"]
                    }
                }
            },
            required: ["name", "contact", "summary", "skills", "experience"]
        };

        let response;
        try {
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            });
        } catch (error: unknown) {
            console.warn(`Primary model gemini-2.5-flash failed. Falling back...`);
            response = await ai.models.generateContent({
                model: "gemma-4-31b-it",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            });
        }

        const jsonText = response.text;
        if (!jsonText) throw new Error('LLM returned an empty response.');

        // 1. Get the tailored clean data JSON from the AI
        const tailoredData = JSON.parse(jsonText);

        // Map experience array to pdfmake blocks safely
        const experienceBlocks: any[] = [];
        tailoredData.experience.forEach((job: any) => {
            experienceBlocks.push({
                text: `${job.role} - ${job.company}`,
                style: 'jobTitle'
            });
            experienceBlocks.push({
                text: job.duration,
                style: 'jobDuration'
            });
            experienceBlocks.push({
                ul: job.bullets,
                margin: [0, 5, 0, 15]
            });
        });

        // 2. Hardcode the design layout safely so the LLM can never break it
        const docDefinition = {
            content: [
                { text: tailoredData.name, style: 'header' },
                { text: tailoredData.contact, style: 'contact' },
                { text: 'Professional Summary', style: 'sectionHeader' },
                { text: tailoredData.summary, margin: [0, 5, 0, 20] },
                { text: 'Skills', style: 'sectionHeader' },
                { ul: tailoredData.skills, margin: [0, 5, 0, 20] },
                { text: 'Experience', style: 'sectionHeader' },
                ...experienceBlocks
            ],
            styles: {
                header: { fontSize: 24, bold: true, alignment: 'center' },
                contact: { fontSize: 11, alignment: 'center', margin: [0, 5, 0, 20], color: '#555555' },
                sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], color: '#333333' },
                jobTitle: { fontSize: 12, bold: true, margin: [0, 5, 0, 2] },
                jobDuration: { fontSize: 10, italics: true, color: '#777777', margin: [0, 0, 0, 5] }
            },
            defaultStyle: {
                fontSize: 11,
                lineHeight: 1.3
            }
        };

        // 3. Generate the document binary chunk inside Deno
        const pdfDoc = (pdfMake as any).createPdf(docDefinition);

        const pdfBuffer = await new Promise<Uint8Array>((resolve, reject) => {
            pdfDoc.getBuffer((data: Uint8Array) => {
                resolve(data);
            }, (err: any) => reject(err));
        });

        // 4. Save to Database
        try {
            const authHeader = req.headers.get('Authorization');
            if (authHeader) {
                // We use dynamic import for supabase-js to avoid type conflicts in Deno
                const { createClient } = await import('npm:@supabase/supabase-js@2');
                const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
                const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
                const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
                    global: { headers: { Authorization: authHeader } }
                });

                const { data: userData, error: userError } = await supabaseClient.auth.getUser();
                if (!userError && userData.user) {
                    // Upload PDF to storage
                    const fileName = `${userData.user.id}/${jobId || 'generic'}_${Date.now()}.pdf`;
                    const { error: uploadError } = await supabaseClient.storage
                        .from('resumes')
                        .upload(fileName, pdfBuffer, {
                            contentType: 'application/pdf',
                            upsert: true
                        });
                    
                    if (uploadError) {
                        console.error('Failed to upload PDF to storage:', uploadError);
                    }

                    await supabaseClient.from('generated_resumes').insert({
                        job_id: jobId || null,
                        content: jsonText,
                        pdf_url: uploadError ? null : fileName,
                        user_id: userData.user.id,
                        tags: ['pdf', 'tailored']
                    });
                }
            }
        } catch (dbErr) {
            console.error('Failed to save generated resume to DB:', dbErr);
            // We do not fail the request if saving to DB fails, still return the PDF.
        }

        // 5. Stream the binary directly back to your Next.js client
        return new Response(pdfBuffer, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="tailored_resume.pdf"'
            }
        });

    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

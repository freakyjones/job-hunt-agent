import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const sendTelemetry = async (level: 'info' | 'error', message: string, context: any = {}) => {
  const telemetryUrl = Deno.env.get('NEXTJS_TELEMETRY_URL');
  const token = Deno.env.get('NEXTJS_TELEMETRY_TOKEN') || 'local-dev-secret';

  if (telemetryUrl) {
    try {
      await fetch(telemetryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telemetry-token': token,
        },
        body: JSON.stringify({ source: 'process-exams', level, message, context }),
      });
    } catch {
      // Fail silently if Next.js is unreachable
    }
  }
};

console.log = (...args: any[]) => {
  originalConsoleLog(...args);
  sendTelemetry(
    'info',
    args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
  ).catch(() => {});
};

console.error = (...args: any[]) => {
  originalConsoleError(...args);
  sendTelemetry(
    'error',
    args
      .map((a) =>
        typeof a === 'object' ? (a instanceof Error ? a.message : JSON.stringify(a)) : String(a)
      )
      .join(' ')
  ).catch(() => {});
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Immediately return 202 Accepted to free up the caller (Next.js or pg_net)
  const response = new Response(JSON.stringify({ message: 'Worker Spawned' }), {
    status: 202,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  // Perform the heavy LLM lifting asynchronously using EdgeRuntime.waitUntil
  // @ts-ignore - EdgeRuntime is injected by Supabase Deno runtime
  EdgeRuntime.waitUntil(
    (async () => {
      try {
        const supabaseUrl =
          Deno.env.get('SUPABASE_URL') ?? Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase env vars');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Claim jobs
        // We process up to 3 jobs per worker to stay well within the Edge Function timeout (usually 110-150s max wall-clock)
        const { data: jobs, error } = await supabase.rpc('claim_exam_jobs', { batch_size: 3 });
        if (error) {
          console.error('[Worker] Error claiming jobs:', error);
          return;
        }
        if (!jobs || jobs.length === 0) {
          console.log('[Worker] No pending jobs found.');
          return;
        }

        console.log(`[Worker] Claimed ${jobs.length} jobs.`);

        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
          throw new Error('Missing GEMINI_API_KEY');
        }

        // Process sequentially to respect LLM Provider Rate Limits
        for (const job of jobs) {
          try {
            console.log(`[Worker] Processing job ${job.id} for user ${job.user_id}`);

            // 1. Fetch base resume
            const { data: baseResume, error: resumeError } = await supabase
              .from('base_resumes')
              .select('extracted_content')
              .eq('user_id', job.user_id)
              .single();

            if (resumeError || !baseResume?.extracted_content) {
              throw new Error('No base resume found for this user.');
            }

            // 2. Fetch optional job context
            let jobDescription = '';
            let roleName = 'Senior Software Engineer';
            let existingQuestionsText = '';

            if (job.job_id) {
              const { data: jobInfo } = await supabase
                .from('jobs')
                .select('description, role, company')
                .eq('id', job.job_id)
                .single();
              if (jobInfo) {
                roleName = jobInfo.role || roleName;
                jobDescription = `Role: ${jobInfo.role} at ${jobInfo.company}\nDescription: ${jobInfo.description}`;
              }

              // Anti-history: fetch existing exams and questions for this job and user
              const existingExamsQuery = supabase
                .from('exams')
                .select('id')
                .eq('user_id', job.user_id);

              if (job.job_id) {
                existingExamsQuery.eq('job_id', job.job_id);
              } else {
                existingExamsQuery.is('job_id', null);
              }

              const { data: existingExams } = await existingExamsQuery;

              if (existingExams && existingExams.length > 0) {
                const examIds = existingExams.map((e: any) => e.id);
                const { data: previousQuestions } = await supabase
                  .from('exam_questions')
                  .select('question_text')
                  .in('exam_id', examIds);

                if (previousQuestions && previousQuestions.length > 0) {
                  existingQuestionsText = previousQuestions
                    .map((q: any) => q.question_text)
                    .join('\n- ');
                }
              }
            }

            const focusAreas = [
              'System Design and Scale Frameworks',
              'Under-the-hood performance optimization and memory bottlenecks',
              'Hard behavioral scenarios and conflict resolution in engineering teams',
              'Security vulnerabilities, edge-case debugging, and data integrity',
            ];
            const randomFocus = focusAreas[Math.floor(Math.random() * focusAreas.length)];

            // 3. Prepare AI Prompt
            let prompt = '';
            if (job.job_id) {
              prompt = `You are a Principal Technical Assessor and expert interviewer evaluating candidates for a ${roleName} role.

TARGET JOB CONTEXT:
---
${jobDescription || 'Focus on advanced, industry-standard technical requirements and challenges for this specific role.'}
---

${baseResume?.extracted_content ? `CANDIDATE CONTEXT:\n${baseResume.extracted_content}\n` : ''}

TASK:
Generate exactly 5 advanced, scenario-based multiple-choice questions. 
Base the scenarios heavily on the TARGET JOB CONTEXT to assess practical, on-the-job problem solving.

CRITICAL CONSTRAINT - FOCUS AREA: ${randomFocus}
Every question MUST strictly test deep technical knowledge, edge cases, or architectural trade-offs within this specific focus area.

${existingQuestionsText ? `ANTI-HISTORY EXCLUSION LIST:\nEnsure your new questions are semantically distinct and do NOT test the same concepts as these previously asked questions:\n- ${existingQuestionsText}\n\n` : ''}

FORMATTING REQUIREMENTS:
- Frame questions as real-world scenarios or code/architecture dilemmas rather than basic trivia.
- Output ONLY a valid JSON array of exactly 5 objects. Do not include markdown code blocks.`;
            } else {
              prompt = `You are a Principal Technical Assessor and expert interviewer evaluating a software engineering candidate.

CANDIDATE RESUME CONTEXT:
---
${baseResume?.extracted_content || 'Evaluate generic advanced software engineering concepts.'}
---

TASK:
Generate exactly 5 advanced, scenario-based multiple-choice questions. 
Base the scenarios heavily on the CANDIDATE RESUME CONTEXT to assess the depth of their actual experience and skills.

CRITICAL CONSTRAINT - FOCUS AREA: ${randomFocus}
Every question MUST strictly test deep technical knowledge, edge cases, or architectural trade-offs related to the technologies explicitly mentioned in the resume. Do not assume outside knowledge, but test advanced usage of the skills they list.

${existingQuestionsText ? `ANTI-HISTORY EXCLUSION LIST:\nEnsure your new questions are semantically distinct and do NOT test the same concepts as these previously asked questions:\n- ${existingQuestionsText}\n\n` : ''}

FORMATTING REQUIREMENTS:
- Frame questions as real-world scenarios or code/architecture dilemmas rather than basic trivia.
- Output ONLY a valid JSON array of exactly 5 objects. Do not include markdown code blocks.`;
            }

            const responseSchema = {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  question: { type: 'STRING' },
                  options: { type: 'ARRAY', items: { type: 'STRING' } },
                  correct_option: { type: 'STRING' },
                  explanation: { type: 'STRING' },
                },
                required: ['question', 'options', 'correct_option', 'explanation'],
              },
            };

            const apiKey = Deno.env.get('GEMINI_API_KEY');
            if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

            const tryModel = async (modelName: string) => {
              const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                      responseMimeType: 'application/json',
                      responseSchema: responseSchema,
                      temperature: 0.85,
                      topP: 0.95,
                    },
                  }),
                }
              );

              if (!res.ok) {
                const errText = await res.text();
                throw new Error(`API Error ${res.status}: ${errText}`);
              }

              const json = await res.json();
              const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!textResponse) throw new Error('Empty response from model');

              const cleaned = textResponse
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();
              return JSON.parse(cleaned);
            };

            let parsedQuestions: any[] = [];
            try {
              console.log('[Worker] Calling gemini-2.5-flash...');
              parsedQuestions = await tryModel('gemini-2.5-flash');
              console.log('[Worker] gemini-2.5-flash succeeded!');
            } catch (e) {
              console.warn('[Worker] Primary model failed, falling back to gemma-4-31b-it', e);
              console.log('[Worker] Calling gemma-4-31b-it...');
              parsedQuestions = await tryModel('gemma-4-31b-it');
              console.log('[Worker] gemma-4-31b-it succeeded!');
            }

            console.log('[Worker] Parsed Questions from AI:', JSON.stringify(parsedQuestions));

            if (
              !parsedQuestions ||
              !Array.isArray(parsedQuestions) ||
              parsedQuestions.length === 0
            ) {
              throw new Error('AI returned an empty or invalid questions array.');
            }

            // 4. Database Inserts
            // Insert Exam
            console.log('[Worker] Starting DB inserts...');
            const { data: newExam, error: examError } = await supabase
              .from('exams')
              .insert({
                user_id: job.user_id,
                job_id: job.job_id || null,
                status: 'PENDING',
              })
              .select('id')
              .single();

            if (examError || !newExam) {
              throw new Error(`Failed to create exam record: ${examError?.message}`);
            }

            const examId = newExam.id;

            // Insert Questions and Answers
            for (const q of parsedQuestions) {
              const qText = q.question || q.Question || '';
              const qOpts = q.options || q.Options || q.choices || [];
              const qCorrect = q.correct_option || q.correctOption || q.answer || '';
              const qExpl = q.explanation || q.Explanation || '';

              const { data: questionData, error: qError } = await supabase
                .from('exam_questions')
                .insert({
                  exam_id: examId,
                  question_text: qText,
                  options: qOpts,
                })
                .select('id')
                .single();

              if (qError || !questionData) {
                console.error('[Worker] Error inserting question', JSON.stringify(qError));
                continue;
              }

              const { error: aError } = await supabase.from('exam_answers').insert({
                question_id: questionData.id,
                correct_option: qCorrect,
                explanation: qExpl,
              });
              if (aError) console.error('[Worker] Error inserting answer', JSON.stringify(aError));
            }

            const { error: completeError } = await supabase
              .from('exam_generation_jobs')
              .update({ status: 'completed', exam_id: examId })
              .eq('id', job.id);

            if (completeError) {
              console.error('[Worker] Error marking job as completed:', completeError);
            } else {
              console.log(`[Worker] Job ${job.id} completed successfully!`);
            }
          } catch (e: any) {
            console.error(`[Worker] Job ${job.id} failed:`, e);
            const errorMessage = e instanceof Error ? e.message : e?.message || JSON.stringify(e);
            await supabase
              .from('exam_generation_jobs')
              .update({ status: 'failed', error_message: errorMessage })
              .eq('id', job.id);
          }
        }
      } catch (criticalError) {
        console.error('[Worker] Critical error:', criticalError);
      }
    })()
  );

  return response;
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  fetchBaseResume,
  fetchJobContext,
  generateExamQuestions,
  saveExamToDatabase,
} from './utils.ts';

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
            const baseResume = await fetchBaseResume(supabase, job.user_id);

            // 2. Fetch optional job context
            const jobContext = await fetchJobContext(supabase, job.user_id, job.job_id);

            // 3. Prepare AI Prompt & Call Model
            const parsedQuestions = await generateExamQuestions(
              apiKey,
              baseResume,
              jobContext,
              job.job_id
            );

            console.log('[Worker] Parsed Questions from AI:', JSON.stringify(parsedQuestions));

            // 4. Database Inserts
            const examId = await saveExamToDatabase(
              supabase,
              job.user_id,
              job.job_id,
              parsedQuestions
            );

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

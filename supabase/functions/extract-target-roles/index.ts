import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@2.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // We only care about inserts or updates where extracted_content exists
    const record = payload.record;
    if (!record || !record.extracted_content) {
      return new Response(JSON.stringify({ message: 'No extracted_content found, skipping.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Only process if target_roles is empty to avoid infinite loops on update
    // Wait, the webhook might trigger again when we update target_roles!
    // So if target_roles is already populated, and extracted_content didn't change, we skip.
    if (
      payload.type === 'UPDATE' &&
      payload.old_record &&
      payload.old_record.extracted_content === record.extracted_content
    ) {
      return new Response(JSON.stringify({ message: 'Content did not change, skipping.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Starting AI extraction for user_id: ${record.user_id}`);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Based on the following resume, suggest exactly 3 concise job titles (e.g., "Frontend Developer", "Data Scientist", "Product Manager") that this candidate should search for when job hunting. Return ONLY a JSON array of 3 strings.
    
    Resume:
    ${record.extracted_content.substring(0, 5000)}`;

    const responseSchema = {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Array of 3 concise job titles',
    };

    const tryModel = async (modelName: string) => {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });
      if (!res?.text) throw new Error('Empty response');
      const cleaned = res.text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) throw new Error('Not an array');
      return parsed.slice(0, 3);
    };

    let targetRoles = [];
    try {
      targetRoles = await tryModel('gemini-2.5-flash');
    } catch (error) {
      console.warn(
        'Primary model gemini-2.5-flash failed, falling back to gemma-4-31b-it...',
        error
      );
      try {
        targetRoles = await tryModel('gemma-4-31b-it');
      } catch (fallbackError) {
        console.error('Fallback model failed too:', fallbackError);
        targetRoles = [];
      }
    }

    console.log(`Extracted roles: ${JSON.stringify(targetRoles)}`);

    // Update the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase env vars');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from('base_resumes')
      .update({ target_roles: targetRoles })
      .eq('id', record.id);

    if (dbError) {
      throw new Error(`Failed to update DB: ${dbError.message}`);
    }

    return new Response(JSON.stringify({ success: true, targetRoles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

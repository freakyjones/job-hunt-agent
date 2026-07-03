import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search';
import { StateGraph } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { CompanySignal } from '@job-hunt/types';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { NetworkingLeadStatus } from '@job-hunt/types';

dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define graph state
interface AgentState {
  signal: CompanySignal;
  searchContext: string;
  contactName: string;
  contactRole: string;
  draftMessage: string;
  error?: string;
}

const searchTool = new DuckDuckGoSearch({ maxResults: 3 });

// The primary model (fast but rate limited on free tier)
const primaryModel = new ChatGoogleGenerativeAI({
  modelName: 'gemini-2.5-flash',
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 0,
});

// The fallback model (higher quota)
const fallbackModel = new ChatGoogleGenerativeAI({
  modelName: 'gemma-4-31b-it',
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 2,
});

/**
 * Node 1: Contextual Researcher
 * Searches for a relevant contact at the company based on the signal.
 */
async function contextualResearcher(state: AgentState): Promise<Partial<AgentState>> {
  const signal = state.signal;
  console.log(`[Researcher] Searching context for: ${signal.title}`);

  // Search for the company's Engineering or Product leadership
  const query = `site:linkedin.com/in "Engineering Manager" OR "Tech Lead" OR "Product Manager" "${signal.title}"`;

  try {
    const searchResults = await searchTool.invoke(query);

    // We'll use the LLM to extract a single name and role from the search results
    const extractionPrompt = [
      new SystemMessage(
        'Extract the best single contact name and their role from the search results. Return as JSON: {"name": "...", "role": "..."}. If none found, return {"name": "Unknown", "role": "Unknown"}. Do not use markdown.'
      ),
      new HumanMessage(`Search Results:\n${searchResults}`),
    ];

    let extractionResponse;
    try {
      extractionResponse = await primaryModel.invoke(extractionPrompt);
    } catch (err: any) {
      console.warn(`[Researcher] Primary model failed (${err.message}), falling back to Gemma...`);
      extractionResponse = await fallbackModel.invoke(extractionPrompt);
    }

    const content =
      typeof extractionResponse.content === 'string'
        ? extractionResponse.content
        : JSON.stringify(extractionResponse.content);
    // Robust parsing
    const cleanContent = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const extracted = JSON.parse(cleanContent);

    return {
      searchContext: searchResults,
      contactName: extracted.name,
      contactRole: extracted.role,
    };
  } catch (err: any) {
    console.error(`[Researcher] Search failed:`, err);
    return {
      contactName: 'Unknown',
      contactRole: 'Unknown',
      error: err.message,
    };
  }
}

/**
 * Node 2: Draft Generator
 * Generates the hyper-personalized 3-sentence message.
 */
async function draftGenerator(state: AgentState): Promise<Partial<AgentState>> {
  if (state.contactName === 'Unknown') {
    return {
      draftMessage:
        'Could not find a specific contact. Consider reaching out to general engineering leadership or a recruiter.',
    };
  }

  console.log(`[Drafter] Generating message for ${state.contactName} (${state.contactRole})...`);

  const prompt = [
    new SystemMessage(`You are a networking assistant. Draft a hyper-personalized 3-sentence message to the contact. 
    Sentence 1: Reference their recent company signal/blog post.
    Sentence 2: Connect their work/challenge to my interest or skills.
    Sentence 3: Express a desire to connect and learn how their team approaches this technical challenge.
    Keep it extremely natural and avoid buzzwords.`),
    new HumanMessage(`
      Contact Name: ${state.contactName}
      Contact Role: ${state.contactRole}
      Company Signal Title: ${state.signal.title}
      Company Signal Summary: ${state.signal.content_summary}
    `),
  ];

  let draftResponse;
  try {
    draftResponse = await primaryModel.invoke(prompt);
  } catch (err: any) {
    console.warn(`[Drafter] Primary model failed (${err.message}), falling back to Gemma...`);
    draftResponse = await fallbackModel.invoke(prompt);
  }

  return {
    draftMessage:
      typeof draftResponse.content === 'string'
        ? draftResponse.content
        : JSON.stringify(draftResponse.content),
  };
}

// Build graph
const graph = new StateGraph<AgentState>({
  channels: {
    signal: { value: (x, y) => y ?? x, default: () => ({}) as CompanySignal },
    searchContext: { value: (x, y) => y ?? x, default: () => '' },
    contactName: { value: (x, y) => y ?? x, default: () => '' },
    contactRole: { value: (x, y) => y ?? x, default: () => '' },
    draftMessage: { value: (x, y) => y ?? x, default: () => '' },
    error: { value: (x, y) => y ?? x, default: () => undefined },
  },
})
  .addNode('researcher', contextualResearcher)
  .addNode('drafter', draftGenerator)
  .addEdge('__start__', 'researcher')
  .addEdge('researcher', 'drafter')
  .addEdge('drafter', '__end__')
  .compile();

export async function processSignals() {
  console.log('Fetching unprocessed signals...');
  // Find signals that don't have a corresponding networking lead yet
  const { data: signals, error } = await supabase
    .from('company_signals')
    .select('*, target_companies!inner(user_id)')
    .order('created_at', { ascending: false })
    .limit(10); // batch limit

  if (error || !signals) {
    console.error('Failed to fetch signals:', error);
    return;
  }

  for (const row of signals) {
    const userId = row.target_companies.user_id;

    // Check if lead exists
    const { data: existingLeads } = await supabase
      .from('networking_leads')
      .select('id')
      .eq('signal_id', row.id);

    if (existingLeads && existingLeads.length > 0) {
      continue; // Already processed
    }

    console.log(`\n--- Processing Signal: ${row.title} ---`);

    try {
      const result = await graph.invoke({
        signal: row as CompanySignal,
      });

      if (result.contactName && result.draftMessage) {
        // Save to database
        const { error: insertError } = await supabase.from('networking_leads').insert({
          user_id: userId,
          signal_id: row.id,
          contact_name: result.contactName,
          contact_role: result.contactRole,
          draft_message: result.draftMessage,
          status: NetworkingLeadStatus.PENDING,
        });

        if (insertError) {
          console.error(`Failed to save networking lead:`, insertError);
        } else {
          console.log(`✅ Successfully saved lead for ${result.contactName}`);
        }
      }
    } catch (err) {
      console.error(`Error executing graph for signal ${row.id}:`, err);
    }
  }
}

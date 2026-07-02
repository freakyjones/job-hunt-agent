import { GoogleGenAI, Type, Schema } from '@google/genai';
import { SYSTEM_PROMPT } from './system_prompt';
import { EvaluationResult, EvaluationResultSchema } from '@job-hunt/types';

/**
 * Initializes and returns the Job Hunt Agent orchestrated by the Antigravity SDK.
 */
export class JobHuntAgent {
  private ai: GoogleGenAI;
  private modelName: string;
  private fallbackModelName: string;

  constructor() {
    // Automatically picks up GEMINI_API_KEY from environment variables
    this.ai = new GoogleGenAI({});
    this.modelName = 'gemini-2.5-flash';
    this.fallbackModelName = 'gemma-4-31b-it';
  }

  /**
   * Evaluates a single job posting against the Master Resume.
   * @param jobDescription The extracted text of the job description
   * @param masterResume The candidate's master resume
   * @returns A JSON object containing the score and reasoning
   */
  async evaluateJob(jobDescription: string, masterResume: string): Promise<EvaluationResult> {
    console.log('Evaluating job posting...');

    const prompt = `
        Evaluate the following job description against my master resume.
        
        <MasterResume>
        ${masterResume}
        </MasterResume>

        <JobDescription>
        ${jobDescription}
        </JobDescription>
        `;

    // Define a strict JSON Schema using Zod or standard JSON schema
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: {
          type: Type.INTEGER,
          description: 'Match score from 0 to 100 based strictly on resume fit',
        },
        matchReason: {
          type: Type.STRING,
          description:
            "A 2-sentence harsh critique of why the candidate fits or doesn't fit. You must quote the exact line from the resume that matches requirements.",
        },
        missingSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            'List of explicit skills mentioned in the job description that are NOT explicitly found in the resume.',
        },
      },
      required: ['score', 'matchReason', 'missingSkills'],
    };

    let response;
    try {
      response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });
    } catch (error: unknown) {
      console.warn(
        `Primary model ${this.modelName} failed. Falling back to ${this.fallbackModelName}...`
      );
      if (error instanceof Error) {
        console.warn(`Reason: ${error.message}`);
      }
      response = await this.ai.models.generateContent({
        model: this.fallbackModelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });
    }

    if (!response?.text) {
      throw new Error('LLM failed to return text.');
    }

    function cleanAndParseJSON(text: string) {
      let cleaned = text.trim();

      // Remove markdown code blocks if present
      const markdownRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
      const match = cleaned.match(markdownRegex);
      if (match) {
        cleaned = match[1].trim();
      } else {
        // Fallback: extract JSON object if wrapped in other text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        }
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

    try {
      // Robust JSON extraction using the shared utility pattern
      const parsedObj = cleanAndParseJSON(response.text);
      const result = EvaluationResultSchema.parse(parsedObj);
      return result;
    } catch (error) {
      console.error('JSON Parsing/Validation failed. Raw response:', response.text);
      if (error instanceof Error) {
        console.error(error.message);
      }
      throw new Error('Gemini returned malformed JSON or failed validation.');
    }
  }
}

export const createAgent = () => new JobHuntAgent();

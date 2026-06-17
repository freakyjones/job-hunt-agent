import { GoogleGenAI, Type, Schema } from '@google/genai';
import { SYSTEM_PROMPT } from './system_prompt';

export interface EvaluationResult {
    score: number;
    matchReason: string;
    missingSkills: string[];
}

/**
 * Initializes and returns the Job Hunt Agent orchestrated by the Antigravity SDK.
 */
export class JobHuntAgent {
    private ai: GoogleGenAI;
    private modelName: string;

    constructor() {
        // Automatically picks up GEMINI_API_KEY from environment variables
        this.ai = new GoogleGenAI({});
        this.modelName = 'gemini-2.5-flash';
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
                    description: "Match score from 0 to 100 based strictly on resume fit"
                },
                matchReason: {
                    type: Type.STRING,
                    description: "A 2-sentence harsh critique of why the candidate fits or doesn't fit. You must quote the exact line from the resume that matches requirements."
                },
                missingSkills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of explicit skills mentioned in the job description that are NOT explicitly found in the resume."
                }
            },
            required: ["score", "matchReason", "missingSkills"],
        };

        const response = await this.ai.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                // Implementing a small delay/rate limit mitigation could be done here or in the caller
            }
        });

        if (!response.text) {
            throw new Error('Gemini failed to return text.');
        }

        try {
            // Cleanup: Sometimes Gemini wraps JSON in markdown blocks despite the application/json mime type
            let rawText = response.text.trim();
            if (rawText.startsWith('```json')) {
                rawText = rawText.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (rawText.startsWith('```')) {
                rawText = rawText.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            const result: EvaluationResult = JSON.parse(rawText);
            return result;
        } catch (error) {
            console.error("JSON Parsing failed. Raw response:", response.text);
            throw new Error('Gemini returned malformed JSON.');
        }
    }

    /**
     * Executes the Auto-Applier workflow using Playwright tools.
     */
    async autoApply(jobUrl: string, candidateProfile: any): Promise<boolean> {
        console.log(`Starting auto-apply for ${jobUrl}`);
        // TODO: Call playwright auto-applier tools here
        return true;
    }
}

export const createAgent = () => new JobHuntAgent();

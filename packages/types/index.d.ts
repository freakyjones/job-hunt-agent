import { z } from 'zod';
export declare enum JobStatus {
    PENDING = "PENDING",
    EVALUATED = "EVALUATED",
    NOTIFIED = "NOTIFIED",
    APPLYING = "APPLYING",
    APPLIED = "APPLIED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED",
    ERROR = "ERROR",
    REJECTED = "REJECTED"
}
export declare const JobStatusEnum: z.ZodNativeEnum<typeof JobStatus>;
export declare const JobSchema: z.ZodObject<{
    id: z.ZodString;
    company: z.ZodString;
    role: z.ZodString;
    url: z.ZodUnion<[z.ZodString, z.ZodOptional<z.ZodString>]>;
    score: z.ZodOptional<z.ZodNumber>;
    reasoning: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<typeof JobStatus>;
}, "strip", z.ZodTypeAny, {
    id: string;
    company: string;
    role: string;
    status: JobStatus;
    url?: string | undefined;
    score?: number | undefined;
    reasoning?: string | undefined;
}, {
    id: string;
    company: string;
    role: string;
    status: JobStatus;
    url?: string | undefined;
    score?: number | undefined;
    reasoning?: string | undefined;
}>;
export declare const EvaluationResultSchema: z.ZodObject<{
    score: z.ZodNumber;
    matchReason: z.ZodString;
    missingSkills: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    score: number;
    matchReason: string;
    missingSkills: string[];
}, {
    score: number;
    matchReason: string;
    missingSkills: string[];
}>;
export type Job = z.infer<typeof JobSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

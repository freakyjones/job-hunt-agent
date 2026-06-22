import { z } from 'zod';

export enum JobStatus {
    PENDING = 'PENDING',
    EVALUATED = 'EVALUATED',
    NOTIFIED = 'NOTIFIED',
    APPLYING = 'APPLYING',
    APPLIED = 'APPLIED',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
    ERROR = 'ERROR',
    REJECTED = 'REJECTED'
}

export const JobStatusEnum = z.nativeEnum(JobStatus);

export const JobSchema = z.object({
    id: z.string(),
    company: z.string(),
    role: z.string(),
    url: z.string().url().or(z.string().optional()),
    description: z.string().optional(),
    score: z.number().min(0).max(100).optional(),
    reasoning: z.string().optional(),
    status: JobStatusEnum
});

export const EvaluationResultSchema = z.object({
    score: z.number().min(0).max(100),
    matchReason: z.string(),
    missingSkills: z.array(z.string())
});

export type Job = z.infer<typeof JobSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

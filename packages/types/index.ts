import { z } from 'zod';

export enum JobStatus {
  PENDING = 'PENDING',
  EVALUATED = 'EVALUATED',
  ACCEPTED = 'ACCEPTED',
  APPLYING = 'APPLYING',
  APPLIED = 'APPLIED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  ERROR = 'ERROR',
  REJECTED = 'REJECTED',
  SAVED = 'SAVED',
}

export const JobStatusEnum = z.nativeEnum(JobStatus);

export const JobSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  url: z.string().url(),
  description: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  reasoning: z.string().optional(),
  status: JobStatusEnum,
});

export const EvaluationResultSchema = z.object({
  score: z.number().min(0).max(100),
  matchReason: z.string(),
  missingSkills: z.array(z.string()),
});

export type Job = z.infer<typeof JobSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const GeneratedResumeSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().nullable().optional(),
  content: z.string(),
  pdf_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  user_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type GeneratedResume = z.infer<typeof GeneratedResumeSchema>;

export const BaseResumeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  file_url: z.string(),
  extracted_content: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BaseResume = z.infer<typeof BaseResumeSchema>;

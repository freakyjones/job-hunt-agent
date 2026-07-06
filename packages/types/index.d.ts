import { z } from 'zod';
export declare enum JobStatus {
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
export declare const JobStatusEnum: z.ZodNativeEnum<typeof JobStatus>;
export declare const JobSchema: z.ZodObject<
  {
    id: z.ZodString;
    company: z.ZodString;
    role: z.ZodString;
    url: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    score: z.ZodOptional<z.ZodNumber>;
    reasoning: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<typeof JobStatus>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    company: string;
    role: string;
    url: string;
    status: JobStatus;
    description?: string | undefined;
    score?: number | undefined;
    reasoning?: string | undefined;
  },
  {
    id: string;
    company: string;
    role: string;
    url: string;
    status: JobStatus;
    description?: string | undefined;
    score?: number | undefined;
    reasoning?: string | undefined;
  }
>;
export declare const EvaluationResultSchema: z.ZodObject<
  {
    score: z.ZodNumber;
    matchReason: z.ZodString;
    missingSkills: z.ZodArray<z.ZodString, 'many'>;
  },
  'strip',
  z.ZodTypeAny,
  {
    score: number;
    matchReason: string;
    missingSkills: string[];
  },
  {
    score: number;
    matchReason: string;
    missingSkills: string[];
  }
>;
export type Job = z.infer<typeof JobSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
export declare const GeneratedResumeSchema: z.ZodObject<
  {
    id: z.ZodString;
    job_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodString;
    pdf_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    user_id: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    content: string;
    job_id?: string | null | undefined;
    pdf_url?: string | null | undefined;
    tags?: string[] | undefined;
    user_id?: string | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
  },
  {
    id: string;
    content: string;
    job_id?: string | null | undefined;
    pdf_url?: string | null | undefined;
    tags?: string[] | undefined;
    user_id?: string | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
  }
>;
export type GeneratedResume = z.infer<typeof GeneratedResumeSchema>;
export declare const BaseResumeSchema: z.ZodObject<
  {
    id: z.ZodString;
    user_id: z.ZodString;
    file_url: z.ZodString;
    extracted_content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    target_roles: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    user_id: string;
    file_url: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    extracted_content?: string | null | undefined;
    target_roles?: string[] | undefined;
  },
  {
    id: string;
    user_id: string;
    file_url: string;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    extracted_content?: string | null | undefined;
    target_roles?: string[] | undefined;
  }
>;
export type BaseResume = z.infer<typeof BaseResumeSchema>;
export declare const TargetCompanySchema: z.ZodObject<
  {
    id: z.ZodString;
    user_id: z.ZodString;
    company_name: z.ZodString;
    rss_feed_url: z.ZodString;
    created_at: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    user_id: string;
    company_name: string;
    rss_feed_url: string;
    created_at?: string | undefined;
  },
  {
    id: string;
    user_id: string;
    company_name: string;
    rss_feed_url: string;
    created_at?: string | undefined;
  }
>;
export type TargetCompany = z.infer<typeof TargetCompanySchema>;
export declare const CompanySignalSchema: z.ZodObject<
  {
    id: z.ZodString;
    company_id: z.ZodString;
    source_url: z.ZodString;
    title: z.ZodString;
    content_summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    published_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    company_id: string;
    source_url: string;
    title: string;
    created_at?: string | undefined;
    content_summary?: string | null | undefined;
    published_at?: string | null | undefined;
  },
  {
    id: string;
    company_id: string;
    source_url: string;
    title: string;
    created_at?: string | undefined;
    content_summary?: string | null | undefined;
    published_at?: string | null | undefined;
  }
>;
export type CompanySignal = z.infer<typeof CompanySignalSchema>;
export declare enum NetworkingLeadStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  SENT = 'SENT',
}
export declare const NetworkingLeadStatusEnum: z.ZodNativeEnum<typeof NetworkingLeadStatus>;
export declare const NetworkingLeadSchema: z.ZodObject<
  {
    id: z.ZodString;
    user_id: z.ZodString;
    signal_id: z.ZodString;
    contact_name: z.ZodString;
    contact_role: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    draft_message: z.ZodString;
    status: z.ZodNativeEnum<typeof NetworkingLeadStatus>;
    created_at: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    status: NetworkingLeadStatus;
    user_id: string;
    signal_id: string;
    contact_name: string;
    draft_message: string;
    created_at?: string | undefined;
    contact_role?: string | null | undefined;
  },
  {
    id: string;
    status: NetworkingLeadStatus;
    user_id: string;
    signal_id: string;
    contact_name: string;
    draft_message: string;
    created_at?: string | undefined;
    contact_role?: string | null | undefined;
  }
>;
export type NetworkingLead = z.infer<typeof NetworkingLeadSchema>;
export declare enum ExamStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}
export declare const ExamStatusEnum: z.ZodNativeEnum<typeof ExamStatus>;
export declare const ExamSchema: z.ZodObject<
  {
    id: z.ZodString;
    user_id: z.ZodString;
    job_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodNativeEnum<typeof ExamStatus>;
    score: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    created_at: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    status: ExamStatus;
    user_id: string;
    score?: number | null | undefined;
    job_id?: string | null | undefined;
    created_at?: string | undefined;
  },
  {
    id: string;
    status: ExamStatus;
    user_id: string;
    score?: number | null | undefined;
    job_id?: string | null | undefined;
    created_at?: string | undefined;
  }
>;
export type Exam = z.infer<typeof ExamSchema>;
export declare const ExamQuestionSchema: z.ZodObject<
  {
    id: z.ZodString;
    exam_id: z.ZodString;
    question_text: z.ZodString;
    options: z.ZodArray<z.ZodString, 'many'>;
    created_at: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    options: string[];
    exam_id: string;
    question_text: string;
    created_at?: string | undefined;
  },
  {
    id: string;
    options: string[];
    exam_id: string;
    question_text: string;
    created_at?: string | undefined;
  }
>;
export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export declare const ExamAnswerSchema: z.ZodObject<
  {
    question_id: z.ZodString;
    correct_option: z.ZodString;
    explanation: z.ZodString;
    created_at: z.ZodOptional<z.ZodString>;
  },
  'strip',
  z.ZodTypeAny,
  {
    question_id: string;
    correct_option: string;
    explanation: string;
    created_at?: string | undefined;
  },
  {
    question_id: string;
    correct_option: string;
    explanation: string;
    created_at?: string | undefined;
  }
>;
export type ExamAnswer = z.infer<typeof ExamAnswerSchema>;
export declare const SubmitExamPayloadSchema: z.ZodArray<
  z.ZodObject<
    {
      question_id: z.ZodString;
      selected_option: z.ZodString;
    },
    'strip',
    z.ZodTypeAny,
    {
      question_id: string;
      selected_option: string;
    },
    {
      question_id: string;
      selected_option: string;
    }
  >,
  'many'
>;
export type SubmitExamPayload = z.infer<typeof SubmitExamPayloadSchema>;

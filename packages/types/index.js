'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SubmitExamPayloadSchema =
  exports.ExamAnswerSchema =
  exports.ExamQuestionSchema =
  exports.ExamSchema =
  exports.ExamStatusEnum =
  exports.ExamStatus =
  exports.NetworkingLeadSchema =
  exports.NetworkingLeadStatusEnum =
  exports.NetworkingLeadStatus =
  exports.CompanySignalSchema =
  exports.TargetCompanySchema =
  exports.BaseResumeSchema =
  exports.GeneratedResumeSchema =
  exports.EvaluationResultSchema =
  exports.JobSchema =
  exports.JobStatusEnum =
  exports.JobStatus =
    void 0;
const zod_1 = require('zod');
var JobStatus;
(function (JobStatus) {
  JobStatus['PENDING'] = 'PENDING';
  JobStatus['EVALUATED'] = 'EVALUATED';
  JobStatus['ACCEPTED'] = 'ACCEPTED';
  JobStatus['APPLYING'] = 'APPLYING';
  JobStatus['APPLIED'] = 'APPLIED';
  JobStatus['FAILED'] = 'FAILED';
  JobStatus['SKIPPED'] = 'SKIPPED';
  JobStatus['ERROR'] = 'ERROR';
  JobStatus['REJECTED'] = 'REJECTED';
  JobStatus['SAVED'] = 'SAVED';
})(JobStatus || (exports.JobStatus = JobStatus = {}));
exports.JobStatusEnum = zod_1.z.nativeEnum(JobStatus);
exports.JobSchema = zod_1.z.object({
  id: zod_1.z.string(),
  company: zod_1.z.string(),
  role: zod_1.z.string(),
  url: zod_1.z.string().url(),
  description: zod_1.z.string().optional(),
  score: zod_1.z.number().min(0).max(100).optional(),
  reasoning: zod_1.z.string().optional(),
  status: exports.JobStatusEnum,
});
exports.EvaluationResultSchema = zod_1.z.object({
  score: zod_1.z.number().min(0).max(100),
  matchReason: zod_1.z.string(),
  missingSkills: zod_1.z.array(zod_1.z.string()),
});
exports.GeneratedResumeSchema = zod_1.z.object({
  id: zod_1.z.string().uuid(),
  job_id: zod_1.z.string().nullable().optional(),
  content: zod_1.z.string(),
  pdf_url: zod_1.z.string().url().nullable().optional(),
  tags: zod_1.z.array(zod_1.z.string()).optional(),
  user_id: zod_1.z.string().uuid().optional(),
  created_at: zod_1.z.string().optional(),
  updated_at: zod_1.z.string().optional(),
});
exports.BaseResumeSchema = zod_1.z.object({
  id: zod_1.z.string().uuid(),
  user_id: zod_1.z.string().uuid(),
  file_url: zod_1.z.string(),
  extracted_content: zod_1.z.string().nullable().optional(),
  target_roles: zod_1.z.array(zod_1.z.string()).optional(),
  created_at: zod_1.z.string().optional(),
  updated_at: zod_1.z.string().optional(),
});
exports.TargetCompanySchema = zod_1.z.object({
  id: zod_1.z.string().uuid(),
  user_id: zod_1.z.string().uuid(),
  company_name: zod_1.z.string(),
  rss_feed_url: zod_1.z.string().url(),
  created_at: zod_1.z.string().optional(),
});
exports.CompanySignalSchema = zod_1.z.object({
  id: zod_1.z.string().uuid(),
  company_id: zod_1.z.string().uuid(),
  source_url: zod_1.z.string().url(),
  title: zod_1.z.string(),
  content_summary: zod_1.z.string().nullable().optional(),
  published_at: zod_1.z.string().nullable().optional(),
  created_at: zod_1.z.string().optional(),
});
var NetworkingLeadStatus;
(function (NetworkingLeadStatus) {
  NetworkingLeadStatus['PENDING'] = 'PENDING';
  NetworkingLeadStatus['REVIEWED'] = 'REVIEWED';
  NetworkingLeadStatus['SENT'] = 'SENT';
})(NetworkingLeadStatus || (exports.NetworkingLeadStatus = NetworkingLeadStatus = {}));
exports.NetworkingLeadStatusEnum = zod_1.z.nativeEnum(NetworkingLeadStatus);
exports.NetworkingLeadSchema = zod_1.z.object({
  id: zod_1.z.string().uuid(),
  user_id: zod_1.z.string().uuid(),
  signal_id: zod_1.z.string().uuid(),
  contact_name: zod_1.z.string(),
  contact_role: zod_1.z.string().nullable().optional(),
  draft_message: zod_1.z.string(),
  status: exports.NetworkingLeadStatusEnum,
  created_at: zod_1.z.string().optional(),
});
var ExamStatus;
(function (ExamStatus) {
  ExamStatus['PENDING'] = 'PENDING';
  ExamStatus['COMPLETED'] = 'COMPLETED';
})(ExamStatus || (exports.ExamStatus = ExamStatus = {}));
exports.ExamStatusEnum = zod_1.z.nativeEnum(ExamStatus);
exports.ExamSchema = zod_1.z.object({
  id: zod_1.z.string().uuid(),
  user_id: zod_1.z.string().uuid(),
  job_id: zod_1.z.string().nullable().optional(),
  status: exports.ExamStatusEnum,
  score: zod_1.z.number().nullable().optional(),
  created_at: zod_1.z.string().optional(),
});
exports.ExamQuestionSchema = zod_1.z.object({
  id: zod_1.z.string().uuid(),
  exam_id: zod_1.z.string().uuid(),
  question_text: zod_1.z.string(),
  options: zod_1.z.array(zod_1.z.string()),
  created_at: zod_1.z.string().optional(),
});
exports.ExamAnswerSchema = zod_1.z.object({
  question_id: zod_1.z.string().uuid(),
  correct_option: zod_1.z.string(),
  explanation: zod_1.z.string(),
  created_at: zod_1.z.string().optional(),
});
// Input schema for submitting an exam
exports.SubmitExamPayloadSchema = zod_1.z.array(
  zod_1.z.object({
    question_id: zod_1.z.string().uuid(),
    selected_option: zod_1.z.string(),
  })
);

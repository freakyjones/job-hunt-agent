"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationResultSchema = exports.JobSchema = exports.JobStatusEnum = exports.JobStatus = void 0;
const zod_1 = require("zod");
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "PENDING";
    JobStatus["EVALUATED"] = "EVALUATED";
    JobStatus["NOTIFIED"] = "NOTIFIED";
    JobStatus["APPLYING"] = "APPLYING";
    JobStatus["APPLIED"] = "APPLIED";
    JobStatus["FAILED"] = "FAILED";
    JobStatus["SKIPPED"] = "SKIPPED";
    JobStatus["ERROR"] = "ERROR";
    JobStatus["REJECTED"] = "REJECTED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
exports.JobStatusEnum = zod_1.z.nativeEnum(JobStatus);
exports.JobSchema = zod_1.z.object({
    id: zod_1.z.string(),
    company: zod_1.z.string(),
    role: zod_1.z.string(),
    url: zod_1.z.string().url().or(zod_1.z.string().optional()),
    score: zod_1.z.number().min(0).max(100).optional(),
    reasoning: zod_1.z.string().optional(),
    status: exports.JobStatusEnum
});
exports.EvaluationResultSchema = zod_1.z.object({
    score: zod_1.z.number().min(0).max(100),
    matchReason: zod_1.z.string(),
    missingSkills: zod_1.z.array(zod_1.z.string())
});

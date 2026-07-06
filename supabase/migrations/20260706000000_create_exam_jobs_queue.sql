CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS exam_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
    status job_status DEFAULT 'pending',
    attempts INT DEFAULT 0,
    exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queue polling
CREATE INDEX IF NOT EXISTS idx_exam_jobs_pending ON exam_generation_jobs(created_at) WHERE status = 'pending';

-- Enable Realtime for this table
-- This is necessary so the frontend can listen for changes.
ALTER PUBLICATION supabase_realtime ADD TABLE exam_generation_jobs;

-- Enable RLS
ALTER TABLE exam_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own jobs (to listen for status changes)
CREATE POLICY "Users can view their own exam jobs" 
    ON exam_generation_jobs FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can insert their own exam jobs" 
    ON exam_generation_jobs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Claim function
CREATE OR REPLACE FUNCTION claim_exam_jobs(batch_size INT)
RETURNS TABLE (
    id UUID, 
    user_id UUID,
    job_id TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE exam_generation_jobs
  SET 
    status = 'processing', 
    updated_at = now(), 
    attempts = attempts + 1
  WHERE exam_generation_jobs.id IN (
    SELECT j.id
    FROM exam_generation_jobs j
    WHERE j.status = 'pending'
    ORDER BY j.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT batch_size
  )
  RETURNING exam_generation_jobs.id, exam_generation_jobs.user_id, exam_generation_jobs.job_id;
END;
$$;

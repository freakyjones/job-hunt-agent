CREATE TYPE public.job_status AS ENUM (
    'PENDING',
    'EVALUATED',
    'ACCEPTED',
    'APPLYING',
    'APPLIED',
    'FAILED',
    'SKIPPED',
    'ERROR',
    'REJECTED',
    'SAVED'
);

CREATE TABLE public.jobs (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    url TEXT,
    description TEXT,
    score INTEGER,
    reasoning TEXT,
    status public.job_status NOT NULL DEFAULT 'PENDING',
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user lookups
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);

-- RLS Policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own jobs" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their jobs" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.generated_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT REFERENCES public.jobs(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    pdf_url TEXT,
    tags TEXT[],
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster queries when loading a job's resume
CREATE INDEX idx_generated_resumes_job_id ON public.generated_resumes(job_id);
-- Index for user lookups
CREATE INDEX idx_generated_resumes_user_id ON public.generated_resumes(user_id);

-- RLS Policies
ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own generated resumes" ON public.generated_resumes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert generated resumes" ON public.generated_resumes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their generated resumes" ON public.generated_resumes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their generated resumes" ON public.generated_resumes FOR DELETE TO authenticated USING (auth.uid() = user_id);

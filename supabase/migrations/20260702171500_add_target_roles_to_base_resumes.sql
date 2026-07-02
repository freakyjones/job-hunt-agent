-- Add target_roles column to base_resumes
ALTER TABLE public.base_resumes ADD COLUMN target_roles JSONB DEFAULT '[]'::jsonb;

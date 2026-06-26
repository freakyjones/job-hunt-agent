-- Create base_resumes table
CREATE TABLE IF NOT EXISTS public.base_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    file_url TEXT NOT NULL,
    extracted_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.base_resumes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own base resume"
ON public.base_resumes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own base resume"
ON public.base_resumes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own base resume"
ON public.base_resumes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own base resume"
ON public.base_resumes FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for base resumes if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'base_resumes',
    'base_resumes',
    false,
    5242880, -- 5MB limit
    ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for base_resumes bucket
CREATE POLICY "Users can upload their own base resume file"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'base_resumes' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own base resume file"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'base_resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own base resume file"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'base_resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own base resume file"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'base_resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

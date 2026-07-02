-- Drop the existing unique constraint on url
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_url_key;

-- Add a new composite unique constraint on (user_id, url)
ALTER TABLE public.jobs ADD CONSTRAINT jobs_user_id_url_key UNIQUE (user_id, url);

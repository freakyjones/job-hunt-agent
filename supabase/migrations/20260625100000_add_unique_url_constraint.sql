-- Add a unique constraint to the URL column for robust deduplication.
-- Note: Postgres allows multiple NULL values in a UNIQUE column, so manual entries without URLs are unaffected.
ALTER TABLE public.jobs ADD CONSTRAINT jobs_url_key UNIQUE (url);

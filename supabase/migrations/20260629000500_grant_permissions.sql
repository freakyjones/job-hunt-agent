-- Grant ALL privileges strictly to admin roles on all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Grant table-specific CRUD privileges to authenticated users only for the tables they need
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.resumes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.generated_resumes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.base_resumes TO authenticated;
GRANT SELECT ON TABLE public.github_workflow_runs TO authenticated;

-- Grant standard permissions on sequences and functions
GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Configure default privileges for future tables strictly for admin roles (secure by default)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;

-- Enable REPLICA IDENTITY FULL for Realtime DELETE RLS verification
ALTER TABLE public.jobs REPLICA IDENTITY FULL;
ALTER TABLE public.github_workflow_runs REPLICA IDENTITY FULL;

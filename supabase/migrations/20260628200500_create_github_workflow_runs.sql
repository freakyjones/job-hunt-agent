CREATE TABLE IF NOT EXISTS github_workflow_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    run_id BIGINT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    conclusion TEXT,
    workflow_name TEXT,
    trigger_command TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE github_workflow_runs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can all github_workflow_runs" ON github_workflow_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can select github_workflow_runs" ON github_workflow_runs FOR SELECT TO authenticated USING (true);

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE github_workflow_runs;

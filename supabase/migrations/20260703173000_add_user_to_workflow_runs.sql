-- Add new columns
ALTER TABLE github_workflow_runs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE github_workflow_runs ADD COLUMN IF NOT EXISTS dismissed BOOLEAN DEFAULT false;

-- Drop permissive select policy
DROP POLICY IF EXISTS "Authenticated users can select github_workflow_runs" ON github_workflow_runs;

-- Create strict select policy
CREATE POLICY "Authenticated users can select own github_workflow_runs" ON github_workflow_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Note: No UPDATE policy for authenticated users.
-- We will use the service_role key to bypass RLS when dismissing workflows.

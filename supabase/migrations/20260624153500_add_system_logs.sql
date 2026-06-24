CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
-- Only service role can insert/select (no public access)
CREATE POLICY "Service role can insert system_logs" ON system_logs FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can select system_logs" ON system_logs FOR SELECT TO service_role USING (true);

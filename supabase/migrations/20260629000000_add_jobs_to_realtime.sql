-- Add the jobs table to the supabase_realtime publication to enable Realtime listening
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;

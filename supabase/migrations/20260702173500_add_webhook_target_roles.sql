-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.trigger_extract_target_roles()
RETURNS trigger AS $$
BEGIN
  -- We only want to trigger this if extracted_content is present
  IF NEW.extracted_content IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://mcwarivltkjplzezkvgu.supabase.co/functions/v1/extract-target-roles',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW),
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
      )::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_base_resumes_extract_roles ON public.base_resumes;

-- Create the trigger
CREATE TRIGGER on_base_resumes_extract_roles
  AFTER INSERT OR UPDATE OF extracted_content ON public.base_resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_extract_target_roles();

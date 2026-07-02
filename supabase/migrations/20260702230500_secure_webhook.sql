-- Update the trigger function to include a secret header
CREATE OR REPLACE FUNCTION public.trigger_extract_target_roles()
RETURNS trigger AS $$
BEGIN
  -- We only want to trigger this if extracted_content is present
  IF NEW.extracted_content IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://mcwarivltkjplzezkvgu.supabase.co/functions/v1/extract-target-roles',
      headers := '{"Content-Type": "application/json", "x-webhook-secret": "job-hunt-agent-webhook-secret-2026"}'::jsonb,
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

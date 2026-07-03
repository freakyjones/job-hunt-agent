-- Create user action limits table
CREATE TABLE public.user_action_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_date DATE NOT NULL DEFAULT CURRENT_DATE,
    trigger_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, action_date)
);

-- Enable RLS
ALTER TABLE public.user_action_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their own limits
CREATE POLICY "Users can view their own action limits"
    ON public.user_action_limits FOR SELECT
    USING (auth.uid() = user_id);

-- Create RPC for atomic increment with daily limit
CREATE OR REPLACE FUNCTION public.increment_action_limit()
RETURNS public.user_action_limits
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS for insert/update
AS $$
DECLARE
    result public.user_action_limits;
    v_user_id UUID;
BEGIN
    -- Get current authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.user_action_limits (user_id, action_date, trigger_count)
    VALUES (v_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, action_date) 
    DO UPDATE SET 
        trigger_count = user_action_limits.trigger_count + 1,
        updated_at = NOW()
    WHERE user_action_limits.trigger_count < 2
    RETURNING * INTO result;

    -- If result is null, it means the row existed but trigger_count was >= 2 (so the WHERE clause failed and no update occurred)
    RETURN result;
END;
$$;

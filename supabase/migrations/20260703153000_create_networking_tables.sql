-- Target Companies
CREATE TABLE public.target_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    rss_feed_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Signals
CREATE TABLE public.company_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.target_companies(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content_summary TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Networking Leads
CREATE TYPE public.networking_lead_status AS ENUM ('PENDING', 'REVIEWED', 'SENT');

CREATE TABLE public.networking_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_id UUID NOT NULL REFERENCES public.company_signals(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_role TEXT,
    draft_message TEXT NOT NULL,
    status public.networking_lead_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for target_companies
ALTER TABLE public.target_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own target companies"
    ON public.target_companies FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own target companies"
    ON public.target_companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own target companies"
    ON public.target_companies FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own target companies"
    ON public.target_companies FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for company_signals
ALTER TABLE public.company_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signals for their target companies"
    ON public.company_signals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.target_companies
            WHERE id = company_signals.company_id AND user_id = auth.uid()
        )
    );

-- RLS for networking_leads
ALTER TABLE public.networking_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own networking leads"
    ON public.networking_leads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own networking leads"
    ON public.networking_leads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own networking leads"
    ON public.networking_leads FOR DELETE
    USING (auth.uid() = user_id);

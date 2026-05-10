-- Create support_requests table (if not exists)
CREATE TABLE IF NOT EXISTS public.support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    requested_item TEXT NOT NULL,
    details TEXT NOT NULL,
    context_analyzed JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own support requests') THEN
        CREATE POLICY "Users can create their own support requests"
            ON public.support_requests
            FOR INSERT
            WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own support requests') THEN
        CREATE POLICY "Users can view their own support requests"
            ON public.support_requests
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view all support requests for now') THEN
        -- Simplified for now as profiles doesn't have a direct 'role' column 
        -- and we want to ensure the CRM can be viewed by authorized persons
        CREATE POLICY "Anyone can view all support requests for now"
            ON public.support_requests
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.support_requests;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.support_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
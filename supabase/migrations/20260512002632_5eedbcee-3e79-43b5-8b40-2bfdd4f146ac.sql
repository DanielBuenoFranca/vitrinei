DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_requests' AND column_name='explanation') THEN
        ALTER TABLE public.support_requests ADD COLUMN explanation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_requests' AND column_name='context_analysis') THEN
        ALTER TABLE public.support_requests ADD COLUMN context_analysis TEXT;
    END IF;
END $$;

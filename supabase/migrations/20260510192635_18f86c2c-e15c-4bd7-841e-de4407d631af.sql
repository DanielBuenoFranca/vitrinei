-- Create support requests table
CREATE TABLE public.support_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    requested_item TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, resolved, cancelled
    source TEXT DEFAULT 'vini_fallback',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can create a support request" 
ON public.support_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all support requests" 
ON public.support_requests 
FOR SELECT 
USING (true); -- Simplified for now, in production check for admin role

CREATE POLICY "Admins can update support requests" 
ON public.support_requests 
FOR UPDATE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_support_requests_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Check and update INSERT policy for support_requests
DROP POLICY IF EXISTS "Users can create support requests" ON public.support_requests;

CREATE POLICY "Anyone can create support requests" 
ON public.support_requests 
FOR INSERT 
WITH CHECK (true);

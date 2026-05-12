-- Allow anyone to see referral codes and their referrer IDs
CREATE POLICY "Referral codes are public" 
ON public.referrals 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow anyone to see basic profile display names
CREATE POLICY "Public profiles are viewable" 
ON public.profiles 
FOR SELECT 
TO anon, authenticated
USING (true);
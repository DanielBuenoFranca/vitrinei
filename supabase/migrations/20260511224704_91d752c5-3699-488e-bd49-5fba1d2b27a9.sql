CREATE TABLE public.user_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  is_used BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.user_activations ENABLE ROW LEVEL SECURITY;

-- Policies for Master users
CREATE POLICY "Master profiles can view all activations"
ON public.user_activations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'master'
  )
);

CREATE POLICY "Master profiles can manage activations"
ON public.user_activations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'master'
  )
);

-- Allow service role to do everything
CREATE POLICY "Service role can manage activations"
ON public.user_activations
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to generate a random 6-digit PIN
CREATE OR REPLACE FUNCTION public.generate_random_pin()
RETURNS TEXT AS $$
DECLARE
  pin TEXT;
BEGIN
  pin := lpad(floor(random() * 1000000)::text, 6, '0');
  RETURN pin;
END;
$$ LANGUAGE plpgsql;

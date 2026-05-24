-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activation_code TEXT,
ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'lead';

-- Add index for activation_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_activation_code ON public.profiles(activation_code);

-- Update existing profiles to be activated by default (optional, but good for existing users)
UPDATE public.profiles SET is_activated = TRUE, status = 'active' WHERE is_activated IS NULL;


-- Add cpf_cnpj column with unique constraint
ALTER TABLE public.providers ADD COLUMN cpf_cnpj text UNIQUE;

-- Convert segment from text to text array
ALTER TABLE public.providers ALTER COLUMN segment TYPE text[] USING ARRAY[segment];

-- Add age verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_id_verified boolean DEFAULT false,
ADD COLUMN id_verification_date timestamp with time zone,
ADD COLUMN id_verification_data jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_id_verified IS 'Whether user has completed ID verification for age confirmation';
COMMENT ON COLUMN public.profiles.id_verification_date IS 'When ID verification was completed';
COMMENT ON COLUMN public.profiles.id_verification_data IS 'Encrypted verification metadata (no personal ID data stored)';
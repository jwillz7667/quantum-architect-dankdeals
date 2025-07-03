-- supabase/migrations/20250703000004-remove-id-verification.sql

-- Drop ID verification related columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS is_id_verified,
DROP COLUMN IF EXISTS birth_date;

-- Drop ID documents table
DROP TABLE IF EXISTS public."id-documents" CASCADE;

-- Drop ID documents storage bucket and policies
DO $$
BEGIN
  -- Delete storage policies for id-documents bucket
  DELETE FROM storage.policies WHERE bucket_id = 'id-documents';
  
  -- Delete the bucket
  DELETE FROM storage.buckets WHERE id = 'id-documents';
  
  -- Delete any objects that might be in the bucket
  DELETE FROM storage.objects WHERE bucket_id = 'id-documents';
  
EXCEPTION
  WHEN OTHERS THEN
    -- If deletion fails, just log it
    RAISE NOTICE 'Could not delete id-documents bucket: %', SQLERRM;
END;
$$; 
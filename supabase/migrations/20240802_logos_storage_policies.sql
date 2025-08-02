-- Create storage policies for logos bucket
-- This ensures public read access for all logo files

-- Enable public read access for logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) 
DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];

-- Create policy to allow public read access
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');

-- Create policy to allow authenticated users to upload/update logos (admin only)
CREATE POLICY IF NOT EXISTS "Admin Upload" ON storage.objects
  FOR INSERT TO authenticated
  USING (
    bucket_id = 'logos' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create policy to allow authenticated admins to update logos
CREATE POLICY IF NOT EXISTS "Admin Update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create policy to allow authenticated admins to delete logos
CREATE POLICY IF NOT EXISTS "Admin Delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
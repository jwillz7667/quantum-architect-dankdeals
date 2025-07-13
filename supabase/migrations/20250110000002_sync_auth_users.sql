-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert existing auth users into profiles table
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Set admin privileges for the main admin email
UPDATE profiles SET is_admin = true WHERE email = 'admin@dankdealsmn.com'; 
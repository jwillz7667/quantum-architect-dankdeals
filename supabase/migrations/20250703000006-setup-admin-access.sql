-- Ensure admin user is properly set up
-- This will create or update the admin profile when admin@dankdealsmn.com signs up

-- Function to handle admin user setup
CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'admin@dankdealsmn.com' THEN
    -- Insert or update the admin profile
    INSERT INTO public.profiles (user_id, role, first_name, last_name, email)
    VALUES (
      NEW.id, 
      'admin',
      'Admin',
      'User',
      NEW.email
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      first_name = COALESCE(profiles.first_name, 'Admin'),
      last_name = COALESCE(profiles.last_name, 'User'),
      email = NEW.email,
      updated_at = now();
  ELSE
    -- For regular users, create profile with default role
    INSERT INTO public.profiles (user_id, first_name, last_name, email)
    VALUES (
      NEW.id, 
      NEW.raw_user_meta_data ->> 'first_name', 
      NEW.raw_user_meta_data ->> 'last_name',
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.setup_admin_user();

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 
    AND role = 'admin'
  );
$$;

-- Add email column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Add RLS policy for admins to access all profiles
CREATE POLICY "Admins can access all profiles" ON public.profiles
  FOR ALL USING (
    public.is_admin(auth.uid())
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.vendors TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.product_variants TO authenticated; 
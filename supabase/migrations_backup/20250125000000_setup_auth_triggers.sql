-- Setup auth triggers and functions for profile management

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email in profiles if it changed
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles 
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync user email updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Update existing admin user if exists (for development)
-- This safely checks if the admin user exists before updating
DO $$
BEGIN
  -- Check if admin user exists and update their profile
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@dankdealsmn.com') THEN
    UPDATE public.profiles 
    SET 
      first_name = 'Admin',
      last_name = 'User',
      age_verified = true,
      age_verified_at = NOW(),
      updated_at = NOW()
    WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@dankdealsmn.com');
    
    -- Add admin metadata to auth.users
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_build_object('is_admin', true, 'first_name', 'Admin', 'last_name', 'User')
    WHERE email = 'admin@dankdealsmn.com';
  END IF;
END $$;
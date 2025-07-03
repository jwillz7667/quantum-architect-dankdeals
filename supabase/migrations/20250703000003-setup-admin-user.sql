-- supabase/migrations/20250703000003-setup-admin-user.sql

-- Create a trigger function to automatically set admin role for the designated admin email
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the email is the designated admin email
  IF NEW.email = 'admin@dankdealsmn.com' THEN
    -- Wait a moment for the profile to be created
    PERFORM pg_sleep(0.1);
    
    -- Update the profile to have admin role
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-assign admin role
CREATE TRIGGER assign_admin_role_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_admin_role();

-- If the admin user already exists, update their role
UPDATE public.profiles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@dankdealsmn.com'
);

-- Create a function to validate admin role assignment
CREATE OR REPLACE FUNCTION public.validate_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  -- Only check if setting role to admin
  IF NEW.role = 'admin' THEN
    -- Get the user's email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Check if it's the authorized admin email
    IF user_email != 'admin@dankdealsmn.com' THEN
      RAISE EXCEPTION 'Admin role can only be assigned to admin@dankdealsmn.com';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate admin role assignments
CREATE TRIGGER validate_admin_role_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_admin_role(); 
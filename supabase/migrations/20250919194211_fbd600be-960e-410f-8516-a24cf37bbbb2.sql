-- Fix OAuth user profile creation and ensure proper auth state management

-- Update the handle_new_user function to be more robust for OAuth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
BEGIN
  -- Insert profile for new user, extracting data from OAuth metadata if available
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'given_name', 
      NEW.raw_user_meta_data->>'name'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'family_name'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW()
  WHERE profiles.first_name IS NULL OR profiles.last_name IS NULL;

  -- Create default user preferences for new user
  INSERT INTO public.user_preferences (
    user_id,
    email_notifications,
    sms_notifications, 
    push_notifications,
    marketing_emails,
    dark_mode,
    two_factor_enabled,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,   -- email_notifications
    true,   -- sms_notifications  
    false,  -- push_notifications
    false,  -- marketing_emails
    false,  -- dark_mode
    false,  -- two_factor_enabled
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to get user profile with preferences and addresses
CREATE OR REPLACE FUNCTION public.get_user_profile_data(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  profile_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  age_verified BOOLEAN,
  age_verified_at TIMESTAMP WITH TIME ZONE,
  marketing_consent BOOLEAN,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  role TEXT,
  preferences JSONB,
  addresses JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.date_of_birth,
    p.age_verified,
    p.age_verified_at,
    p.marketing_consent,
    p.terms_accepted_at,
    p.role,
    -- Get user preferences as JSONB
    COALESCE(
      jsonb_build_object(
        'email_notifications', up.email_notifications,
        'sms_notifications', up.sms_notifications,
        'push_notifications', up.push_notifications,
        'marketing_emails', up.marketing_emails,
        'dark_mode', up.dark_mode,
        'two_factor_enabled', up.two_factor_enabled
      ),
      '{}'::jsonb
    ) as preferences,
    -- Get all user addresses as JSONB array
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'first_name', a.first_name,
            'last_name', a.last_name,
            'street_address', a.street_address,
            'apartment', a.apartment,
            'city', a.city,
            'state', a.state,
            'zip_code', a.zip_code,
            'phone', a.phone,
            'type', a.type,
            'label', a.label,
            'is_default', a.is_default,
            'delivery_instructions', a.delivery_instructions
          )
        )
        FROM public.addresses a 
        WHERE a.user_id = user_uuid
      ),
      '[]'::jsonb
    ) as addresses
  FROM public.profiles p
  LEFT JOIN public.user_preferences up ON p.id = up.user_id
  WHERE p.id = user_uuid;
END;
$$;
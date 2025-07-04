-- Create admin_roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'support')),
    permissions JSONB DEFAULT '{"products": true, "orders": true, "users": false, "analytics": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_admin_roles_updated_at
    BEFORE UPDATE ON public.admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only super admins can view all admin roles
CREATE POLICY "Super admins can view all admin roles" ON public.admin_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid()
            AND ar.role = 'super_admin'
            AND ar.is_active = true
        )
    );

-- Admins can view their own role
CREATE POLICY "Admins can view own role" ON public.admin_roles
    FOR SELECT
    USING (user_id = auth.uid());

-- Only super admins can insert new admin roles
CREATE POLICY "Super admins can create admin roles" ON public.admin_roles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid()
            AND ar.role = 'super_admin'
            AND ar.is_active = true
        )
    );

-- Only super admins can update admin roles
CREATE POLICY "Super admins can update admin roles" ON public.admin_roles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid()
            AND ar.role = 'super_admin'
            AND ar.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid()
            AND ar.role = 'super_admin'
            AND ar.is_active = true
        )
    );

-- Only super admins can delete admin roles
CREATE POLICY "Super admins can delete admin roles" ON public.admin_roles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid()
            AND ar.role = 'super_admin'
            AND ar.is_active = true
        )
    );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = check_user_id
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION public.get_admin_permissions(check_user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permissions INTO user_permissions
    FROM public.admin_roles
    WHERE user_id = check_user_id
    AND is_active = true
    LIMIT 1;
    
    RETURN COALESCE(user_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX idx_admin_roles_user_id ON public.admin_roles(user_id);
CREATE INDEX idx_admin_roles_email ON public.admin_roles(email);
CREATE INDEX idx_admin_roles_role ON public.admin_roles(role) WHERE is_active = true;

-- Migrate existing admin (from environment variable in app)
-- This will be done via a separate seed script that reads from env
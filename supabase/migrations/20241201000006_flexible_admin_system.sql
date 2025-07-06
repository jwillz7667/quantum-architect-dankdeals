-- Migration: Flexible Admin System
-- Description: Replace hardcoded admin email with flexible admin table and RLS

-- Create admins table for managing admin users
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    permissions JSONB DEFAULT '{"orders": true, "products": true, "users": true, "analytics": true}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_admin_user UNIQUE(user_id)
);

-- Create index for performance
CREATE INDEX idx_admins_email ON public.admins(email);
CREATE INDEX idx_admins_user_id ON public.admins(user_id);
CREATE INDEX idx_admins_active ON public.admins(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins table

-- Admins can read all admin records
CREATE POLICY "Admins can view all admins" ON public.admins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.user_id = auth.uid()
            AND a.is_active = true
        )
    );

-- Only super admins can insert new admins
CREATE POLICY "Super admins can create admins" ON public.admins
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.user_id = auth.uid()
            AND a.role = 'super_admin'
            AND a.is_active = true
        )
    );

-- Only super admins can update admins
CREATE POLICY "Super admins can update admins" ON public.admins
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.user_id = auth.uid()
            AND a.role = 'super_admin'
            AND a.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.user_id = auth.uid()
            AND a.role = 'super_admin'
            AND a.is_active = true
        )
    );

-- Only super admins can deactivate (soft delete) admins
CREATE POLICY "Super admins can deactivate admins" ON public.admins
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.user_id = auth.uid()
            AND a.role = 'super_admin'
            AND a.is_active = true
        )
    );

-- Create function to check if user is admin (replaces hardcoded check)
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = check_user_id
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT role INTO admin_role
    FROM public.admins
    WHERE user_id = check_user_id
    AND is_active = true
    LIMIT 1;
    
    RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin permissions
CREATE OR REPLACE FUNCTION public.get_admin_permissions(check_user_id UUID DEFAULT auth.uid())
RETURNS JSONB AS $$
DECLARE
    admin_permissions JSONB;
BEGIN
    SELECT permissions INTO admin_permissions
    FROM public.admins
    WHERE user_id = check_user_id
    AND is_active = true
    LIMIT 1;
    
    RETURN COALESCE(admin_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admins_updated_at();

-- Migrate existing admin from environment variable
-- This creates the initial super admin based on the configured email
DO $$
DECLARE
    admin_email TEXT;
    admin_user_id UUID;
BEGIN
    -- Get the admin email from app configuration
    -- In production, this would come from your environment variable
    admin_email := 'admin@dankdealsmn.com';
    
    -- Find the user with this email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;
    
    -- If user exists, make them a super admin
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.admins (user_id, email, role, permissions)
        VALUES (
            admin_user_id,
            admin_email,
            'super_admin',
            '{"orders": true, "products": true, "users": true, "analytics": true, "settings": true, "admins": true}'::jsonb
        )
        ON CONFLICT (email) DO UPDATE
        SET role = 'super_admin',
            is_active = true,
            permissions = '{"orders": true, "products": true, "users": true, "analytics": true, "settings": true, "admins": true}'::jsonb;
    END IF;
END $$;

-- Update existing RLS policies to use the new admin check function
-- This would need to be done for each table that has admin-specific policies

-- Add a comment explaining the migration
COMMENT ON TABLE public.admins IS 'Flexible admin management table replacing hardcoded admin emails. Supports multiple admins with role-based permissions.'; 
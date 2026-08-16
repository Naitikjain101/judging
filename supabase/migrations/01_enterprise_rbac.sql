-- 01_enterprise_rbac.sql
-- Migration to introduce Enterprise RBAC

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
('Super Admin', 'Full access to all hackathons and platform settings'),
('Organizer', 'Can manage assigned hackathons'),
('Registration Desk', 'Can check-in teams and assign tables'),
('Volunteer', 'Can distribute food coupons and assist'),
('Judge', 'Can score assigned teams'),
('Viewer', 'Can view leaderboards only')

ON CONFLICT (name) DO NOTHING;



-- 2. Create User Roles Mapping Table
-- Links an auth.user to a role, optionally scoped to a specific hackathon
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id, hackathon_id)
);

-- 3. Enable RLS

-- Function to check roles without triggering infinite recursion in RLS
CREATE OR REPLACE FUNCTION public.has_role(role_names text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = ANY(role_names)
    );
$$;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Roles are read-only for authenticated users
CREATE POLICY "Roles are viewable by authenticated users" ON public.roles
    FOR SELECT TO authenticated USING (true);

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Super Admins and Organizers can view all user roles
CREATE POLICY "Admins and Organizers can view all roles" ON public.user_roles
    FOR SELECT TO authenticated USING (
        public.has_role(ARRAY['Super Admin', 'Organizer'])
    );

-- Only Super Admins can insert/update/delete roles globally
-- Organizers can only manage roles for their specific hackathons
CREATE POLICY "Super Admins can manage all user roles" ON public.user_roles
    FOR ALL TO authenticated USING (
        public.has_role(ARRAY['Super Admin'])
    );

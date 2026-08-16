-- 06_staff_management.sql

-- 1. Create Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Registration Desk', 'Volunteer')),
    staff_code TEXT NOT NULL,
    password TEXT NOT NULL,
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hackathon_id, staff_code)
);

-- 2. Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Allow any authenticated user to read
CREATE POLICY "Enable read access for all authenticated users" 
    ON public.staff FOR SELECT 
    TO authenticated USING (true);

-- Allow organizers to manage staff for their hackathons
CREATE POLICY "Organizers can manage staff" 
    ON public.staff FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.hackathons h 
            WHERE h.id = hackathon_id AND h.created_by = auth.uid()
        )
    );

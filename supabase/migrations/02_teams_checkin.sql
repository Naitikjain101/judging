-- 02_teams_checkin.sql
-- Migration to update teams table for check-in and table assignments

-- Add new columns to teams table
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Registered' CHECK (status IN ('Registered', 'Checked-In', 'Absent')),
ADD COLUMN IF NOT EXISTS team_number TEXT,
ADD COLUMN IF NOT EXISTS table_number INTEGER,
ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_in_volunteer_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS leader_name TEXT;

-- Create an index to quickly find teams by check-in status and numbers
CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_team_number ON public.teams(team_number);

-- Update RLS for teams to allow volunteers/registration desk to modify them
DROP POLICY IF EXISTS "Organizers can insert teams" ON public.teams;
DROP POLICY IF EXISTS "Organizers can update teams" ON public.teams;
DROP POLICY IF EXISTS "Organizers can delete teams" ON public.teams;

CREATE POLICY "Organizers and Registration Desk can insert teams" ON public.teams
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Registration Desk'])
    );

CREATE POLICY "Organizers and Registration Desk can update teams" ON public.teams
    FOR UPDATE TO authenticated USING (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Registration Desk'])
    );

CREATE POLICY "Only Organizers and Super Admins can delete teams" ON public.teams
    FOR DELETE TO authenticated USING (
        public.has_role(ARRAY['Super Admin', 'Organizer'])
    );

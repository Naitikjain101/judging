-- ==============================================
-- FILE: 09_team_checkin_audit.sql
-- ==============================================

-- 1. Add check_in_rule to hackathons
ALTER TABLE public.hackathons
ADD COLUMN IF NOT EXISTS check_in_rule TEXT DEFAULT 'ALL_MEMBERS' CHECK (check_in_rule IN ('ALL_MEMBERS', 'ANY_MEMBER'));

-- 2. Update status constraint on teams
DO $$ 
BEGIN
  ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.teams
ADD CONSTRAINT teams_status_check CHECK (status IN ('Registered', 'Partially Checked In', 'Checked-In', 'Absent', 'Judging', 'Completed'));

-- 3. Create attendance_audit table
CREATE TABLE IF NOT EXISTS public.attendance_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    member_name TEXT,
    action TEXT NOT NULL,
    volunteer_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS for attendance_audit
ALTER TABLE public.attendance_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers and Registration Desk can read audit logs" ON public.attendance_audit
    FOR SELECT TO authenticated USING (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Registration Desk'])
    );

CREATE POLICY "Registration Desk can insert audit logs" ON public.attendance_audit
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Registration Desk'])
    );

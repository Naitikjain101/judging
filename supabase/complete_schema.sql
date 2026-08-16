-- ==============================================
-- FILE: 00_core_schema.sql
-- ==============================================

-- 00_core_schema.sql
-- Core schema for Hackathon Judging App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- HACKATHONS
CREATE TABLE IF NOT EXISTS public.hackathons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAMS
-- Note: Extended by 02_teams_checkin.sql
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    members TEXT,
    team_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    track TEXT,
    college TEXT,
    project_title TEXT,
    food_purchased BOOLEAN DEFAULT FALSE,
    food_package TEXT,
    additional_notes TEXT
);

-- JUDGES
CREATE TABLE IF NOT EXISTS public.judges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    judge_code TEXT,
    company TEXT,
    designation TEXT,
    password TEXT,
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROUNDS
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITERIA
CREATE TABLE IF NOT EXISTS public.criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    max_score NUMERIC NOT NULL,
    weight NUMERIC DEFAULT 1.0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROUND_TEAMS (Which teams are competing in which round)
CREATE TABLE IF NOT EXISTS public.round_teams (
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (round_id, team_id)
);

-- ROUND_JUDGE_ASSIGNMENTS (Which judge evaluates which team in a round)
CREATE TABLE IF NOT EXISTS public.round_judge_assignments (
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (round_id, judge_id, team_id)
);

-- SUBMISSIONS (Overall evaluation of a team by a judge in a round)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    feedback TEXT,
    submitted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(round_id, judge_id, team_id)
);

-- SCORE_DETAILS (Individual scores per criterion)
CREATE TABLE IF NOT EXISTS public.score_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES public.criteria(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, criterion_id)
);

-- Set up Basic RLS (Row Level Security)
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_details ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users for now
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.hackathons;
CREATE POLICY "Enable read access for all authenticated users" ON public.hackathons FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.teams;
CREATE POLICY "Enable read access for all authenticated users" ON public.teams FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.judges;
CREATE POLICY "Enable read access for all authenticated users" ON public.judges FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.rounds;
CREATE POLICY "Enable read access for all authenticated users" ON public.rounds FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.criteria;
CREATE POLICY "Enable read access for all authenticated users" ON public.criteria FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.round_teams;
CREATE POLICY "Enable read access for all authenticated users" ON public.round_teams FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.round_judge_assignments;
CREATE POLICY "Enable read access for all authenticated users" ON public.round_judge_assignments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.submissions;
CREATE POLICY "Enable read access for all authenticated users" ON public.submissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.score_details;
CREATE POLICY "Enable read access for all authenticated users" ON public.score_details FOR SELECT TO authenticated USING (true);


-- ==============================================
-- FILE: 01_enterprise_rbac.sql
-- ==============================================

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
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON public.roles;
CREATE POLICY "Roles are viewable by authenticated users" ON public.roles
    FOR SELECT TO authenticated USING (true);

-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Super Admins and Organizers can view all user roles
DROP POLICY IF EXISTS "Admins and Organizers can view all roles" ON public.user_roles;
CREATE POLICY "Admins and Organizers can view all roles" ON public.user_roles
    FOR SELECT TO authenticated USING (
        public.has_role(ARRAY['Super Admin', 'Organizer'])
    );

-- Only Super Admins can insert/update/delete roles globally
-- Organizers can only manage roles for their specific hackathons
DROP POLICY IF EXISTS "Super Admins can manage all user roles" ON public.user_roles;
CREATE POLICY "Super Admins can manage all user roles" ON public.user_roles
    FOR ALL TO authenticated USING (
        public.has_role(ARRAY['Super Admin'])
    );


-- ==============================================
-- FILE: 02_teams_checkin.sql
-- ==============================================

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

DROP POLICY IF EXISTS "Organizers and Registration Desk can insert teams" ON public.teams;
CREATE POLICY "Organizers and Registration Desk can insert teams" ON public.teams
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Registration Desk'])
    );

DROP POLICY IF EXISTS "Organizers and Registration Desk can update teams" ON public.teams;
CREATE POLICY "Organizers and Registration Desk can update teams" ON public.teams
    FOR UPDATE TO authenticated USING (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Registration Desk'])
    );

DROP POLICY IF EXISTS "Only Organizers and Super Admins can delete teams" ON public.teams;
CREATE POLICY "Only Organizers and Super Admins can delete teams" ON public.teams
    FOR DELETE TO authenticated USING (
        public.has_role(ARRAY['Super Admin', 'Organizer'])
    );


-- ==============================================
-- FILE: 03_food_management.sql
-- ==============================================

-- 03_food_management.sql
-- Migration for Food & Coupon Management

-- 1. Food Packages Configuration
CREATE TABLE IF NOT EXISTS public.food_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Breakfast', 'Lunch', 'Dinner', 'Combo', 'Custom')),
    price DECIMAL(10, 2) DEFAULT 0.00, -- 0 means prepaid/included
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hackathon_id, name)
);

-- 2. Food Purchases (for on-the-spot buying)
CREATE TABLE IF NOT EXISTS public.food_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.food_packages(id) ON DELETE CASCADE,
    payment_method TEXT CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Prepaid')),
    amount DECIMAL(10, 2) NOT NULL,
    volunteer_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coupon Distributions (Tracking actual physical coupon handovers)
CREATE TABLE IF NOT EXISTS public.coupon_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.food_packages(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast analytics
CREATE INDEX IF NOT EXISTS idx_food_purchases_hackathon ON public.food_purchases(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_distributions_hackathon ON public.coupon_distributions(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_distributions_team ON public.coupon_distributions(team_id);

-- Enable RLS
ALTER TABLE public.food_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_distributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Food Packages: Organizers can manage, everyone can read
DROP POLICY IF EXISTS "Organizers can manage food packages" ON public.food_packages;
CREATE POLICY "Organizers can manage food packages" ON public.food_packages
    FOR ALL TO authenticated USING (
        public.has_role(ARRAY['Super Admin', 'Organizer'])
    );
DROP POLICY IF EXISTS "Packages are viewable by all staff" ON public.food_packages;
CREATE POLICY "Packages are viewable by all staff" ON public.food_packages FOR SELECT TO authenticated USING (true);

-- Purchases & Distributions: Volunteers and Organizers can insert/select
DROP POLICY IF EXISTS "Staff can insert purchases" ON public.food_purchases;
CREATE POLICY "Staff can insert purchases" ON public.food_purchases
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Volunteer'])
    );
DROP POLICY IF EXISTS "Staff can view purchases" ON public.food_purchases;
CREATE POLICY "Staff can view purchases" ON public.food_purchases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff can insert distributions" ON public.coupon_distributions;
CREATE POLICY "Staff can insert distributions" ON public.coupon_distributions
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Volunteer', 'Registration Desk'])
    );
DROP POLICY IF EXISTS "Staff can view distributions" ON public.coupon_distributions;
CREATE POLICY "Staff can view distributions" ON public.coupon_distributions FOR SELECT TO authenticated USING (true);


-- ==============================================
-- FILE: 04_weighted_criteria.sql
-- ==============================================

-- 04_weighted_criteria.sql
-- Migration to add weights to judging criteria

ALTER TABLE public.criteria 
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2) DEFAULT 1.0;


-- ==============================================
-- FILE: 05_core_policies.sql
-- ==============================================

-- 05_core_policies.sql

-- 1. Add missing description column to hackathons
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Hackathons Policies
DROP POLICY IF EXISTS "Users can create hackathons" ON public.hackathons;
CREATE POLICY "Users can create hackathons" 
    ON public.hackathons FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own hackathons" ON public.hackathons;
CREATE POLICY "Users can update their own hackathons" 
    ON public.hackathons FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own hackathons" ON public.hackathons;
CREATE POLICY "Users can delete their own hackathons" 
    ON public.hackathons FOR DELETE 
    TO authenticated 
    USING (auth.uid() = created_by);

-- 3. Teams Policies
DROP POLICY IF EXISTS "Organizers can manage teams" ON public.teams;
CREATE POLICY "Organizers can manage teams" 
    ON public.teams FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.hackathons h 
            WHERE h.id = hackathon_id AND h.created_by = auth.uid()
        )
    );

-- 4. Judges Policies
DROP POLICY IF EXISTS "Organizers can manage judges" ON public.judges;
CREATE POLICY "Organizers can manage judges" 
    ON public.judges FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.hackathons h 
            WHERE h.id = hackathon_id AND h.created_by = auth.uid()
        )
    );

-- 5. Rounds Policies
DROP POLICY IF EXISTS "Organizers can manage rounds" ON public.rounds;
CREATE POLICY "Organizers can manage rounds" 
    ON public.rounds FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.hackathons h 
            WHERE h.id = hackathon_id AND h.created_by = auth.uid()
        )
    );

-- 6. Criteria Policies
DROP POLICY IF EXISTS "Organizers can manage criteria" ON public.criteria;
CREATE POLICY "Organizers can manage criteria" 
    ON public.criteria FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.rounds r
            JOIN public.hackathons h ON h.id = r.hackathon_id
            WHERE r.id = round_id AND h.created_by = auth.uid()
        )
    );

-- 7. Round Teams & Assignments Policies
DROP POLICY IF EXISTS "Organizers can manage round_teams" ON public.round_teams;
CREATE POLICY "Organizers can manage round_teams" 
    ON public.round_teams FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.rounds r
            JOIN public.hackathons h ON h.id = r.hackathon_id
            WHERE r.id = round_id AND h.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can manage round_judge_assignments" ON public.round_judge_assignments;
CREATE POLICY "Organizers can manage round_judge_assignments" 
    ON public.round_judge_assignments FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.rounds r
            JOIN public.hackathons h ON h.id = r.hackathon_id
            WHERE r.id = round_id AND h.created_by = auth.uid()
        )
    );

-- 8. Submissions and Scores Policies
DROP POLICY IF EXISTS "Judges can create submissions" ON public.submissions;
CREATE POLICY "Judges can create submissions" 
    ON public.submissions FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.judges j 
            WHERE j.id = judge_id AND j.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Judges can update their submissions" ON public.submissions;
CREATE POLICY "Judges can update their submissions" 
    ON public.submissions FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.judges j 
            WHERE j.id = judge_id AND j.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Judges can create score details" ON public.score_details;
CREATE POLICY "Judges can create score details" 
    ON public.score_details FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.submissions s
            JOIN public.judges j ON j.id = s.judge_id
            WHERE s.id = submission_id AND j.auth_user_id = auth.uid()
        )
    );


-- ==============================================
-- FILE: 06_staff_management.sql
-- ==============================================

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
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.staff;
CREATE POLICY "Enable read access for all authenticated users" 
    ON public.staff FOR SELECT 
    TO authenticated USING (true);

-- Allow organizers to manage staff for their hackathons
DROP POLICY IF EXISTS "Organizers can manage staff" ON public.staff;
CREATE POLICY "Organizers can manage staff" 
    ON public.staff FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.hackathons h 
            WHERE h.id = hackathon_id AND h.created_by = auth.uid()
        )
    );


-- ==============================================
-- FILE: 07_indexes.sql
-- ==============================================

-- 07_indexes.sql
-- Add missing indexes on frequently queried columns for performance optimization

-- 1. Core Schema Foreign Keys
CREATE INDEX IF NOT EXISTS idx_teams_hackathon_id ON public.teams(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_judges_hackathon_id ON public.judges(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_rounds_hackathon_id ON public.rounds(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_criteria_round_id ON public.criteria(round_id);

CREATE INDEX IF NOT EXISTS idx_round_teams_round_id ON public.round_teams(round_id);
CREATE INDEX IF NOT EXISTS idx_round_teams_team_id ON public.round_teams(team_id);

CREATE INDEX IF NOT EXISTS idx_round_judge_assignments_round_id ON public.round_judge_assignments(round_id);
CREATE INDEX IF NOT EXISTS idx_round_judge_assignments_judge_id ON public.round_judge_assignments(judge_id);
CREATE INDEX IF NOT EXISTS idx_round_judge_assignments_team_id ON public.round_judge_assignments(team_id);

CREATE INDEX IF NOT EXISTS idx_submissions_round_id ON public.submissions(round_id);
CREATE INDEX IF NOT EXISTS idx_submissions_judge_id ON public.submissions(judge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON public.submissions(team_id);

CREATE INDEX IF NOT EXISTS idx_score_details_submission_id ON public.score_details(submission_id);

-- 2. Staff Management Foreign Keys
CREATE INDEX IF NOT EXISTS idx_staff_hackathon_id ON public.staff(hackathon_id);

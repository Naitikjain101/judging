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
    created_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE POLICY "Enable read access for all authenticated users" ON public.hackathons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.judges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.criteria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.round_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.round_judge_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.score_details FOR SELECT TO authenticated USING (true);

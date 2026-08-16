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

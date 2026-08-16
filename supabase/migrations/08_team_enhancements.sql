-- ==============================================
-- FILE: 08_team_enhancements.sql
-- ==============================================

-- 08_team_enhancements.sql
-- Migration to add enterprise features to the teams table

ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS track TEXT,
ADD COLUMN IF NOT EXISTS college TEXT,
ADD COLUMN IF NOT EXISTS project_title TEXT,
ADD COLUMN IF NOT EXISTS food_purchased BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS food_package TEXT,
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

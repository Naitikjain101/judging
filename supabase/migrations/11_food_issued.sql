-- 11_food_issued.sql
-- Adds offline food tracking fields to the teams table

ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS food_issued BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS food_issued_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS food_issued_by UUID REFERENCES auth.users(id);

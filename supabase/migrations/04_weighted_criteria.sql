-- 04_weighted_criteria.sql
-- Migration to add weights to judging criteria

ALTER TABLE public.criteria 
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2) DEFAULT 1.0;

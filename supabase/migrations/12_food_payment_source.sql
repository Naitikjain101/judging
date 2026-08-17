-- ==============================================
-- FILE: 12_food_payment_source.sql
-- ==============================================

-- 1. Track precise food payments
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS food_payment_source TEXT CHECK (food_payment_source IN ('PREPAID', 'FOOD_DESK')),
ADD COLUMN IF NOT EXISTS food_payment_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS food_payment_collected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS food_payment_collected_by UUID REFERENCES auth.users(id);

-- 2. Backfill existing PAID teams as PREPAID if missing source
UPDATE public.teams
SET 
  food_payment_source = 'PREPAID',
  food_payment_amount = 0 -- Assuming 0 as we don't have historical data, but they pre-paid
WHERE food_payment_status = 'Paid' AND food_payment_source IS NULL;

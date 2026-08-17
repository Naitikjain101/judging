-- 10_team_food_payment.sql
-- Adds food_payment_status and food_quantity to the teams table

ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS food_payment_status TEXT DEFAULT 'Unpaid' CHECK (food_payment_status IN ('Paid', 'Unpaid', 'Pending')),
ADD COLUMN IF NOT EXISTS food_quantity INTEGER DEFAULT 0;

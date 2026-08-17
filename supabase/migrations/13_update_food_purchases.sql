-- 13_update_food_purchases.sql
-- Migration to update food_purchases for direct payment tracking without required packages

-- 1. Make package_id optional since packages are no longer strictly used
ALTER TABLE public.food_purchases ALTER COLUMN package_id DROP NOT NULL;

-- 2. Add payment source and status tracking to food_purchases
ALTER TABLE public.food_purchases ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PAID';
ALTER TABLE public.food_purchases ADD COLUMN IF NOT EXISTS payment_source TEXT DEFAULT 'FOOD_DESK' CHECK (payment_source IN ('PREPAID', 'FOOD_DESK'));

-- 3. We also need to remove the food_payment tracking from teams table, 
-- but since we already created it, let's keep the legacy columns there and 
-- just migrate any existing prepaid records into food_purchases.
DO $$ 
BEGIN
    -- Insert PREPAID purchases for teams that are marked as Paid
    INSERT INTO public.food_purchases (hackathon_id, team_id, amount, payment_method, volunteer_id, payment_status, payment_source)
    SELECT 
        h.id,
        t.id,
        COALESCE(t.food_payment_amount, 0),
        'Prepaid',
        h.created_by, -- Use hackathon creator as the volunteer_id for migrated records
        'PAID',
        COALESCE(t.food_payment_source, 'PREPAID')
    FROM public.teams t
    JOIN public.hackathons h ON h.id = t.hackathon_id
    WHERE t.food_payment_status = 'Paid'
    AND NOT EXISTS (
        SELECT 1 FROM public.food_purchases fp WHERE fp.team_id = t.id AND fp.payment_source = COALESCE(t.food_payment_source, 'PREPAID')
    );
END $$;

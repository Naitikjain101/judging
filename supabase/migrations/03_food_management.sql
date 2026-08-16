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
CREATE POLICY "Organizers can manage food packages" ON public.food_packages
    FOR ALL TO authenticated USING (
        public.has_role(ARRAY['Super Admin', 'Organizer'])
    );
CREATE POLICY "Packages are viewable by all staff" ON public.food_packages FOR SELECT TO authenticated USING (true);

-- Purchases & Distributions: Volunteers and Organizers can insert/select
CREATE POLICY "Staff can insert purchases" ON public.food_purchases
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Volunteer'])
    );
CREATE POLICY "Staff can view purchases" ON public.food_purchases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert distributions" ON public.coupon_distributions
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(ARRAY['Super Admin', 'Organizer', 'Volunteer', 'Registration Desk'])
    );
CREATE POLICY "Staff can view distributions" ON public.coupon_distributions FOR SELECT TO authenticated USING (true);

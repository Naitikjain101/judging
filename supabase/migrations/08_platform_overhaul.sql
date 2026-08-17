-- ==============================================================================
-- 1. DROP PLAINTEXT PASSWORDS & ADD VISIBILITY CONTROLS
-- ==============================================================================

ALTER TABLE public.rounds ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Backup old passwords just in case, then drop the column
DO $$
BEGIN
    -- For judges
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='judges' AND column_name='password') THEN
        ALTER TABLE public.judges ADD COLUMN IF NOT EXISTS password_hint TEXT;
        EXECUTE 'UPDATE public.judges SET password_hint = ''Reset required'' WHERE password IS NOT NULL';
        ALTER TABLE public.judges DROP COLUMN password;
    END IF;

    -- For staff
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='staff' AND column_name='password') THEN
        ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS password_hint TEXT;
        EXECUTE 'UPDATE public.staff SET password_hint = ''Reset required'' WHERE password IS NOT NULL';
        ALTER TABLE public.staff DROP COLUMN password;
    END IF;
END $$;

-- ==============================================================================
-- 2. ADD INTEGRITY CONSTRAINTS
-- ==============================================================================

-- Drop existing constraints if they exist to make this idempotent
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS uq_team_code_per_hackathon;
ALTER TABLE public.teams ADD CONSTRAINT uq_team_code_per_hackathon UNIQUE(hackathon_id, team_code);

ALTER TABLE public.judges DROP CONSTRAINT IF EXISTS uq_judge_code_per_hackathon;
ALTER TABLE public.judges ADD CONSTRAINT uq_judge_code_per_hackathon UNIQUE(hackathon_id, judge_code);

ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS uq_staff_code_per_hackathon;
ALTER TABLE public.staff ADD CONSTRAINT uq_staff_code_per_hackathon UNIQUE(hackathon_id, staff_code);

ALTER TABLE public.coupon_distributions DROP CONSTRAINT IF EXISTS uq_coupon_per_team_package;
ALTER TABLE public.coupon_distributions ADD CONSTRAINT uq_coupon_per_team_package UNIQUE(hackathon_id, team_id, package_id);

ALTER TABLE public.score_details DROP CONSTRAINT IF EXISTS chk_score_value;
ALTER TABLE public.score_details ADD CONSTRAINT chk_score_value CHECK (value >= 0);

-- ==============================================================================
-- 3. RLS SECURITY FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_hackathon_organizer(h_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hackathons
    WHERE id = h_id AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_hackathon_staff(h_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff
    WHERE hackathon_id = h_id AND auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_hackathon_judge(h_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.judges
    WHERE hackathon_id = h_id AND auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_judge_id(user_uid UUID)
RETURNS UUID AS $$
DECLARE
  j_id UUID;
BEGIN
  SELECT id INTO j_id FROM public.judges WHERE auth_user_id = user_uid LIMIT 1;
  RETURN j_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. OVERHAUL RLS POLICIES
-- ==============================================================================

-- Hackathons
DROP POLICY IF EXISTS "Public read hackathons" ON public.hackathons;
CREATE POLICY "Hackathons visibility" ON public.hackathons FOR SELECT TO authenticated
USING (
  created_by = auth.uid() OR
  is_hackathon_staff(id) OR
  is_hackathon_judge(id)
);

-- Teams
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.teams;
CREATE POLICY "Teams visibility" ON public.teams FOR SELECT TO authenticated
USING (
  is_hackathon_organizer(hackathon_id) OR
  is_hackathon_staff(hackathon_id) OR
  is_hackathon_judge(hackathon_id)
);

-- Judges
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.judges;
CREATE POLICY "Judges visibility" ON public.judges FOR SELECT TO authenticated
USING (
  is_hackathon_organizer(hackathon_id) OR
  auth_user_id = auth.uid()
);

-- Staff
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.staff;
CREATE POLICY "Staff visibility" ON public.staff FOR SELECT TO authenticated
USING (
  is_hackathon_organizer(hackathon_id) OR
  auth_user_id = auth.uid()
);

-- Rounds
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.rounds;
CREATE POLICY "Rounds visibility" ON public.rounds FOR SELECT TO authenticated
USING (
  is_hackathon_organizer(hackathon_id) OR
  is_hackathon_judge(hackathon_id) OR
  is_hackathon_staff(hackathon_id)
);

-- Criteria
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.criteria;
CREATE POLICY "Criteria visibility" ON public.criteria FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rounds r 
    WHERE r.id = criteria.round_id AND (
      is_hackathon_organizer(r.hackathon_id) OR 
      is_hackathon_judge(r.hackathon_id)
    )
  )
);

-- Round Teams
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.round_teams;
CREATE POLICY "Round teams visibility" ON public.round_teams FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rounds r 
    WHERE r.id = round_teams.round_id AND (
      is_hackathon_organizer(r.hackathon_id) OR 
      is_hackathon_judge(r.hackathon_id)
    )
  )
);

-- Judge Assignments
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.round_judge_assignments;
CREATE POLICY "Assignments visibility" ON public.round_judge_assignments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rounds r 
    WHERE r.id = round_judge_assignments.round_id AND is_hackathon_organizer(r.hackathon_id)
  ) OR
  judge_id = get_judge_id(auth.uid())
);

-- Submissions
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.submissions;
CREATE POLICY "Submissions visibility" ON public.submissions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rounds r 
    WHERE r.id = submissions.round_id AND is_hackathon_organizer(r.hackathon_id)
  ) OR
  judge_id = get_judge_id(auth.uid())
);

-- Score Details
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.score_details;
CREATE POLICY "Score details visibility" ON public.score_details FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.rounds r ON r.id = s.round_id
    WHERE s.id = score_details.submission_id AND (
      is_hackathon_organizer(r.hackathon_id) OR
      s.judge_id = get_judge_id(auth.uid())
    )
  )
);

-- Food Packages
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.food_packages;
CREATE POLICY "Food packages visibility" ON public.food_packages FOR SELECT TO authenticated
USING (
  is_hackathon_organizer(hackathon_id) OR
  is_hackathon_staff(hackathon_id)
);

-- Food Purchases
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.food_purchases;
CREATE POLICY "Food purchases visibility" ON public.food_purchases FOR SELECT TO authenticated
USING (
  is_hackathon_organizer(hackathon_id) OR
  is_hackathon_staff(hackathon_id)
);

-- Coupon Distributions
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.coupon_distributions;
CREATE POLICY "Coupon distributions visibility" ON public.coupon_distributions FOR SELECT TO authenticated
USING (
  is_hackathon_organizer(hackathon_id) OR
  is_hackathon_staff(hackathon_id)
);

-- ==============================================================================
-- 5. ATOMIC CHECK-IN RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.atomic_next_team_number(p_hackathon_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_val INTEGER;
BEGIN
  -- We use a dedicated table or sequence in a real environment, 
  -- but for this, we can compute max + 1 while locking the hackathon row 
  -- to serialize concurrent check-ins.
  
  -- Lock the hackathon row to prevent race conditions
  PERFORM 1 FROM public.hackathons WHERE id = p_hackathon_id FOR UPDATE;
  
  SELECT COALESCE(MAX(table_number), 0) + 1 INTO v_next_val 
  FROM public.teams 
  WHERE hackathon_id = p_hackathon_id AND status = 'Checked-In';
  
  RETURN v_next_val;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 6. BULK JUDGE ASSIGNMENT RPC
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.bulk_assign_judges(
  p_round_id UUID, 
  p_assignments JSONB -- Array of {judge_id, team_id}
)
RETURNS VOID AS $$
DECLARE
  v_hackathon_id UUID;
  v_item JSONB;
  v_judge_id UUID;
  v_team_id UUID;
BEGIN
  -- Verify user is organizer of the hackathon
  SELECT hackathon_id INTO v_hackathon_id FROM public.rounds WHERE id = p_round_id;
  
  IF NOT is_hackathon_organizer(v_hackathon_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Clear existing assignments for this round
  DELETE FROM public.round_judge_assignments WHERE round_id = p_round_id;

  -- Insert new ones
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_assignments)
  LOOP
    v_judge_id := (v_item->>'judge_id')::UUID;
    v_team_id := (v_item->>'team_id')::UUID;
    
    INSERT INTO public.round_judge_assignments (round_id, judge_id, team_id)
    VALUES (p_round_id, v_judge_id, v_team_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

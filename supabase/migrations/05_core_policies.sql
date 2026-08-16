-- 05_core_policies.sql

-- 1. Add missing description column to hackathons
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Hackathons Policies
CREATE POLICY "Users can create hackathons" 
    ON public.hackathons FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own hackathons" 
    ON public.hackathons FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own hackathons" 
    ON public.hackathons FOR DELETE 
    TO authenticated 
    USING (auth.uid() = created_by);

-- 3. Teams Policies
CREATE POLICY "Organizers can manage teams" 
    ON public.teams FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.hackathons h 
            WHERE h.id = hackathon_id AND h.created_by = auth.uid()
        )
    );

-- 4. Judges Policies
CREATE POLICY "Organizers can manage judges" 
    ON public.judges FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.hackathons h 
            WHERE h.id = hackathon_id AND h.created_by = auth.uid()
        )
    );

-- 5. Rounds Policies
CREATE POLICY "Organizers can manage rounds" 
    ON public.rounds FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.hackathons h 
            WHERE h.id = hackathon_id AND h.created_by = auth.uid()
        )
    );

-- 6. Criteria Policies
CREATE POLICY "Organizers can manage criteria" 
    ON public.criteria FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.rounds r
            JOIN public.hackathons h ON h.id = r.hackathon_id
            WHERE r.id = round_id AND h.created_by = auth.uid()
        )
    );

-- 7. Round Teams & Assignments Policies
CREATE POLICY "Organizers can manage round_teams" 
    ON public.round_teams FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.rounds r
            JOIN public.hackathons h ON h.id = r.hackathon_id
            WHERE r.id = round_id AND h.created_by = auth.uid()
        )
    );

CREATE POLICY "Organizers can manage round_judge_assignments" 
    ON public.round_judge_assignments FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.rounds r
            JOIN public.hackathons h ON h.id = r.hackathon_id
            WHERE r.id = round_id AND h.created_by = auth.uid()
        )
    );

-- 8. Submissions and Scores Policies
CREATE POLICY "Judges can create submissions" 
    ON public.submissions FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.judges j 
            WHERE j.id = judge_id AND j.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Judges can update their submissions" 
    ON public.submissions FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.judges j 
            WHERE j.id = judge_id AND j.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Judges can create score details" 
    ON public.score_details FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.submissions s
            JOIN public.judges j ON j.id = s.judge_id
            WHERE s.id = submission_id AND j.auth_user_id = auth.uid()
        )
    );

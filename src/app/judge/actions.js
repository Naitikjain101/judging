"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const JUDGE_AUTH_DOMAIN = process.env.JUDGE_AUTH_DOMAIN || "judge.hu.local";

export async function logInJudge(prevState, formData) {
  const judgeCode = formData.get("judgeCode")?.trim().toLowerCase();
  const password = formData.get("password");

  if (!judgeCode || !password) return { error: "Enter your judge ID and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: `${judgeCode}@${JUDGE_AUTH_DOMAIN}`,
    password,
  });

  if (error) return { error: "Invalid judge ID or password." };
  
  const sessionId = crypto.randomUUID();
  
  // Save session ID to user_metadata
  await supabase.auth.updateUser({
    data: { current_session: sessionId }
  });
  
  const { cookies } = await import("next/headers");
  cookies().set('judge_session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });

  redirect("/judge/dashboard");
}

export async function logOutJudge() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  const { cookies } = await import("next/headers");
  cookies().delete('judge_session');
  
  redirect("/");
}

// Basic sanitization
function sanitize(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Upserts a submission + its per-criterion scores for the current judge.
export async function submitScore({ roundId, teamId, feedback, scores }) {
  const safeFeedback = sanitize(feedback);
  
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Not logged in." };

  const { data: judge } = await supabase
    .from("judges")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .single();

  if (!judge) return { error: "Judge account not found." };

  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .upsert(
      {
        round_id: roundId,
        judge_id: judge.id,
        team_id: teamId,
        feedback: safeFeedback,
        submitted: true,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "round_id,judge_id,team_id" }
    )
    .select()
    .single();

  if (subError) return { error: subError.message };

  const rows = Object.entries(scores).map(([criterionId, value]) => ({
    submission_id: submission.id,
    criterion_id: criterionId,
    value: Number(value) || 0,
  }));

  if (rows.length) {
    const { error: scoreError } = await supabase
      .from("score_details")
      .upsert(rows, { onConflict: "submission_id,criterion_id" });
    if (scoreError) return { error: scoreError.message };
  }

  revalidatePath("/judge/dashboard");
  return { error: null };
}

"use server";

import { createPortalClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const JUDGE_AUTH_DOMAIN = process.env.JUDGE_AUTH_DOMAIN || "judge.hu.local";

export async function logInJudge(prevState, formData) {
  try {
    const judgeCode = formData.get("judgeCode")?.trim().toLowerCase();
    const password = formData.get("password");

    if (!judgeCode || !password) return { error: "Enter your judge ID and password." };

    const supabase = await createPortalClient("judge");
    const { error } = await supabase.auth.signInWithPassword({
      email: `${judgeCode}@${JUDGE_AUTH_DOMAIN}`,
      password,
    });

    if (error) return { error: "Invalid judge ID or password." };
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("logInJudge error:", err);
    return { error: err.message || "An unexpected error occurred." };
  }

  redirect("/judge/dashboard");
}

export async function logOutJudge() {
  const supabase = await createPortalClient("judge");
  await supabase.auth.signOut();
  redirect("/judge/login");
}

// ── Score submission (with full server-side validation) ──────────────

// Basic sanitization
function sanitize(input) {
  if (typeof input !== "string") return input;
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Submit scores for a team in a round.
 *
 * Server-side validations:
 *   1. Authenticated user is a judge
 *   2. Judge is assigned to the team in the round
 *   3. Criterion belongs to the round
 *   4. Score value is within 0..max_score
 *   5. Team belongs to the judge's hackathon
 */
export async function submitScore({ roundId, teamId, feedback, scores }) {
  const safeFeedback = sanitize(feedback);

  const supabase = await createPortalClient("judge");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Not logged in." };

  // 1. Find judge record
  const { data: judge } = await supabase
    .from("judges")
    .select("id, hackathon_id")
    .eq("auth_user_id", userData.user.id)
    .single();

  if (!judge) return { error: "Judge account not found." };

  // 2. Verify the round belongs to the judge's hackathon
  const { data: round } = await supabase
    .from("rounds")
    .select("id, hackathon_id, status")
    .eq("id", roundId)
    .single();

  if (!round) return { error: "Round not found." };
  if (round.hackathon_id !== judge.hackathon_id) {
    return { error: "Unauthorized: round does not belong to your hackathon." };
  }

  // 3. Verify judge is assigned to this team in this round
  const { data: assignment } = await supabase
    .from("round_judge_assignments")
    .select("judge_id")
    .eq("round_id", roundId)
    .eq("judge_id", judge.id)
    .eq("team_id", teamId)
    .single();

  if (!assignment) {
    return { error: "You are not assigned to evaluate this team in this round." };
  }

  // 4. Verify team belongs to the same hackathon
  const { data: team } = await supabase
    .from("teams")
    .select("id, hackathon_id")
    .eq("id", teamId)
    .single();

  if (!team || team.hackathon_id !== judge.hackathon_id) {
    return { error: "Unauthorized: team does not belong to your hackathon." };
  }

  // 5. Fetch criteria for this round and validate scores
  const { data: criteria } = await supabase
    .from("criteria")
    .select("id, max_score")
    .eq("round_id", roundId);

  const criteriaMap = {};
  for (const c of criteria || []) {
    criteriaMap[c.id] = c;
  }

  for (const [criterionId, value] of Object.entries(scores)) {
    const criterion = criteriaMap[criterionId];
    if (!criterion) {
      return { error: `Invalid criterion: ${criterionId}` };
    }
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0 || numValue > Number(criterion.max_score)) {
      return {
        error: `Score for "${criterionId}" must be between 0 and ${criterion.max_score}.`,
      };
    }
  }

  // 6. Upsert submission
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .upsert(
      {
        round_id: roundId,
        judge_id: judge.id,
        team_id: teamId,
        feedback: safeFeedback,
        submitted: true,
      },
      { onConflict: "round_id,judge_id,team_id" }
    )
    .select()
    .single();

  if (subError) return { error: subError.message };

  // 7. Upsert individual score details
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

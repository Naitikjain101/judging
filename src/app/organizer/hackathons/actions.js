"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const JUDGE_AUTH_DOMAIN = process.env.JUDGE_AUTH_DOMAIN || "judge.hu.local";

function judgeEmail(judgeCode) {
  return `${judgeCode.trim().toLowerCase()}@${JUDGE_AUTH_DOMAIN}`;
}

// Basic sanitization
function sanitize(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Hackathons ──────────────────────────────────────────────
export async function createHackathon(formData) {
  try {
  const name = sanitize(formData.get("name")?.toString().trim());
  const description = sanitize(formData.get("description")?.toString().trim());

  if (!name) return { error: "Hackathon name is required." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("hackathons")
    .insert({ name, description, created_by: userData.user.id, status: 'active' })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/organizer/dashboard");
  redirect(`/organizer/hackathons/${data.id}`);
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in createHackathon:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function setHackathonStatus(hackathonId, status) {
  try {
  if (!["draft", "active", "completed"].includes(status)) return { error: "Invalid status." };
  
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  // Verify ownership
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  await supabase.from("hackathons").update({ status }).eq("id", hackathonId);
  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  revalidatePath("/organizer/dashboard");
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in setHackathonStatus:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function setHackathonCheckInRule(hackathonId, rule) {
  try {
    if (!["ALL_MEMBERS", "ANY_MEMBER"].includes(rule)) return { error: "Invalid rule." };
    
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { error: "Unauthorized" };
    
    const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
    if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

    await supabase.from("hackathons").update({ check_in_rule: rule }).eq("id", hackathonId);
    revalidatePath(`/organizer/hackathons/${hackathonId}`);
    return { error: null };
  } catch (err) {
    console.error("Error in setHackathonCheckInRule:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── Teams ───────────────────────────────────────────────────
export async function addTeam(hackathonId, formData) {
  try {
  const name = sanitize(formData.get("name")?.toString().trim());
  const leaderName = sanitize(formData.get("leaderName")?.toString().trim());
  const leaderEmail = sanitize(formData.get("leaderEmail")?.toString().trim());
  const leaderPhone = sanitize(formData.get("leaderPhone")?.toString().trim());
  const members = formData.get("members")?.toString() || "[]";
  const teamCode = sanitize(formData.get("teamCode")?.toString().trim().toUpperCase());

  if (!name) return { error: "Team name is required." };
  if (!leaderName) return { error: "Leader name is required." };
  if (!teamCode) return { error: "Team ID is required." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  // Enforce unique team_code for this hackathon
  const { data: existing } = await supabase.from("teams").select("id").eq("hackathon_id", hackathonId).eq("team_code", teamCode).single();
  if (existing) return { error: `Team ID '${teamCode}' is already in use.` };

  const { error } = await supabase
    .from("teams")
    .insert({ 
      hackathon_id: hackathonId, 
      name, 
      members, 
      team_code: teamCode,
      leader_name: leaderName,
      email: leaderEmail,
      phone: leaderPhone
    });

  if (error) return { error: error.message };
  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in addTeam:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function importTeamsCSV(hackathonId, rows) {
  try {
  if (!rows?.length) return { error: "No rows to import." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  const payload = rows
    .filter((r) => r.name?.trim())
    .map((r) => ({
      hackathon_id: hackathonId,
      name: sanitize(r.name.trim()),
      members: sanitize(r.members || ""),
      team_code: sanitize(r.teamCode || ""),
    }));

  if (payload.length === 0) return { error: "No valid rows found." };

  const { error } = await supabase.from("teams").insert(payload);
  if (error) return { error: error.message };

  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  return { error: null, count: payload.length };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in importTeamsCSV:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteTeam(hackathonId, teamId) {
  try {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  await supabase.from("teams").delete().eq("id", teamId);
  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in deleteTeam:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function editTeam(hackathonId, teamId, formData) {
  try {
  const name = sanitize(formData.get("name")?.toString().trim());
  const leaderName = sanitize(formData.get("leaderName")?.toString().trim());
  const leaderEmail = sanitize(formData.get("leaderEmail")?.toString().trim());
  const leaderPhone = sanitize(formData.get("leaderPhone")?.toString().trim());
  const members = formData.get("members")?.toString() || "[]";
  const teamCode = sanitize(formData.get("teamCode")?.toString().trim().toUpperCase());

  if (!name) return { error: "Team name is required." };
  if (!leaderName) return { error: "Leader name is required." };
  if (!teamCode) return { error: "Team ID is required." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  // Enforce unique team_code for this hackathon (excluding current team)
  const { data: existing } = await supabase.from("teams").select("id").eq("hackathon_id", hackathonId).eq("team_code", teamCode).neq("id", teamId).single();
  if (existing) return { error: `Team ID '${teamCode}' is already in use.` };

  const { error } = await supabase
    .from("teams")
    .update({ 
      name, 
      members, 
      team_code: teamCode,
      leader_name: leaderName,
      email: leaderEmail,
      phone: leaderPhone
    })
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId);

  if (error) return { error: error.message };
  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in editTeam:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── Judges ──────────────────────────────────────────────────
export async function addJudge(hackathonId, formData) {
  try {
  const name = sanitize(formData.get("name")?.toString().trim());
  const company = sanitize(formData.get("company")?.toString().trim());
  const designation = sanitize(formData.get("designation")?.toString().trim());
  const judgeCode = sanitize(formData.get("judgeCode")?.toString().trim());
  const password = formData.get("password")?.toString().trim();

  if (!judgeCode || !password || !name) return { error: "Name, Judge ID, and password are required." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: e.message };
  }
  const email = judgeEmail(judgeCode);

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "judge", judge_code: judgeCode },
  });

  if (authError) return { error: authError.message };

  const { error } = await supabase.from("judges").insert({
    hackathon_id: hackathonId,
    judge_code: judgeCode,
    auth_user_id: authUser.user.id,
    name,
    company,
    designation,
  });

  if (error) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: error.message };
  }

  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in addJudge:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function importJudgesCSV(hackathonId, rows) {
  try {
  if (!rows?.length) return { error: "No rows to import." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };

  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  const admin = createAdminClient();
  const validRows = rows.filter((r) => r.name?.trim() && r.judgeCode?.trim() && r.password?.trim() && r.password.trim().length >= 6);

  if (validRows.length === 0) return { error: "No valid rows found. Ensure Name, Judge ID, and Password (min 6 chars) are provided." };

  let count = 0;
  let errors = [];

  for (const r of validRows) {
    const name = sanitize(r.name.trim());
    const judgeCode = sanitize(r.judgeCode.trim());
    const password = r.password.trim();
    const company = sanitize(r.company?.trim() || "");
    const designation = sanitize(r.designation?.trim() || "");
    const email = judgeEmail(judgeCode);

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "judge", judge_code: judgeCode },
    });

    if (authError) {
      errors.push(`Failed for ${name}: ${authError.message}`);
      continue;
    }

    const { error: dbError } = await supabase.from("judges").insert({
      hackathon_id: hackathonId,
      judge_code: judgeCode,
      auth_user_id: authUser.user.id,
      name,
      company,
      designation,
    });

    if (dbError) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      errors.push(`Failed for ${name}: ${dbError.message}`);
      continue;
    }

    count++;
  }

  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  
  if (count === 0) {
    return { error: errors.join(" | ") || "Import failed." };
  } else if (errors.length > 0) {
    return { error: `Imported ${count} judges, but had errors: ${errors.join(" | ")}` };
  }
  return { error: null, count };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in importJudgesCSV:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteJudge(hackathonId, judgeId, authUserId) {
  try {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  await supabase.from("judges").delete().eq("id", judgeId);

  if (authUserId) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(authUserId);
    } catch (e) {
      console.error("Failed to delete auth user:", e.message);
    }
  }

  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in deleteJudge:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── Rounds ──────────────────────────────────────────────────
export async function createRound(hackathonId, formData) {
  try {
  const name = sanitize(formData.get("name")?.toString().trim());
  const orderIndex = Number(formData.get("orderIndex")) || 1;

  if (!name) return { error: "Round name is required." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  const { data, error } = await supabase
    .from("rounds")
    .insert({ hackathon_id: hackathonId, name, order_index: orderIndex })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  redirect(`/organizer/hackathons/${hackathonId}/rounds/${data.id}`);
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in createRound:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function setRoundStatus(hackathonId, roundId, status) {
  try {
  if (!["upcoming", "active", "completed"].includes(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  await supabase.from("rounds").update({ status }).eq("id", roundId);
  revalidatePath(`/organizer/hackathons/${hackathonId}/rounds/${roundId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in setRoundStatus:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── Criteria ────────────────────────────────────────────────
export async function addCriterion(hackathonId, roundId, formData) {
  try {
  const name = sanitize(formData.get("name")?.toString().trim());
  const maxScore = Number(formData.get("maxScore")) || 10;
  const weight = Number(formData.get("weight")) || 1.0;

  if (!name) return { error: "Criterion name is required." };
  if (maxScore <= 0) return { error: "Max score must be positive." };
  if (weight <= 0) return { error: "Weight must be positive." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  const { error } = await supabase.from("criteria").insert({ round_id: roundId, name, max_score: maxScore, weight });

  if (error) return { error: error.message };
  revalidatePath(`/organizer/hackathons/${hackathonId}/rounds/${roundId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in addCriterion:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteCriterion(hackathonId, roundId, criterionId) {
  try {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  await supabase.from("criteria").delete().eq("id", criterionId);
  revalidatePath(`/organizer/hackathons/${hackathonId}/rounds/${roundId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in deleteCriterion:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── Round team selection (advancement) ────────────────────
export async function setRoundTeams(hackathonId, roundId, teamIds) {
  try {
  if (!Array.isArray(teamIds)) return { error: "Invalid teams array." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  await supabase.from("round_teams").delete().eq("round_id", roundId);

  if (teamIds.length) {
    const rows = teamIds.map((teamId) => ({ round_id: roundId, team_id: String(teamId) }));
    const { error } = await supabase.from("round_teams").insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath(`/organizer/hackathons/${hackathonId}/rounds/${roundId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in setRoundTeams:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function autoAdvanceTopN(hackathonId, roundId, previousRoundId, topN) {
  try {
  if (topN <= 0) return { error: "Top N must be a positive number." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  const { data: criteria } = await supabase.from("criteria").select("id, weight").eq("round_id", previousRoundId);
  const weights = {};
  if (criteria) criteria.forEach(c => weights[c.id] = Number(c.weight) || 1.0);

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("team_id, score_details(criterion_id, value)")
    .eq("round_id", previousRoundId);

  if (error) return { error: error.message };

  const totalsByTeam = {};
  for (const sub of submissions) {
    const total = (sub.score_details || []).reduce((sum, s) => sum + (Number(s.value) * (weights[s.criterion_id] || 1.0)), 0);
    if (!totalsByTeam[sub.team_id]) totalsByTeam[sub.team_id] = [];
    totalsByTeam[sub.team_id].push(total);
  }

  const ranked = Object.entries(totalsByTeam)
    .map(([teamId, totals]) => ({
      teamId,
      finalScore: totals.reduce((a, b) => a + b, 0) / totals.length,
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, topN)
    .map((r) => r.teamId);

  return setRoundTeams(hackathonId, roundId, ranked);
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in autoAdvanceTopN:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── Judge ↔ team assignment ────────────────────────────────
export async function setJudgeAssignments(hackathonId, roundId, judgeId, teamIds) {
  try {
  if (!Array.isArray(teamIds)) return { error: "Invalid teams array." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  await supabase.from("round_judge_assignments").delete().eq("round_id", roundId).eq("judge_id", judgeId);

  if (teamIds.length) {
    const rows = teamIds.map((teamId) => ({ round_id: roundId, judge_id: judgeId, team_id: String(teamId) }));
    const { error } = await supabase.from("round_judge_assignments").insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath(`/organizer/hackathons/${hackathonId}/rounds/${roundId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in setJudgeAssignments:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function bulkAssignJudges(hackathonId, roundId, judgeIds, teamIds, strategy) {
  try {
  if (!Array.isArray(judgeIds) || !Array.isArray(teamIds)) return { error: "Invalid arrays." };
  
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Unauthorized" };
  
  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

  await supabase.from("round_judge_assignments").delete().eq("round_id", roundId);

  if (judgeIds.length === 0 || teamIds.length === 0) {
    revalidatePath(`/organizer/hackathons/${hackathonId}/rounds/${roundId}`);
    return { error: null };
  }

  const rows = [];
  
  if (strategy === "all") {
    // Every judge evaluates every team
    for (const jId of judgeIds) {
      for (const tId of teamIds) {
        rows.push({ round_id: roundId, judge_id: jId, team_id: String(tId) });
      }
    }
  } else if (strategy === "round_robin") {
    // Equal load, minimum overlap
    // For each team, assign to N judges (let's say 2)
    const JUDGES_PER_TEAM = Math.min(2, judgeIds.length);
    let judgeIndex = 0;
    
    for (const tId of teamIds) {
      for (let i = 0; i < JUDGES_PER_TEAM; i++) {
        rows.push({ round_id: roundId, judge_id: judgeIds[judgeIndex], team_id: String(tId) });
        judgeIndex = (judgeIndex + 1) % judgeIds.length;
      }
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("round_judge_assignments").insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath(`/organizer/hackathons/${hackathonId}/rounds/${roundId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in bulkAssignJudges:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ==========================================
// STAFF (Registration Desk / Food Stall)
// ==========================================

export async function addStaff({ hackathonId, name, role }) {
  try {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Not logged in" };

  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Unauthorized" };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { error: e.message };
  }

  // Generate random credentials
  const staffCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const password = Math.random().toString(36).substring(2, 10);
  const email = `${staffCode.toLowerCase()}@staff.hu.local`;

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, staff_code: staffCode },
  });

  if (authError) return { error: authError.message };

  const { error } = await supabase.from("staff").insert({
    hackathon_id: hackathonId,
    name,
    role,
    staff_code: staffCode,
    auth_user_id: authUser.user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  return { error: null, credentials: { staffCode, password } };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in addStaff:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteStaff(hackathonId, staffId) {
  try {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Not logged in" };

  const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
  if (hackathon?.created_by !== userData.user.id) return { error: "Unauthorized" };

  const { data: staff } = await supabase.from("staff").select("auth_user_id").eq("id", staffId).single();

  await supabase.from("staff").delete().eq("id", staffId);

  if (staff?.auth_user_id) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(staff.auth_user_id);
    } catch (e) {
      console.error("Failed to delete auth user:", e.message);
    }
  }

  revalidatePath(`/organizer/hackathons/${hackathonId}`);
  return { error: null };
  } catch (err) {
    if (err?.message === 'NEXT_REDIRECT' || err?.message === 'NEXT_NOT_FOUND' || (err?.digest && (err.digest.startsWith('NEXT_REDIRECT') || err.digest.startsWith('NEXT_NOT_FOUND')))) throw err;
    console.error("Error in deleteStaff:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function saveBulkAssignments(hackathonId, roundId, assignments) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Not logged in" };

  // Use admin client for the RPC call
  const admin = createAdminClient();
  
  // The RPC requires assignments to be a JSON array of {judge_id, team_id}
  // The RPC itself will do the hackathon owner validation and atomic update
  const { error } = await admin.rpc('bulk_assign_judges', {
    p_round_id: roundId,
    p_assignments: assignments.map(a => ({ judge_id: a.judge_id, team_id: a.team_id }))
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/organizer/hackathons/${hackathonId}/rounds/${roundId}`);
  return { success: true };
}

export async function setRoundVisibility(hackathonId, roundId, isPublic) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { error: "Unauthorized" };
    
    const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
    if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

    const { error } = await supabase.from("rounds").update({ is_public: isPublic }).eq("id", roundId);
    if (error) return { error: error.message };

    revalidatePath(`/organizer/hackathons/${hackathonId}/rounds/${roundId}`);
    return { error: null };
  } catch (err) {
    console.error("Error in setRoundVisibility:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteHackathon(hackathonId) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { error: "Unauthorized" };

    const { data: hackathon } = await supabase.from("hackathons").select("created_by").eq("id", hackathonId).single();
    if (hackathon?.created_by !== userData.user.id) return { error: "Forbidden" };

    const { error } = await supabase.from("hackathons").delete().eq("id", hackathonId);
    if (error) return { error: error.message };

    revalidatePath(`/organizer/dashboard`);
    return { error: null };
  } catch (err) {
    console.error("Error in deleteHackathon:", err);
    return { error: err.message || "An unexpected error occurred." };
  }
}

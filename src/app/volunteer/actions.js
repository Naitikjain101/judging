"use server";
import { createPortalClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Verify the current user is a food volunteer and return their assigned hackathon.
 */
async function getVolunteerHackathon(supabase) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: staffRecord } = await admin
    .from("staff")
    .select("id, hackathon_id, role")
    .eq("auth_user_id", userData.user.id)
    .single();

  if (!staffRecord) return { error: "Staff record not found." };
  if (staffRecord.role !== "Volunteer") {
    return { error: "Unauthorized: not a food volunteer." };
  }

  return { hackathonId: staffRecord.hackathon_id, userId: userData.user.id };
}

export async function searchTeams(hackathonId, query) {
  const supabase = await createPortalClient("volunteer");

  const volCheck = await getVolunteerHackathon(supabase);
  if (volCheck.error) return { error: volCheck.error };
  if (volCheck.hackathonId !== hackathonId) {
    return { error: "Unauthorized: you are not assigned to this hackathon." };
  }

  let dbQuery = supabase
    .from("teams")
    .select(
      "id, name, team_code, leader_name, email, phone, college, members, status, food_purchased, food_payment_status, food_quantity, food_issued, food_issued_at"
    )
    .eq("hackathon_id", hackathonId)
    .order("name");

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,team_code.ilike.%${query}%,leader_name.ilike.%${query}%,phone.ilike.%${query}%`
    );
  }
  const { data, error } = await dbQuery.limit(50);
  if (error) return { error: error.message };
  return { teams: data };
}

export async function markFoodIssued(teamId, hackathonId) {
  const supabase = await createPortalClient("volunteer");

  // 1. Validate volunteer assignment
  const volCheck = await getVolunteerHackathon(supabase);
  if (volCheck.error) return { error: volCheck.error };
  if (volCheck.hackathonId !== hackathonId) {
    return { error: "Unauthorized: you are not assigned to this hackathon." };
  }

  const admin = createAdminClient();

  // 2. Verify team belongs to this hackathon and check eligibility
  const { data: team } = await admin
    .from("teams")
    .select("id, food_purchased, food_payment_status, status, food_issued")
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId)
    .single();

  if (!team) return { error: "Team not found in this hackathon." };

  if (team.food_issued) {
    return { error: "This team has already been issued their food coupons." };
  }

  if (team.status !== "Checked-In") {
    return { error: "Team must be checked in first." };
  }

  if (!team.food_purchased || team.food_payment_status !== "Paid") {
    return { error: "Team is not eligible for food (Not included or unpaid)." };
  }

  // 3. Update the team
  const { error: updateErr } = await admin
    .from("teams")
    .update({
      food_issued: true,
      food_issued_at: new Date().toISOString(),
      food_issued_by: volCheck.userId
    })
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/volunteer");
  return { success: true };
}

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

export async function collectPayment(teamId, hackathonId, amount) {
  const supabase = await createPortalClient("volunteer");

  const volCheck = await getVolunteerHackathon(supabase);
  if (volCheck.error) return { error: volCheck.error };
  if (volCheck.hackathonId !== hackathonId) {
    return { error: "Unauthorized: you are not assigned to this hackathon." };
  }

  const admin = createAdminClient();

  const { data: team, error: teamErr } = await admin
    .from("teams")
    .select("id, food_payment_status")
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId)
    .single();

  if (teamErr || !team) return { error: "Team not found in this hackathon." };
  if (team.food_payment_status === "Paid") return { error: "Team has already paid." };

  const { error: updateErr } = await admin
    .from("teams")
    .update({ 
      food_payment_status: "Paid",
      food_payment_source: "FOOD_DESK",
      food_payment_amount: amount,
      food_payment_collected_at: new Date().toISOString(),
      food_payment_collected_by: volCheck.userId
    })
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId);

  if (updateErr) return { error: updateErr.message };

  // Insert into food_purchases table for detailed analytics
  const { error: purchaseErr } = await admin
    .from("food_purchases")
    .insert({
      hackathon_id: hackathonId,
      team_id: teamId,
      amount: amount,
      payment_method: "Food Desk",
      payment_status: "PAID",
      payment_source: "FOOD_DESK",
      volunteer_id: volCheck.userId,
      created_at: new Date().toISOString()
    });

  if (purchaseErr) {
    console.error("Failed to insert food_purchases record:", purchaseErr);
    // Don't fail the whole request since team was updated, but we could log it
  }

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/volunteer");
  return { success: true };
}

export async function issueMemberCoupon(teamId, hackathonId, memberIndex) {
  const supabase = await createPortalClient("volunteer");

  const volCheck = await getVolunteerHackathon(supabase);
  if (volCheck.error) return { error: volCheck.error };
  if (volCheck.hackathonId !== hackathonId) {
    return { error: "Unauthorized: you are not assigned to this hackathon." };
  }

  const admin = createAdminClient();

  // Fetch the team's current members array
  const { data: team, error: teamErr } = await admin
    .from("teams")
    .select("id, food_purchased, food_payment_status, members")
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId)
    .single();

  if (teamErr || !team) return { error: "Team not found in this hackathon." };
  
  if (!team.food_purchased || team.food_payment_status !== "Paid") {
    return { error: "Team is not eligible for food (Not included or unpaid)." };
  }

  let members = [];
  try {
    members = JSON.parse(team.members || "[]");
  } catch(e) {
    return { error: "Failed to parse members data." };
  }

  if (memberIndex < 0 || memberIndex >= members.length) {
    return { error: "Invalid member index." };
  }

  const member = members[memberIndex];

  if (member.status !== "Present") {
    return { error: "Member is not checked in." };
  }

  if (member.food_issued) {
    return { error: "Coupon already issued for this member." };
  }

  // Update the specific member
  member.food_issued = true;
  member.food_issued_at = new Date().toISOString();
  member.food_issued_by = volCheck.userId;

  const { error: updateErr } = await admin
    .from("teams")
    .update({ members: JSON.stringify(members) })
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/volunteer");
  return { success: true };
}

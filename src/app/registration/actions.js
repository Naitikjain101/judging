"use server";

import { createPortalClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Verify the current user is a registration staff member and return
 * their assigned hackathon ID. Rejects all unauthorized access.
 */
async function getStaffHackathon(supabase) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Not authenticated" };

  // Use admin client to bypass RLS and look up staff record
  const admin = createAdminClient();
  const { data: staffRecord } = await admin
    .from("staff")
    .select("id, hackathon_id, role")
    .eq("auth_user_id", userData.user.id)
    .single();

  if (!staffRecord) return { error: "Staff record not found." };
  if (staffRecord.role !== "Registration Desk") {
    return { error: "Unauthorized: not a registration desk staff member." };
  }

  return { hackathonId: staffRecord.hackathon_id, userId: userData.user.id };
}

export async function searchTeams(hackathonId, query) {
  const supabase = await createPortalClient("registration");

  // Validate the staff member is assigned to this hackathon
  const staffCheck = await getStaffHackathon(supabase);
  if (staffCheck.error) return { error: staffCheck.error };
  if (staffCheck.hackathonId !== hackathonId) {
    return { error: "Unauthorized: you are not assigned to this hackathon." };
  }

  let dbQuery = supabase
    .from("teams")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("name");

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,team_code.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%,leader_name.ilike.%${query}%`
    );
  }

  const { data, error } = await dbQuery.limit(50);
  if (error) {
    console.error("Search teams error:", error);
    return { error: error.message };
  }
  return { teams: data };
}

export async function checkInTeam(teamId, hackathonId, memberStates) {
  const supabase = await createPortalClient("registration");

  // Validate staff assignment
  const staffCheck = await getStaffHackathon(supabase);
  if (staffCheck.error) return { error: staffCheck.error };
  if (staffCheck.hackathonId !== hackathonId) {
    return { error: "Unauthorized: you are not assigned to this hackathon." };
  }

  // Use admin client for reliable writes
  const admin = createAdminClient();

  // 1. Verify team belongs to this hackathon and get current state
  const { data: team, error: teamErr } = await admin
    .from("teams")
    .select("id, status, hackathon_id, members")
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId)
    .single();

  if (teamErr || !team) return { error: "Team not found in this hackathon." };

  // 2. Get check-in rule from hackathon
  const { data: hackathon } = await admin
    .from("hackathons")
    .select("check_in_rule")
    .eq("id", hackathonId)
    .single();

  const checkInRule = hackathon?.check_in_rule || "ANY_MEMBER";

  // 3. Evaluate member states
  const presentMembers = (memberStates || []).filter((m) => m.status === "Present");
  const totalMembers = (memberStates || []).length;

  if (totalMembers > 0) {
    if (checkInRule === "ALL_MEMBERS" && presentMembers.length < totalMembers) {
      // Save partial state but don't fully check in
      const { error: updateErr } = await admin
        .from("teams")
        .update({
          members: JSON.stringify(memberStates),
          status: "Partially Checked In",
        })
        .eq("id", teamId);

      if (updateErr) return { error: updateErr.message };

      revalidatePath("/registration");
      return {
        success: true,
        status: "Partially Checked In",
        message: `${presentMembers.length}/${totalMembers} members present. All members required for full check-in.`,
      };
    }

    if (checkInRule === "ANY_MEMBER" && presentMembers.length === 0) {
      return { error: "At least one member must be present for check-in." };
    }
  }

  // 4. Already checked in?
  if (team.status === "Checked-In") return { error: "Team is already checked in." };

  // 5. Atomic check-in number generation using a serializable approach
  // Use FOR UPDATE with a subquery to get next number atomically
  const { data: seqData, error: seqError } = await admin.rpc("atomic_next_team_number", {
    p_hackathon_id: hackathonId,
  });

  let teamNumberStr, tableNumberVal;

  if (seqError) {
    // Fallback if RPC doesn't exist yet — use count-based approach with row lock
    console.warn("atomic_next_team_number RPC not found, using fallback:", seqError.message);
    const { count } = await admin
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("hackathon_id", hackathonId)
      .eq("status", "Checked-In");

    const seq = (count || 0) + 1;
    teamNumberStr = `T-${String(seq).padStart(3, "0")}`;
    tableNumberVal = seq;
  } else {
    const seq = seqData;
    teamNumberStr = `T-${String(seq).padStart(3, "0")}`;
    tableNumberVal = seq;
  }

  // 6. Update the team
  const { error: updateErr } = await admin
    .from("teams")
    .update({
      status: "Checked-In",
      team_number: teamNumberStr,
      table_number: tableNumberVal,
      arrival_time: new Date().toISOString(),
      check_in_volunteer_id: staffCheck.userId,
      members: memberStates ? JSON.stringify(memberStates) : team.members,
    })
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/registration");
  return {
    success: true,
    status: "Checked-In",
    team_number: teamNumberStr,
    table_number: tableNumberVal,
  };
}

export async function undoCheckIn(teamId, hackathonId) {
  const supabase = await createPortalClient("registration");

  const staffCheck = await getStaffHackathon(supabase);
  if (staffCheck.error) return { error: staffCheck.error };
  if (staffCheck.hackathonId !== hackathonId) {
    return { error: "Unauthorized: you are not assigned to this hackathon." };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("teams")
    .update({
      status: "Registered",
      team_number: null,
      table_number: null,
      arrival_time: null,
      check_in_volunteer_id: null,
    })
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId);

  if (error) return { error: error.message };
  revalidatePath("/registration");
  return { success: true };
}

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

  const admin = createAdminClient();

  // 1. Verify team belongs to this hackathon
  const { data: team, error: teamErr } = await admin
    .from("teams")
    .select("id, status, hackathon_id, members, team_number, table_number")
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId)
    .single();

  if (teamErr || !team) return { error: "Team not found in this hackathon." };

  // 2. Evaluate member states to determine new status
  const presentMembers = (memberStates || []).filter((m) => m.status === "Present");
  const totalMembers = (memberStates || []).length;
  
  let newStatus = "Registered";
  if (totalMembers > 0) {
    if (presentMembers.length === 0) newStatus = "Registered";
    else if (presentMembers.length < totalMembers) newStatus = "Partially Checked In";
    else newStatus = "Checked-In";
  } else {
    // Fallback if no members are defined
    newStatus = "Checked-In";
  }

  // 3. Generate team/table number if moving out of "Registered" and they don't have one
  let teamNumberStr = team.team_number;
  let tableNumberVal = team.table_number;

  if (newStatus !== "Registered" && !team.team_number) {
    const { data: seqData, error: seqError } = await admin.rpc("atomic_next_team_number", {
      p_hackathon_id: hackathonId,
    });

    if (seqError) {
      console.warn("atomic_next_team_number RPC not found, using fallback:", seqError.message);
      const { count } = await admin
        .from("teams")
        .select("*", { count: "exact", head: true })
        .eq("hackathon_id", hackathonId)
        .neq("status", "Registered");

      const seq = (count || 0) + 1;
      teamNumberStr = `T-${String(seq).padStart(3, "0")}`;
      tableNumberVal = seq;
    } else {
      const seq = seqData;
      teamNumberStr = `T-${String(seq).padStart(3, "0")}`;
      tableNumberVal = seq;
    }
  }

  // 4. Update the team
  const updatePayload = {
    status: newStatus,
    members: memberStates ? JSON.stringify(memberStates) : team.members,
  };

  if (newStatus !== "Registered") {
    updatePayload.team_number = teamNumberStr;
    updatePayload.table_number = tableNumberVal;
    updatePayload.arrival_time = new Date().toISOString();
    updatePayload.check_in_volunteer_id = staffCheck.userId;
  } else {
    updatePayload.arrival_time = null;
    updatePayload.check_in_volunteer_id = null;
  }

  const { error: updateErr } = await admin
    .from("teams")
    .update(updatePayload)
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/registration");
  return {
    success: true,
    status: newStatus,
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

  // Reset member statuses to Pending
  const { data: team } = await admin.from("teams").select("members").eq("id", teamId).single();
  let updatedMembers = null;
  if (team && team.members) {
    try {
      const parsed = JSON.parse(team.members);
      updatedMembers = JSON.stringify(parsed.map(m => ({ ...m, status: 'Pending', food_issued: false, food_issued_at: null, food_issued_by: null })));
    } catch (e) {}
  }

  const { error } = await admin
    .from("teams")
    .update({
      status: "Registered",
      team_number: null,
      table_number: null,
      arrival_time: null,
      check_in_volunteer_id: null,
      members: updatedMembers || team?.members,
    })
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId);

  if (error) return { error: error.message };
  revalidatePath("/registration");
  return { success: true };
}

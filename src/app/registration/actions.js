"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function searchTeams(hackathonId, query) {
  const supabase = await createClient();
  
  let dbQuery = supabase
    .from("teams")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("name");

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,team_code.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%,leader_name.ilike.%${query}%`);
  }

  const { data, error } = await dbQuery.limit(50);
  if (error) {
    console.error("Search teams error:", error);
    return { error: error.message };
  }
  return { teams: data };
}

export async function checkInTeam(teamId, hackathonId) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) return { error: "Not authenticated" };

  // 1. Verify team isn't already checked in
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("status")
    .eq("id", teamId)
    .single();

  if (teamErr) return { error: teamErr.message };
  if (team.status === "Checked-In") return { error: "Team is already checked in" };

  // 2. Determine the next team number and table number
  // Using a serializable transaction or count. 
  // In a real high-concurrency event, we might need a stored procedure.
  // For now, we will query the count of currently checked-in teams.
  const { count, error: countErr } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })
    .eq("hackathon_id", hackathonId)
    .eq("status", "Checked-In");

  if (countErr) return { error: countErr.message };

  const sequenceNumber = count + 1;
  const teamNumberStr = `T-${String(sequenceNumber).padStart(3, '0')}`;
  const tableNumberStr = sequenceNumber;

  // 3. Update the team
  const { error: updateErr } = await supabase
    .from("teams")
    .update({
      status: "Checked-In",
      team_number: teamNumberStr,
      table_number: tableNumberStr,
      arrival_time: new Date().toISOString(),
      check_in_volunteer_id: userData.user.id
    })
    .eq("id", teamId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/registration");
  return { success: true, team_number: teamNumberStr, table_number: tableNumberStr };
}

export async function undoCheckIn(teamId) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("teams")
    .update({
      status: "Registered",
      team_number: null,
      table_number: null,
      arrival_time: null,
      check_in_volunteer_id: null
    })
    .eq("id", teamId);

  if (error) return { error: error.message };
  revalidatePath("/registration");
  return { success: true };
}

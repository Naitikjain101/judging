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
      "*, food_purchases(id, package_id, amount), coupon_distributions(id, package_id, created_at)"
    )
    .eq("hackathon_id", hackathonId)
    .order("name");

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,team_code.ilike.%${query}%,phone.ilike.%${query}%`
    );
  }
  const { data, error } = await dbQuery.limit(20);
  if (error) return { error: error.message };
  return { teams: data };
}

export async function distributeCoupon(teamId, hackathonId, packageId, paymentMethod, amount) {
  const supabase = await createPortalClient("volunteer");

  // 1. Validate volunteer assignment
  const volCheck = await getVolunteerHackathon(supabase);
  if (volCheck.error) return { error: volCheck.error };
  if (volCheck.hackathonId !== hackathonId) {
    return { error: "Unauthorized: you are not assigned to this hackathon." };
  }

  const admin = createAdminClient();

  // 2. Verify team belongs to this hackathon
  const { data: team } = await admin
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("hackathon_id", hackathonId)
    .single();

  if (!team) return { error: "Team not found in this hackathon." };

  // 3. Verify package belongs to this hackathon
  const { data: pkg } = await admin
    .from("food_packages")
    .select("id, price")
    .eq("id", packageId)
    .eq("hackathon_id", hackathonId)
    .single();

  if (!pkg) return { error: "Package not found in this hackathon." };

  // 4. Check for duplicate coupon distribution (the DB UNIQUE constraint
  //    provides the real guarantee, but we check first for a better error msg)
  const { data: existing } = await admin
    .from("coupon_distributions")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .eq("team_id", teamId)
    .eq("package_id", packageId)
    .maybeSingle();

  if (existing) {
    return { error: "This coupon has already been issued to this team." };
  }

  // 5. Record purchase if amount > 0
  if (amount > 0 && paymentMethod && paymentMethod !== "Prepaid") {
    if (!["Cash", "UPI", "Card"].includes(paymentMethod)) {
      return { error: "Invalid payment method." };
    }
    const { error: purchaseErr } = await admin.from("food_purchases").insert({
      hackathon_id: hackathonId,
      team_id: teamId,
      package_id: packageId,
      payment_method: paymentMethod,
      amount: amount,
      volunteer_id: volCheck.userId,
    });
    if (purchaseErr) return { error: purchaseErr.message };
  }

  // 6. Record coupon distribution (UNIQUE constraint prevents duplicates)
  const { error: distErr } = await admin.from("coupon_distributions").insert({
    hackathon_id: hackathonId,
    team_id: teamId,
    package_id: packageId,
    volunteer_id: volCheck.userId,
  });

  if (distErr) {
    // Duplicate key violation
    if (distErr.code === "23505") {
      return { error: "This coupon has already been issued to this team." };
    }
    return { error: distErr.message };
  }

  revalidatePath("/volunteer");
  return { success: true };
}

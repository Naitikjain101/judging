"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function searchTeams(hackathonId, query) {
  const supabase = await createClient();
  let dbQuery = supabase
    .from("teams")
    .select("*, food_purchases(id, package_id, amount), coupon_distributions(id, package_id, created_at)")
    .eq("hackathon_id", hackathonId)
    .order("name");

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,team_code.ilike.%${query}%,phone.ilike.%${query}%`);
  }
  const { data, error } = await dbQuery.limit(20);
  if (error) return { error: error.message };
  return { teams: data };
}

export async function distributeCoupon(teamId, hackathonId, packageId, paymentMethod, amount) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: "Not authenticated" };

  // If amount > 0, record a purchase first
  if (amount > 0 && paymentMethod && paymentMethod !== 'Prepaid') {
    const { error: purchaseErr } = await supabase
      .from("food_purchases")
      .insert({
        hackathon_id: hackathonId,
        team_id: teamId,
        package_id: packageId,
        payment_method: paymentMethod,
        amount: amount,
        volunteer_id: userData.user.id
      });
    if (purchaseErr) return { error: purchaseErr.message };
  }

  // Record coupon distribution
  const { error: distErr } = await supabase
    .from("coupon_distributions")
    .insert({
      hackathon_id: hackathonId,
      team_id: teamId,
      package_id: packageId,
      volunteer_id: userData.user.id
    });

  if (distErr) return { error: distErr.message };

  revalidatePath("/volunteer");
  return { success: true };
}

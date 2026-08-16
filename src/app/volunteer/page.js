import { createClient } from "@/lib/supabase/server";
import TerminalPath from "@/components/TerminalPath";
import FoodDistribution from "@/components/volunteer/FoodDistribution";

export default async function VolunteerPage() {
  const supabase = await createClient();

  const { data: hackathons } = await supabase
    .from("hackathons")
    .select("id, name, status")
    .eq("status", "active");

  const { data: packages } = await supabase
    .from("food_packages")
    .select("*")
    .order("name");

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <TerminalPath user="volunteer" segments={["food-distribution"]} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="title" style={{ margin: 0 }}>Food Distribution</h1>
      </div>

      {hackathons && hackathons.length > 0 ? (
        <FoodDistribution hackathons={hackathons} packages={packages || []} />
      ) : (
        <div className="empty">No active hackathons found. Please wait.</div>
      )}
    </div>
  );
}

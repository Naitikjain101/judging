import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function wipe() {
  console.log("Wiping all hackathons (and cascading data)...");
  
  // Since we are using the service role key, we bypass RLS
  const { data, error } = await supabase
    .from('hackathons')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    console.error("Error wiping data:", error);
  } else {
    console.log("Successfully deleted all hackathons!");
  }
}

wipe();

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('hackathons').select('*').eq('id', '1d4c0f97-1ae5-4658-a3fd-b3013653c331');
  console.log('Result:', data, 'Error:', error);
}
run();

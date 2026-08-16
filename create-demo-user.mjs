import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemo() {
  const email = 'demo@organizer.com';
  const password = 'password123';
  
  console.log(`Creating demo user: ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('already registered')) {
       console.log('Demo user already exists!');
       return;
    }
    console.error('Error creating user:', error.message);
    return;
  }
  
  console.log('Success! Created demo user.');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

createDemo();

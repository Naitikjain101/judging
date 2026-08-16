import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";
  
  if (url === "https://dummy.supabase.co") {
    console.error("Missing Supabase env vars in client");
  }

  return createBrowserClient(url, key);
}

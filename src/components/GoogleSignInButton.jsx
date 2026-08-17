"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
  // Use 'public' portal namespace to force un-prefixed cookies for the initial OAuth flow
  const supabase = createClient("public");

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button onClick={handleGoogleSignIn} className="btn btn-secondary" type="button">
      Continue with Google
    </button>
  );
}

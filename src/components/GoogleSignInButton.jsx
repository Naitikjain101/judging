"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/organizer/auth/callback`,
      },
    });
  };

  return (
    <button onClick={handleGoogleSignIn} className="btn btn-secondary" type="button">
      Continue with Google
    </button>
  );
}

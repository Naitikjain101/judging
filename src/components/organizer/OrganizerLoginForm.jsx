"use client";

import { useFormState, useFormStatus } from "react-dom";
import { logInOrganizer } from "@/app/organizer/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      className="btn btn-primary" 
      disabled={pending}
      style={{ marginTop: 8 }}
    >
      {pending ? "Signing in..." : "Sign In with Email"}
    </button>
  );
}

export default function OrganizerLoginForm() {
  const [state, formAction] = useFormState(logInOrganizer, null);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {state?.error && <div className="alert alert-error">{state.error}</div>}
      
      <div>
        <label htmlFor="email" style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Email</label>
        <input 
          type="email" 
          id="email"
          name="email" 
          required 
          className="input" 
          placeholder="you@example.com"
          style={{ width: "100%" }}
        />
      </div>
      
      <div>
        <label htmlFor="password" style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Password</label>
        <input 
          type="password" 
          id="password"
          name="password" 
          required 
          className="input" 
          placeholder="••••••••"
          style={{ width: "100%" }}
        />
      </div>
      
      <SubmitButton />
    </form>
  );
}

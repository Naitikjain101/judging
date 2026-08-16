"use client";

import { useFormState } from "react-dom";
import { logInStaff } from "@/app/staff/actions";
import SubmitButton from "@/components/SubmitButton";

const initialState = { error: null };

export default function StaffLoginForm() {
  const [state, formAction] = useFormState(logInStaff, initialState);

  return (
    <>
      {state?.error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{state.error}</div>}

      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label htmlFor="staffCode" style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Staff Code</label>
          <input 
            type="text" 
            id="staffCode"
            name="staffCode" 
            required 
            autoFocus
            className="input" 
            placeholder="e.g. 5XY9QZ"
            style={{ width: "100%", textTransform: "uppercase" }}
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
        
        <SubmitButton pendingText="Signing In..." style={{ marginTop: 8 }}>Sign In</SubmitButton>
      </form>
    </>
  );
}

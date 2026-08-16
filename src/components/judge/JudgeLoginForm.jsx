"use client";

import { useFormState } from "react-dom";
import { logInJudge } from "@/app/judge/actions";
import SubmitButton from "@/components/SubmitButton";

const initialState = { error: null };

export default function JudgeLoginForm() {
  const [state, formAction] = useFormState(logInJudge, initialState);

  return (
    <>
      {state?.error && <div className="alert alert-error">{state.error}</div>}

      <form action={formAction} className="card">
        <div className="field">
          <label htmlFor="judgeCode">Judge ID</label>
          <input className="input mono" id="judgeCode" name="judgeCode" required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" required />
        </div>
        <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      </form>
    </>
  );
      }

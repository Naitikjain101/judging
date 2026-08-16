"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, className = "btn btn-primary", pendingText }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText || "Working…" : children}
    </button>
  );
}

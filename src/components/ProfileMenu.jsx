"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileMenu({ label, loginPath }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Hard navigation — forces middleware to re-check auth from scratch,
    // rather than relying on client router cache to reflect the new state.
    window.location.href = loginPath;
  }

  const initial = (label || "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-dim)",
          color: "var(--accent)",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          className="card"
          style={{ position: "absolute", right: 0, top: 42, minWidth: 210, padding: 12, zIndex: 30 }}
        >
          <div className="mono muted" style={{ fontSize: 12, marginBottom: 10, wordBreak: "break-all" }}>
            {label}
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: "100%" }} disabled={loggingOut}>
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

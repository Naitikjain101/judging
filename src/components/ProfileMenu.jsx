"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Profile menu with portal-aware sign-out.
 * The `portal` prop determines which portal's cookies to clear.
 * If not provided, it auto-detects from the URL.
 */
export default function ProfileMenu({ label, loginPath, portal }) {
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
    // Create a browser client scoped to this portal's cookies
    const supabase = createClient(portal);
    await supabase.auth.signOut();
    // Hard navigation to force middleware re-check
    window.location.href = loginPath || "/";
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

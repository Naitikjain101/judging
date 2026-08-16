"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";

export default function TerminalPath({ user = "guest", segments = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };
  // Map segments to potential links
  const getHref = (segment, index) => {
    if (segment === "dashboard" || segment === "hackathons") {
      return user === "organizer" ? "/organizer/dashboard" : "/judge/dashboard";
    }
    return null;
  };

  return (
    <div className="terminal-path" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="prompt">{user}@hu:~$</span>
      {segments.map((segment, i) => {
        const href = getHref(segment, i);
        return (
          <span className="segment" key={i}>
            {href ? (
              <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }} className="hover-link">
                {segment}
              </Link>
            ) : (
              segment
            )}
          </span>
        );
      })}
        <span className="terminal-cursor" aria-hidden="true" />
      </div>
      
      <button 
        onClick={handleRefresh} 
        disabled={isPending}
        className="btn btn-secondary btn-sm" 
        style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}
        title="Refresh Data"
      >
        <RefreshCw size={14} className={isPending ? "spin" : ""} />
        <span style={{ fontSize: '12px' }}>Refresh</span>
      </button>
    </div>
  );
}

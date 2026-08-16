"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Medal, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveLeaderboard({ leaderboard, maxTotal }) {
  const router = useRouter();

  useEffect(() => {
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="empty" style={{ padding: '4rem' }}>
        <div style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No scores submitted yet.</div>
        <div className="muted">The leaderboard will update automatically as judges submit scores.</div>
      </div>
    );
  }

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Trophy size={28} color="#FFD700" />; // Gold
      case 1: return <Medal size={28} color="#C0C0C0" />; // Silver
      case 2: return <Award size={28} color="#CD7F32" />; // Bronze
      default: return <span className="mono" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>#{index + 1}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AnimatePresence>
        {leaderboard.map((row, index) => (
          <motion.div
            key={row.teamId}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '1.5rem 2rem',
              background: index === 0 ? 'linear-gradient(to right, rgba(255, 215, 0, 0.1), transparent)' : 'var(--bg-elevated)',
              borderColor: index === 0 ? 'rgba(255, 215, 0, 0.3)' : 'var(--border-subtle)',
              borderWidth: index === 0 ? 2 : 1
            }}
          >
            <div style={{ width: 60, display: 'flex', justifyContent: 'center', marginRight: '1rem' }}>
              {getRankIcon(index)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: index < 3 ? '1.5rem' : '1.25rem', fontWeight: 600, color: index === 0 ? '#FFD700' : '#FFF' }}>
                {row.teamName}
              </div>
              {row.teamIdDisplay && <div className="muted mono text-sm mt-1">ID: {row.teamIdDisplay}</div>}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="score-big" style={{ fontSize: index < 3 ? '2.5rem' : '2rem', color: index === 0 ? '#FFD700' : 'var(--accent-primary)' }}>
                {row.finalScore.toFixed(1)}
              </div>
              <div className="muted text-sm mono">/ {maxTotal}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, UserCheck, Clock } from "lucide-react";

export default function JudgeProgressPanel({ judges, assignments, submissions }) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Calculate stats per judge
  const judgeStats = judges.map(j => {
    const assignedCount = assignments.filter(a => a.judge_id === j.id).length;
    const submittedCount = submissions.filter(s => s.judge_id === j.id && s.submitted).length;
    const progress = assignedCount > 0 ? (submittedCount / assignedCount) * 100 : 0;
    
    return {
      ...j,
      assignedCount,
      submittedCount,
      progress
    };
  }).filter(j => j.assignedCount > 0); // Only show judges with assignments

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  if (judgeStats.length === 0) return null;

  const totalAssigned = judgeStats.reduce((sum, j) => sum + j.assignedCount, 0);
  const totalSubmitted = judgeStats.reduce((sum, j) => sum + j.submittedCount, 0);
  const totalProgress = totalAssigned > 0 ? (totalSubmitted / totalAssigned) * 100 : 0;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h2 className="subtitle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserCheck size={20} /> Live Judging Progress
        </h2>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
          <span className="eyebrow" style={{ margin: 0 }}>Total Progress</span>
          <span className="mono text-sm">{totalSubmitted} / {totalAssigned} Teams</span>
        </div>
        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${totalProgress}%`, height: '100%', background: 'var(--success)', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {judgeStats.map(j => (
          <div key={j.id} style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{j.name}</div>
                <div className="muted text-xs mono">{j.judge_code}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="score-big" style={{ fontSize: '1.25rem', color: j.progress === 100 ? 'var(--success)' : 'var(--text)' }}>
                  {j.submittedCount}/{j.assignedCount}
                </div>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${j.progress}%`, height: '100%', background: j.progress === 100 ? 'var(--success)' : 'var(--accent-gradient)', transition: 'width 0.5s ease' }} />
            </div>
            {j.progress === 100 && (
              <div className="muted text-xs mt-2" style={{ color: 'var(--success)', textAlign: 'right', marginTop: '0.5rem' }}>
                <CheckCircle size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Done
              </div>
            )}
            {j.progress < 100 && (
              <div className="muted text-xs mt-2" style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <Clock size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> In Progress
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

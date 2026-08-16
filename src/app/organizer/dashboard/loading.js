export default function Loading() {
  return (
    <div className="shell">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="dot" />
            HU Judging
          </div>
        </div>
      </div>
      <div className="page animate-pulse" style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>
        <div style={{ width: 120, height: 20, background: "var(--border-focus)", borderRadius: 4, marginBottom: 24 }} />
        <div style={{ width: 200, height: 40, background: "var(--border-focus)", borderRadius: 6, marginBottom: 32 }} />
        
        <div style={{ display: "grid", gap: 16 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card" style={{ height: 100, background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }} />
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}} />
    </div>
  );
}

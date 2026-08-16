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
        <div style={{ width: 150, height: 20, background: "var(--border-focus)", borderRadius: 4, marginBottom: 24 }} />
        <div style={{ width: 280, height: 40, background: "var(--border-focus)", borderRadius: 6, marginBottom: 32 }} />
        
        <div className="scoring-layout">
          <div className="scoring-sidebar">
            <div style={{ width: 80, height: 16, background: "var(--border-focus)", borderRadius: 4, margin: "0 4px 8px" }} />
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 44, background: "var(--bg-elevated)", borderRadius: 6, marginBottom: 8 }} />
            ))}
          </div>
          <div className="scoring-main">
            <div className="card" style={{ height: 500, background: "var(--bg-elevated)", borderColor: "var(--border-subtle)" }} />
          </div>
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

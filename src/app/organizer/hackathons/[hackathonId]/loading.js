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
        <div style={{ width: 180, height: 20, background: "var(--border-focus)", borderRadius: 4, marginBottom: 24 }} />
        <div style={{ width: 300, height: 40, background: "var(--border-focus)", borderRadius: 6, marginBottom: 12 }} />
        <div style={{ width: 400, height: 20, background: "var(--border-subtle)", borderRadius: 4, marginBottom: 32 }} />
        
        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ width: 80, height: 36, background: "var(--bg-elevated)", borderRadius: 4 }} />
          ))}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 60, background: "var(--bg-elevated)", borderRadius: 6 }} />
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

"use client";
import { Users, Ticket, CheckCircle, PieChart, TrendingUp } from "lucide-react";

export default function AnalyticsPanel({ teams, packages, purchases, distributions }) {
  // Check-in Stats
  const checkedIn = teams.filter(t => t.status === "Checked-In").length;
  const pending = teams.filter(t => t.status === "Registered").length;
  const absent = teams.filter(t => t.status === "Absent").length;
  const checkInRate = teams.length ? Math.round((checkedIn / teams.length) * 100) : 0;

  // Food Stats
  const revenue = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const packageStats = packages.map(pkg => {
    const purchased = purchases.filter(p => p.package_id === pkg.id).length;
    const distributed = distributions.filter(d => d.package_id === pkg.id).length;
    return { ...pkg, purchased, distributed };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <div className="card">
          <div className="flex-between" style={{ marginBottom: "1rem" }}>
            <span className="eyebrow" style={{ margin: 0 }}>Check-in Rate</span>
            <Users size={18} className="muted" />
          </div>
          <div className="score-big" style={{ fontSize: "2.5rem" }}>{checkInRate}%</div>
          <div className="muted text-sm" style={{ marginTop: "0.5rem" }}>{checkedIn} of {teams.length} teams arrived</div>
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: "1rem" }}>
            <span className="eyebrow" style={{ margin: 0 }}>Total Revenue</span>
            <TrendingUp size={18} className="muted" />
          </div>
          <div className="score-big" style={{ fontSize: "2.5rem", color: "var(--success)" }}>₹{revenue}</div>
          <div className="muted text-sm" style={{ marginTop: "0.5rem" }}>From on-spot food sales</div>
        </div>

        <div className="card">
          <div className="flex-between" style={{ marginBottom: "1rem" }}>
            <span className="eyebrow" style={{ margin: 0 }}>Coupons Issued</span>
            <Ticket size={18} className="muted" />
          </div>
          <div className="score-big" style={{ fontSize: "2.5rem", color: "var(--accent-primary)" }}>{distributions.length}</div>
          <div className="muted text-sm" style={{ marginTop: "0.5rem" }}>Across all packages</div>
        </div>
      </div>

      {/* Package Breakdown */}
      <div>
        <h3 className="title" style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
          <PieChart size={18} color="var(--accent-primary)" /> Food Packages Breakdown
        </h3>
        
        {packageStats.length === 0 ? (
          <div className="empty">No food packages configured.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            {packageStats.map(pkg => (
              <div key={pkg.id} className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <h4 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{pkg.name}</h4>
                    <span className="badge">{pkg.type}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--success)" }}>
                    {pkg.price > 0 ? `₹${pkg.price}` : "Prepaid"}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
                  <div className="flex-between">
                    <span className="muted text-sm">On-spot Sales</span>
                    <span className="mono">{pkg.purchased}</span>
                  </div>
                  <div className="flex-between">
                    <span className="muted text-sm">Coupons Distributed</span>
                    <span className="mono" style={{ color: "var(--accent-primary)" }}>{pkg.distributed}</span>
                  </div>
                  
                  {/* Mini Progress bar */}
                  <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 4, marginTop: 4, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min((pkg.distributed / Math.max(teams.length, 1)) * 100, 100)}%`, height: "100%", background: "var(--accent-gradient)" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

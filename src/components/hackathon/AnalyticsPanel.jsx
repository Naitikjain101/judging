"use client";
import { useState } from "react";
import { Users, Ticket, CheckCircle, PieChart, Utensils, IndianRupee, ArrowLeft } from "lucide-react";

export default function AnalyticsPanel({ teams, purchases = [] }) {
  const [showDetails, setShowDetails] = useState(false);

  let totalMembers = 0;
  let checkedInMembers = 0;
  
  let eligibleMembers = 0;
  let issuedCoupons = 0;
  
  let prepaidRevenue = 0;
  let foodDeskRevenue = 0;
  let prepaidCount = 0;
  let foodDeskCount = 0;

  const purchasesByTeam = {};
  purchases.forEach(p => {
    if (!purchasesByTeam[p.team_id]) {
      purchasesByTeam[p.team_id] = [];
    }
    purchasesByTeam[p.team_id].push(p);
  });

  const teamsWithStats = teams.map(t => {
    let members = [];
    try { members = JSON.parse(t.members || "[]"); } catch(e) {}
    
    totalMembers += members.length;
    
    const presentMembers = members.filter(m => m.status === 'Present');
    checkedInMembers += presentMembers.length;
    
    const isPaid = t.food_payment_status === "Paid";
    let teamIssued = 0;
    
    let tPrepaidAmt = 0;
    let tFoodDeskAmt = 0;
    let tPrepaidCount = 0;
    let tFoodDeskCount = 0;

    const teamPurchases = purchasesByTeam[t.id] || [];
    teamPurchases.forEach(p => {
      if (p.payment_source === "PREPAID") {
        tPrepaidAmt += Number(p.amount || 0);
        tPrepaidCount++;
      } else if (p.payment_source === "FOOD_DESK") {
        tFoodDeskAmt += Number(p.amount || 0);
        tFoodDeskCount++;
      }
    });

    if (tPrepaidCount > 0) prepaidCount++;
    if (tFoodDeskCount > 0) foodDeskCount++;
    
    prepaidRevenue += tPrepaidAmt;
    foodDeskRevenue += tFoodDeskAmt;
    
    if (isPaid) {
      presentMembers.forEach(m => {
        eligibleMembers++;
        if (m.food_issued) {
          issuedCoupons++;
          teamIssued++;
        }
      });
    }

    return {
      ...t,
      memberCount: members.length,
      presentCount: presentMembers.length,
      teamIssued,
      tPrepaidAmt,
      tFoodDeskAmt,
      isPrepaid: tPrepaidCount > 0,
      isFoodDesk: tFoodDeskCount > 0
    };
  });

  const checkInRate = totalMembers > 0 ? Math.round((checkedInMembers / totalMembers) * 100) : 0;

  if (showDetails) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <button className="btn btn-secondary" style={{ alignSelf: "flex-start", display: "flex", gap: "0.5rem" }} onClick={() => setShowDetails(false)}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <h2 className="title" style={{ fontSize: "1.5rem", marginBottom: 0 }}>Food & Payment Accounts</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          <div className="card" style={{ borderTop: "4px solid var(--accent-primary)" }}>
            <div className="eyebrow">Prepaid Teams</div>
            <div className="score-big">{prepaidCount}</div>
            <div className="muted text-sm" style={{ marginTop: "0.5rem" }}>Amount: ₹{prepaidRevenue}</div>
          </div>
          <div className="card" style={{ borderTop: "4px solid var(--success)" }}>
            <div className="eyebrow">Paid at Food Desk</div>
            <div className="score-big">{foodDeskCount}</div>
            <div className="muted text-sm" style={{ marginTop: "0.5rem" }}>Amount: ₹{foodDeskRevenue}</div>
          </div>
          <div className="card" style={{ borderTop: "4px solid var(--border-focus)" }}>
            <div className="eyebrow">Total Food Revenue Collected</div>
            <div className="score-big">₹{prepaidRevenue + foodDeskRevenue}</div>
          </div>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Members (Present)</th>
                  <th>Food Status</th>
                  <th>Payment Type</th>
                  <th>Amount</th>
                  <th>Coupons Issued</th>
                </tr>
              </thead>
              <tbody>
                {teamsWithStats.map(t => {
                  const isPaid = t.food_payment_status === "Paid";
                  
                  // Compute display status based on the new logic
                  let paymentType = "-";
                  let amountDisplay = "-";
                  
                  if (t.isPrepaid && t.isFoodDesk) {
                    paymentType = "Mixed";
                    amountDisplay = `₹${t.tPrepaidAmt + t.tFoodDeskAmt}`;
                  } else if (t.isPrepaid) {
                    paymentType = "PREPAID";
                    amountDisplay = `₹${t.tPrepaidAmt}`;
                  } else if (t.isFoodDesk) {
                    paymentType = "FOOD DESK";
                    amountDisplay = `₹${t.tFoodDeskAmt}`;
                  } else if (isPaid) {
                     // Fallback for migrated or not-yet-synced records
                    paymentType = (t.food_payment_source === "FOOD_DESK") ? "FOOD DESK" : "PREPAID";
                    amountDisplay = t.food_payment_amount > 0 ? `₹${t.food_payment_amount}` : "-";
                  }

                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div className="mono text-sm muted">{t.team_code}</div>
                      </td>
                      <td>{t.memberCount} ({t.presentCount})</td>
                      <td>
                        {isPaid ? (
                          <span className="badge badge-active">Paid</span>
                        ) : (
                          <span className="badge badge-warning">Unpaid</span>
                        )}
                      </td>
                      <td>{isPaid ? paymentType : "-"}</td>
                      <td className="mono">{isPaid ? amountDisplay : "-"}</td>
                      <td>
                        {isPaid ? `${t.teamIssued} / ${t.presentCount}` : "-"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        
        <div className="card">
          <div className="flex-between" style={{ marginBottom: "1rem" }}>
            <span className="eyebrow" style={{ margin: 0 }}>Member Check-in Rate</span>
            <Users size={18} className="muted" />
          </div>
          <div className="score-big" style={{ fontSize: "2.5rem" }}>{checkInRate}%</div>
          <div className="muted text-sm" style={{ marginTop: "0.5rem" }}>{checkedInMembers} / {totalMembers} members checked in</div>
        </div>

        <div 
          className="card" 
          style={{ cursor: "pointer", transition: "0.2s", border: "1px solid transparent" }}
          onClick={() => setShowDetails(true)}
          onMouseEnter={(e) => e.currentTarget.style.border = "1px solid var(--accent-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.border = "1px solid transparent"}
        >
          <div className="flex-between" style={{ marginBottom: "1rem" }}>
            <span className="eyebrow" style={{ margin: 0 }}>Coupons Issued</span>
            <Ticket size={18} className="muted" />
          </div>
          <div className="score-big" style={{ fontSize: "2.5rem", color: "var(--accent-primary)" }}>{issuedCoupons}</div>
          <div className="muted text-sm" style={{ marginTop: "0.5rem" }}>/ {eligibleMembers} eligible members</div>
          <div className="muted text-sm" style={{ marginTop: "1rem", color: "var(--accent-primary)", fontSize: "0.8rem", fontWeight: 600 }}>Click to view full Food Accounts &rarr;</div>
        </div>

      </div>
    </div>
  );
}

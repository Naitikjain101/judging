"use client";

import Link from "next/link";
import { createRound } from "@/app/organizer/hackathons/actions";
import SubmitButton from "@/components/SubmitButton";

export default function RoundsPanel({ hackathonId, rounds }) {
  async function handleAdd(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    await createRound(hackathonId, formData);
  }

  return (
    <div>
      <details className="card" style={{ marginBottom: 16 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>+ New round</summary>
        <form onSubmit={handleAdd} style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="round-name">Name</label>
            <input className="input" id="round-name" name="name" placeholder="e.g. Round 1, Finals" required />
          </div>
          <div className="field">
            <label htmlFor="round-order">Order</label>
            <input className="input" id="round-order" name="orderIndex" type="number" defaultValue={(rounds?.length || 0) + 1} />
          </div>
          <SubmitButton pendingText="Creating…">Create round</SubmitButton>
        </form>
      </details>

      {!rounds?.length && <div className="empty">No rounds yet.</div>}

      {rounds?.map((r) => (
        <Link
          key={r.id}
          href={`/organizer/hackathons/${hackathonId}/rounds/${r.id}`}
          className="card card-link"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>Order {r.order_index}</div>
          </div>
          <span className={`badge ${r.status === "active" ? "badge-active" : ""}`}>{r.status}</span>
        </Link>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCriterion, deleteCriterion } from "@/app/organizer/hackathons/actions";
import SubmitButton from "@/components/SubmitButton";

export default function CriteriaPanel({ hackathonId, roundId, criteria }) {
  const router = useRouter();
  const [error, setError] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await addCriterion(hackathonId, roundId, formData);
    if (res?.error) setError(res.error);
    else {
      setError(null);
      e.target.reset();
      router.refresh();
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2 className="subtitle">Judging criteria</h2>

      {!criteria?.length && <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>No criteria set yet — judges can&apos;t score until you add at least one.</p>}

      {criteria?.map((c) => (
        <div key={c.id} className="list-item">
          <span>{c.name} <span className="muted mono">/ {c.max_score} {Number(c.weight) !== 1 && `(×${c.weight})`}</span></span>
          <button className="btn btn-danger btn-sm" onClick={async () => {
            await deleteCriterion(hackathonId, roundId, c.id);
            router.refresh();
          }}>
            Remove
          </button>
        </div>
      ))}

      <form id="add-criterion-form" onSubmit={handleAdd} style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        {error && <div className="alert alert-error" style={{ width: "100%" }}>{error}</div>}
        <div className="field" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
          <label htmlFor="criterion-name">Criterion</label>
          <input className="input" id="criterion-name" name="name" placeholder="e.g. Innovation" required />
        </div>
        <div className="field" style={{ width: 100, marginBottom: 0 }}>
          <label htmlFor="criterion-max">Max Score</label>
          <input className="input" id="criterion-max" name="maxScore" type="number" defaultValue={10} />
        </div>
        <div className="field" style={{ width: 100, marginBottom: 0 }}>
          <label htmlFor="criterion-weight">Weight</label>
          <input className="input" id="criterion-weight" name="weight" type="number" step="0.1" defaultValue={1.0} />
        </div>
        <SubmitButton pendingText="Adding…">Add</SubmitButton>
      </form>
    </div>
  );
}

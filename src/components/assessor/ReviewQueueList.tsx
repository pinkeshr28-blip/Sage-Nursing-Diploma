"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { issueDecision } from "@/lib/actions/assessor";

export interface QueueRow {
  itemId: string;
  studentName: string;
  unitTitle: string;
  label: string;
  uploadedAt: string | null;
}

export function ReviewQueueList({ rows }: { rows: QueueRow[] }) {
  return (
    <>
      <div className="card">
        <h2>Review queue</h2>
        <p className="muted">{rows.length} item(s) awaiting your review</p>
      </div>
      {rows.length === 0 && (
        <div className="card">
          <p className="muted">Nothing pending — you&apos;re all caught up.</p>
        </div>
      )}
      {rows.map((r) => (
        <QueueCard key={r.itemId} row={r} />
      ))}
    </>
  );
}

function QueueCard({ row }: { row: QueueRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function decide(decision: "pass" | "revision_needed") {
    setError("");
    startTransition(async () => {
      const result = await issueDecision(row.itemId, decision, feedback);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="card">
      <div className="row-flex">
        <div>
          <h2 style={{ fontSize: 15 }}>
            {row.studentName} — {row.unitTitle}, {row.label}
          </h2>
          <p className="muted mono">Uploaded {row.uploadedAt ?? ""}</p>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Open"}
        </button>
      </div>
      {open && (
        <div className="review-box">
          <textarea
            placeholder="Feedback notes for the candidate..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn btn-sm btn-coral"
              disabled={isPending}
              onClick={() => decide("revision_needed")}
            >
              Revision needed
            </button>
            <button
              className="btn btn-sm btn-sage"
              disabled={isPending}
              onClick={() => decide("pass")}
            >
              Pass — issue feedback
            </button>
          </div>
          {error && <div className="error-text">{error}</div>}
        </div>
      )}
    </div>
  );
}

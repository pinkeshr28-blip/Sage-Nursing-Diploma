"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markIqa } from "@/lib/actions/assessor";

export interface IqaRow {
  studentId: string;
  unitId: string;
  studentName: string;
  unitTitle: string;
  done: boolean;
  doneAt: string | null;
}

export function IqaList({ rows }: { rows: IqaRow[] }) {
  return (
    <>
      <div className="card">
        <h2>IQA sampling</h2>
        <p className="muted">
          Mark a candidate&apos;s unit as sampled for internal quality assurance. This
          notifies the admin.
        </p>
      </div>
      {rows.map((r) => (
        <IqaRowCard key={`${r.studentId}-${r.unitId}`} row={r} />
      ))}
    </>
  );
}

function IqaRowCard({ row }: { row: IqaRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleMark() {
    startTransition(async () => {
      await markIqa(row.studentId, row.unitId);
      router.refresh();
    });
  }

  return (
    <div className="card">
      <div className="row-flex">
        <div>
          <h2 style={{ fontSize: 14.5 }}>
            {row.studentName} — {row.unitTitle}
          </h2>
          {row.done && <p className="muted mono">Sampled {row.doneAt}</p>}
        </div>
        <button
          className={`btn btn-sm ${row.done ? "btn-ghost" : "btn-gold"}`}
          disabled={row.done || isPending}
          onClick={handleMark}
        >
          {row.done ? "Sampling complete" : "Mark IQA sampling done"}
        </button>
      </div>
    </div>
  );
}

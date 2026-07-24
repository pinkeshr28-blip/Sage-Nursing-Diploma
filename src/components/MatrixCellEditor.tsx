"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setItemStatusDirect } from "@/lib/actions/matrix";
import type { ItemSection, ItemStatus } from "@/lib/database.types";

const OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "not_started", label: "–" },
  { value: "uploaded", label: "U" },
  { value: "revision_needed", label: "R" },
  { value: "pass", label: "P" },
];

const CLASS_MAP: Record<ItemStatus, string> = {
  not_started: "mc-none",
  uploaded: "mc-pending",
  under_review: "mc-pending",
  revision_needed: "mc-rev",
  pass: "mc-pass",
};

export function MatrixCellEditor({
  studentId,
  unitId,
  section,
  questionId,
  status,
}: {
  studentId: string;
  unitId: string;
  section: ItemSection;
  questionId: string | null;
  status: ItemStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ItemStatus;
    startTransition(async () => {
      await setItemStatusDirect(studentId, unitId, section, questionId, next);
      router.refresh();
    });
  }

  // "under_review" isn't a selectable option — treat it the same as "uploaded" for display.
  const displayStatus = status === "under_review" ? "uploaded" : status;

  return (
    <select
      className={`matrix-cell-select ${CLASS_MAP[status]}`}
      value={displayStatus}
      onChange={handleChange}
      disabled={isPending}
      title="Set status directly — no notification is sent"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

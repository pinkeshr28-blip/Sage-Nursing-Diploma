import type { ItemStatus } from "@/lib/database.types";

export const STATUS_DISPLAY: Record<
  ItemStatus,
  { pill: string; label: string; actionLabel: string | null }
> = {
  not_started: { pill: "pill-neutral", label: "Not uploaded", actionLabel: "Upload" },
  uploaded: { pill: "pill-gold", label: "Uploaded — awaiting review", actionLabel: null },
  under_review: { pill: "pill-gold", label: "Under review", actionLabel: null },
  revision_needed: { pill: "pill-coral", label: "Revision needed", actionLabel: "Re-upload" },
  pass: { pill: "pill-sage", label: "Passed", actionLabel: null },
};

export function itemKey(unitId: string, section: string, questionId: string | null) {
  return `${unitId}|${section}|${questionId ?? "doc"}`;
}

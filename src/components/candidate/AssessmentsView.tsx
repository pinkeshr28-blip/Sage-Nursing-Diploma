"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STATUS_DISPLAY, itemKey } from "@/lib/itemStatus";
import { uploadItem } from "@/lib/actions/candidate";
import type { Database, ItemSection } from "@/lib/database.types";

type SubmissionItem = Database["public"]["Tables"]["submission_items"]["Row"];

interface UnitData {
  id: string;
  title: string;
  knowledgeQuestions: { id: string; label: string }[];
  performanceQuestions: { id: string; label: string }[];
}

function ItemRow({
  item,
  section,
  questionId,
  label,
  isPending,
  onUpload,
}: {
  item: SubmissionItem | undefined;
  section: ItemSection;
  questionId: string | null;
  label: string;
  isPending: boolean;
  onUpload: (section: ItemSection, questionId: string | null) => void;
}) {
  const status = item?.status ?? "not_started";
  const display = STATUS_DISPLAY[status];
  const canUpload = status === "not_started" || status === "revision_needed";

  return (
    <div className="qrow">
      <div className="qnum">{label}</div>
      <div className="qtext">
        {status === "revision_needed" && item?.feedback && (
          <div style={{ color: "var(--coral)", fontSize: 12, marginBottom: 2 }}>
            Assessor note: {item.feedback}
          </div>
        )}
        <span className={`pill ${display.pill}`}>{display.label}</span>
      </div>
      {canUpload && (
        <button
          className="btn btn-sm btn-teal"
          disabled={isPending}
          onClick={() => onUpload(section, questionId)}
        >
          {display.actionLabel}
        </button>
      )}
    </div>
  );
}

export function AssessmentsView({
  studentFirstName,
  units,
  items,
}: {
  studentFirstName: string;
  units: UnitData[];
  items: SubmissionItem[];
}) {
  const router = useRouter();
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id ?? null);
  const [isPending, startTransition] = useTransition();

  const itemMap = useMemo(() => {
    const map = new Map<string, SubmissionItem>();
    items.forEach((i) => map.set(itemKey(i.unit_id, i.section, i.question_id), i));
    return map;
  }, [items]);

  if (!units.length) {
    return (
      <div className="card">
        <p className="muted">
          No units have been published yet. Check back once your admin publishes the
          curriculum.
        </p>
      </div>
    );
  }

  const unit = units.find((u) => u.id === selectedUnitId) ?? units[0];

  function handleUpload(section: ItemSection, questionId: string | null) {
    startTransition(async () => {
      await uploadItem(unit.id, section, questionId);
      router.refresh();
    });
  }

  return (
    <>
      <div className="card">
        <h2>Welcome, {studentFirstName}</h2>
      </div>
      <div className="chip-select">
        {units.map((u) => (
          <button
            key={u.id}
            className={`chip ${u.id === unit.id ? "active" : ""}`}
            onClick={() => setSelectedUnitId(u.id)}
          >
            {u.title.split(" — ")[0]}
          </button>
        ))}
      </div>
      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>{unit.title}</h2>

        <div className="section-label">Preparation</div>
        <ItemRow
          item={itemMap.get(itemKey(unit.id, "preparation", null))}
          section="preparation"
          questionId={null}
          label="Prep"
          isPending={isPending}
          onUpload={handleUpload}
        />

        <div className="section-label">Knowledge Evidence</div>
        {unit.knowledgeQuestions.map((q) => (
          <ItemRow
            key={q.id}
            item={itemMap.get(itemKey(unit.id, "knowledge", q.id))}
            section="knowledge"
            questionId={q.id}
            label={q.label}
            isPending={isPending}
            onUpload={handleUpload}
          />
        ))}

        <div className="section-label">Performance Evidence</div>
        {unit.performanceQuestions.map((q) => (
          <ItemRow
            key={q.id}
            item={itemMap.get(itemKey(unit.id, "performance", q.id))}
            section="performance"
            questionId={q.id}
            label={q.label}
            isPending={isPending}
            onUpload={handleUpload}
          />
        ))}

        <div className="section-label">Reflection</div>
        <ItemRow
          item={itemMap.get(itemKey(unit.id, "reflection", null))}
          section="reflection"
          questionId={null}
          label="Refl."
          isPending={isPending}
          onUpload={handleUpload}
        />
      </div>
    </>
  );
}

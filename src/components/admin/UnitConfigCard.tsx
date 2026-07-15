"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addQuestion,
  removeQuestion,
  renameUnit,
  toggleUnitPublish,
  updateQuestionLabel,
} from "@/lib/actions/admin";

interface Question {
  id: string;
  label: string;
}

export function UnitConfigCard({
  unitId,
  title,
  published,
  knowledgeQuestions,
  performanceQuestions,
}: {
  unitId: string;
  title: string;
  published: boolean;
  knowledgeQuestions: Question[];
  performanceQuestions: Question[];
}) {
  const router = useRouter();
  const [titleValue, setTitleValue] = useState(title);
  const [isPending, startTransition] = useTransition();

  function saveTitle() {
    startTransition(async () => {
      await renameUnit(unitId, titleValue);
      router.refresh();
    });
  }

  function togglePublish() {
    startTransition(async () => {
      await toggleUnitPublish(unitId, !published);
      router.refresh();
    });
  }

  return (
    <div className="card">
      <div style={{ marginBottom: 10 }}>
        <label className="muted" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
          Unit name
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 10px",
              border: "1px solid var(--line)",
              borderRadius: 6,
              fontSize: "13.5px",
              fontWeight: 600,
            }}
          />
          <button className="btn btn-sm btn-ghost" onClick={saveTitle} disabled={isPending}>
            Save
          </button>
        </div>
        {!published && <span className="badge-unpub">DRAFT — not visible</span>}
      </div>

      <QuestionList unitId={unitId} section="knowledge" label="Knowledge Evidence" questions={knowledgeQuestions} />
      <QuestionList
        unitId={unitId}
        section="performance"
        label="Performance Evidence"
        questions={performanceQuestions}
      />

      <div
        className="row-flex"
        style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}
      >
        <span className="muted">Preparation and Reflection stay as single sign-off items.</span>
        <button
          className={`btn btn-sm ${published ? "btn-ghost" : "btn-gold"}`}
          onClick={togglePublish}
          disabled={isPending}
        >
          {published ? "Unpublish" : "Publish"}
        </button>
      </div>
    </div>
  );
}

function QuestionList({
  unitId,
  section,
  label,
  questions,
}: {
  unitId: string;
  section: "knowledge" | "performance";
  label: string;
  questions: Question[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      await addQuestion(unitId, section, "");
      router.refresh();
    });
  }

  return (
    <>
      <div className="section-label">{label}</div>
      <div>
        {questions.map((q) => (
          <QuestionRow key={q.id} question={q} />
        ))}
      </div>
      <button className="btn btn-sm btn-ghost" onClick={handleAdd} disabled={isPending}>
        + Add {section === "knowledge" ? "knowledge question" : "performance criterion"}
      </button>
    </>
  );
}

function QuestionRow({ question }: { question: Question }) {
  const router = useRouter();
  const [value, setValue] = useState(question.label);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateQuestionLabel(question.id, value);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeQuestion(question.id);
      router.refresh();
    });
  }

  return (
    <div className="qrow" style={{ padding: "7px 0" }}>
      <input
        className="mono"
        style={{ flex: 1, padding: "7px 9px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 13 }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="btn btn-sm btn-ghost" onClick={save} disabled={isPending}>
        Save
      </button>
      <button className="btn btn-sm btn-ghost-coral" onClick={remove} disabled={isPending}>
        Remove
      </button>
    </div>
  );
}

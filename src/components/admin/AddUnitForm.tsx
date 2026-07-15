"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addUnit } from "@/lib/actions/admin";

export function AddUnitForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await addUnit(title);
      setTitle("");
      inputRef.current?.focus();
      router.refresh();
    });
  }

  return (
    <form className="card row-flex" onSubmit={handleSubmit}>
      <div className="field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
        <label>New unit name</label>
        <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Unit 11 — ..." />
      </div>
      <button type="submit" className="btn btn-sm btn-primary" style={{ height: 38 }} disabled={isPending}>
        Add unit
      </button>
    </form>
  );
}

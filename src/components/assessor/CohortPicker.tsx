"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { COHORTS } from "@/lib/cohorts";

export function CohortPicker() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("cohort") ?? COHORTS[0].id;

  function select(cohortId: string) {
    router.push(`${pathname}?cohort=${cohortId}`);
  }

  return (
    <div className="chip-select">
      {COHORTS.map((c) => (
        <button
          key={c.id}
          className={`chip ${c.id === selected ? "active" : ""}`}
          onClick={() => select(c.id)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

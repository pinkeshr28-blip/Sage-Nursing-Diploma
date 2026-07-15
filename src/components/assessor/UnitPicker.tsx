"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function UnitPicker({ units, selectedUnitId }: { units: { id: string; title: string }[]; selectedUnitId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(unitId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("unit", unitId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="chip-select">
      {units.map((u) => (
        <button
          key={u.id}
          className={`chip ${u.id === selectedUnitId ? "active" : ""}`}
          onClick={() => select(u.id)}
        >
          {u.title.split(" — ")[0]}
        </button>
      ))}
    </div>
  );
}

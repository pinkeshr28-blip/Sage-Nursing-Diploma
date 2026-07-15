// Mirrors the seed data in supabase/migrations/0001_init.sql (`cohorts` table).
export const COHORTS = [
  { id: "1", label: "Cohort 1" },
  { id: "2", label: "Cohort 2" },
  { id: "3", label: "Cohort 3" },
  { id: "4", label: "Cohort 4" },
  { id: "5", label: "Cohort 5" },
  { id: "e_learning", label: "E-Learning" },
] as const;

export type CohortId = (typeof COHORTS)[number]["id"];

export function cohortLabel(id: string | null | undefined): string {
  return COHORTS.find((c) => c.id === id)?.label ?? "—";
}

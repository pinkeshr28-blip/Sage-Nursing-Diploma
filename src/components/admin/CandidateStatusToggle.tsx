"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCandidateStatus } from "@/lib/actions/admin";

export function CandidateStatusToggle({
  candidateId,
  status,
}: {
  candidateId: string;
  status: "invited" | "active" | "inactive";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (status === "invited") return null;

  function toggle() {
    startTransition(async () => {
      await setCandidateStatus(candidateId, status === "active" ? "inactive" : "active");
      router.refresh();
    });
  }

  return (
    <button
      className={`btn btn-sm ${status === "active" ? "btn-ghost-coral" : "btn-sage"}`}
      disabled={isPending}
      onClick={toggle}
    >
      {status === "active" ? "Deactivate" : "Reactivate"}
    </button>
  );
}

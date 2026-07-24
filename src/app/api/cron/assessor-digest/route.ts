import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { emailTemplate } from "@/lib/email/templates";

// Vercel Cron (see vercel.json) hits this once daily. Replaces an email-per-upload with
// a single end-of-day digest per assessor, listing everything uploaded since the last run.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: pendingItems } = await supabase
    .from("submission_items")
    .select("*")
    .in("status", ["uploaded", "under_review"])
    .is("digest_sent_at", null)
    .not("uploaded_at", "is", null);

  if (!pendingItems || pendingItems.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const [{ data: units }, { data: questions }, { data: students }, { data: assessors }] =
    await Promise.all([
      supabase.from("units").select("id,title"),
      supabase.from("unit_questions").select("id,label"),
      supabase.from("profiles").select("id,full_name,email").eq("role", "candidate"),
      supabase.from("profiles").select("id,email").eq("role", "assessor").eq("status", "active"),
    ]);

  const unitMap = new Map((units ?? []).map((u) => [u.id, u]));
  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));
  const studentMap = new Map((students ?? []).map((s) => [s.id, s]));

  const lines = pendingItems.map((item) => {
    const student = studentMap.get(item.student_id);
    const unit = unitMap.get(item.unit_id);
    const label = item.question_id
      ? (questionMap.get(item.question_id)?.label ?? "?")
      : item.section === "preparation"
        ? "Preparation"
        : "Reflection";
    return `${student?.full_name ?? student?.email ?? "A candidate"} — ${unit?.title ?? "Unit"} — ${label}`;
  });

  const subject = `Daily digest — ${pendingItems.length} submission${pendingItems.length === 1 ? "" : "s"} awaiting review`;
  const body = lines.map((l) => `<div style="padding:4px 0;">${l}</div>`).join("");

  await Promise.all(
    (assessors ?? []).map((a) =>
      sendEmail({ to: a.email, subject, html: emailTemplate(subject, body) }),
    ),
  );

  await supabase
    .from("submission_items")
    .update({ digest_sent_at: new Date().toISOString() })
    .in(
      "id",
      pendingItems.map((i) => i.id),
    );

  return NextResponse.json({ processed: pendingItems.length, assessorsNotified: (assessors ?? []).length });
}

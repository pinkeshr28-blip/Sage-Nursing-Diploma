import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/email/notify";

// Vercel Cron (see vercel.json) hits this daily. Anyone else needs the CRON_SECRET.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: overdueItems } = await supabase
    .from("submission_items")
    .select("*")
    .in("status", ["uploaded", "under_review"])
    .lte("uploaded_at", sevenDaysAgo)
    .is("overdue_reminder_sent_at", null);

  if (!overdueItems || overdueItems.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const [{ data: units }, { data: questions }, { data: students }, { data: admins }, { data: assessors }] =
    await Promise.all([
      supabase.from("units").select("id,title"),
      supabase.from("unit_questions").select("id,label"),
      supabase.from("profiles").select("id,full_name,email").eq("role", "candidate"),
      supabase.from("profiles").select("id,email").eq("role", "admin"),
      supabase.from("profiles").select("id,email").eq("role", "assessor").eq("status", "active"),
    ]);

  const unitMap = new Map((units ?? []).map((u) => [u.id, u]));
  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]));
  const studentMap = new Map((students ?? []).map((s) => [s.id, s]));
  const recipients = [...(assessors ?? []), ...(admins ?? [])];

  for (const item of overdueItems) {
    const student = studentMap.get(item.student_id);
    const unit = unitMap.get(item.unit_id);
    const label = item.question_id
      ? (questionMap.get(item.question_id)?.label ?? "?")
      : item.section === "preparation"
        ? "Preparation"
        : "Reflection";

    const subject = `Overdue: ${unit?.title ?? "Unit"} — ${label} (7+ days, no feedback)`;
    const body = `${student?.full_name ?? student?.email ?? "A candidate"} uploaded ${label} (${
      unit?.title ?? ""
    }) 7+ days ago with no feedback yet. Please review when you can.`;

    await Promise.all(
      recipients.map((r) =>
        sendNotification({
          fromId: null,
          fromEmail: "system@sageacademy.uk",
          toId: r.id,
          toEmail: r.email,
          subject,
          body,
          kind: "coral",
        }),
      ),
    );

    await supabase
      .from("submission_items")
      .update({ overdue_reminder_sent_at: new Date().toISOString() })
      .eq("id", item.id);
  }

  return NextResponse.json({ processed: overdueItems.length });
}

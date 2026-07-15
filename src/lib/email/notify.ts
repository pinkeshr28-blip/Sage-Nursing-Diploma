import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { emailTemplate } from "@/lib/email/templates";
import type { NotificationKind } from "@/lib/database.types";

interface NotifyInput {
  fromId: string | null;
  fromEmail: string;
  toId: string | null;
  toEmail: string;
  subject: string;
  body: string;
  kind: NotificationKind;
}

/** Logs to the notifications table (audit trail / in-app inbox) and sends the real email. */
export async function sendNotification(input: NotifyInput) {
  const supabaseAdmin = createAdminClient();

  await supabaseAdmin.from("notifications").insert({
    from_profile_id: input.fromId,
    to_profile_id: input.toId,
    from_email: input.fromEmail,
    to_email: input.toEmail,
    subject: input.subject,
    body: input.body,
    kind: input.kind,
  });

  await sendEmail({
    to: input.toEmail,
    subject: input.subject,
    html: emailTemplate(input.subject, input.body),
  });
}

/**
 * There's no fixed assessor-per-candidate mapping (any assessor can pick any cohort),
 * so upload notifications broadcast to every active assessor rather than one fixed person.
 */
export async function notifyAllAssessors(
  input: Omit<NotifyInput, "toId" | "toEmail">,
) {
  const supabaseAdmin = createAdminClient();
  const { data: assessors } = await supabaseAdmin
    .from("profiles")
    .select("id,email")
    .eq("role", "assessor")
    .eq("status", "active");

  await Promise.all(
    (assessors ?? []).map((a) =>
      sendNotification({ ...input, toId: a.id, toEmail: a.email }),
    ),
  );
}

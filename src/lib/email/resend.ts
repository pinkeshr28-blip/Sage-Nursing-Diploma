import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    // Resend isn't configured yet — the notification is still logged to the
    // database (in-app inbox), so nothing is silently lost while it's pending.
    console.warn(`[email] RESEND_API_KEY not set — skipped send to ${to}: "${subject}"`);
    return;
  }

  const from = process.env.EMAIL_FROM ?? "SAGE Academy <notifications@sageacademy.uk>";
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) console.error("[email] send failed", error);
}

# Sage Nursing Diploma — Assessment Notification Platform

A prototype notification and tracking layer that sits around PebblePad for SAGE Academy's dental nursing courses. Students flag uploads, assessors mark items as pass / revision needed and issue feedback, admins configure the curriculum (units, Knowledge Evidence and Performance Evidence questions) and publish it, and IQA sampling is logged automatically.

## Files

- **`sage-platform.html`** — the working prototype. Open it directly in any browser (no build step, no server). Uses in-browser storage, so data only persists within a single browser/device for now — see "Next steps" below for turning this into a real multi-user, hosted system.
- **`SAGE_Academy_Notification_System_Spec.docx`** — the technical specification: architecture, database design, notification system, GDPR/security notes, deployment steps, and estimated running costs for a production build.

## Try it

Open `sage-platform.html` in a browser. Sign in as:
- **Student** (e.g. John Smith) → upload an item under a published unit
- **Assessor** (e.g. Mrs Sarah Brown) → review it in the queue, mark Pass or Revision needed
- **Admin** (Pinkesh Rajvanshi) → edit units, questions, and publish/unpublish

## Next steps

To turn this into a real, hosted system with actual student/assessor logins and real email notifications (rather than the simulated in-app log), see Section 6 ("Deployment Instructions") of the spec document. In short: Next.js on Vercel, Supabase for the database and email magic-link login, and a transactional email provider (Resend/SendGrid) sending from a verified subdomain such as `notifications@sageacademy.uk`.

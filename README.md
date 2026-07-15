# SAGE Academy — Assessment Notification Platform

A live, multi-user notification and tracking layer that sits around PebblePad for SAGE Academy's nursing diploma courses. Candidates flag uploads, assessors mark items as pass / revision needed and issue feedback, admins configure the curriculum and invite people in, and IQA sampling is logged automatically. Everything is backed by a real database with row-level security — no more in-browser demo storage.

## Stack

- **Next.js** (App Router, TypeScript) — deployed on Vercel
- **Supabase** — Postgres database, Auth (passwordless invite links + magic-link sign-in), Row-Level Security
- **Resend** — transactional email, sending from a verified `sageacademy.uk` domain

## Roles

- **Admin** — invites people by email, picking their role (Assessor or Candidate) and, for candidates, their cohort (Cohort 1–5 or E-Learning). Also manages the curriculum (units, Knowledge/Performance Evidence questions, publish/unpublish) and sees an activity overview and full notification log.
- **Assessor** — after signing in, picks which cohort to work with (any assessor can pick any cohort — there's no fixed assessor-per-candidate assignment). Reviews the upload queue, marks pass/revision needed with feedback, views a per-unit matrix across all candidates in the selected cohort, and logs IQA sampling.
- **Candidate** — uploads evidence per unit (Preparation, Knowledge Evidence, Performance Evidence, Reflection), sees status and assessor feedback, and has a personal notification log.

Accounts are invite-only — there is no open sign-up.

## Local development

```bash
npm install
npm run dev
```

Requires a `.env.local` (git-ignored) with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=SAGE Academy <notifications@sageacademy.uk>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=
```

Apply `supabase/migrations/0001_init.sql` via the Supabase SQL Editor before first run — it creates all tables, RLS policies, and seeds the starting curriculum and cohort list.

In Supabase, also configure Custom SMTP (Authentication → Emails → SMTP Settings) to route auth emails through Resend, and add your app's URL to Authentication → URL Configuration → Redirect URLs.

## Deployment

Push to GitHub, import into Vercel, and set the same environment variables there (with `NEXT_PUBLIC_SITE_URL` pointed at the production URL). `vercel.json` configures a daily cron job (`/api/cron/overdue`) that reminds assessors and admins about items awaiting feedback for 7+ days.

## `legacy/`

The original click-through prototype (`sage-platform.html`, in-browser storage only) and the initial technical spec document, kept for reference.

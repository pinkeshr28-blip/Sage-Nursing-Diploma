-- SAGE Academy Assessment Notification Platform — initial schema
-- Roles: admin, assessor, candidate (student). Invite-only accounts via Supabase Auth.

create extension if not exists pgcrypto;

create type user_role as enum ('admin', 'assessor', 'candidate');
create type item_status as enum ('not_started', 'uploaded', 'under_review', 'revision_needed', 'pass');
create type item_section as enum ('preparation', 'knowledge', 'performance', 'reflection');

-- ===================== COHORTS =====================
create table cohorts (
  id text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into cohorts (id, label, sort_order) values
  ('1', 'Cohort 1', 1),
  ('2', 'Cohort 2', 2),
  ('3', 'Cohort 3', 3),
  ('4', 'Cohort 4', 4),
  ('5', 'Cohort 5', 5),
  ('e_learning', 'E-Learning', 6);

-- ===================== PROFILES =====================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role user_role not null,
  cohort_id text references cohorts(id),
  status text not null default 'invited' check (status in ('invited', 'active')),
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index profiles_role_idx on profiles(role);
create index profiles_cohort_idx on profiles(cohort_id);

-- Helper: reads the caller's role without re-triggering RLS on profiles (avoids recursive policy checks).
create or replace function current_role_name()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

grant execute on function current_role_name() to authenticated;

-- ===================== UNITS & QUESTIONS =====================
create table units (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table unit_questions (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  section item_section not null check (section in ('knowledge', 'performance')),
  label text not null,
  sort_order int not null default 0
);

create index unit_questions_unit_idx on unit_questions(unit_id);

-- ===================== SUBMISSION ITEMS =====================
create table submission_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  section item_section not null,
  question_id uuid references unit_questions(id) on delete cascade,
  status item_status not null default 'not_started',
  feedback text,
  uploaded_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  overdue_reminder_sent_at timestamptz
);

create index submission_items_student_idx on submission_items(student_id);
create index submission_items_unit_idx on submission_items(unit_id);
create index submission_items_status_idx on submission_items(status);

-- Two partial indexes instead of one plain unique constraint: Postgres treats every NULL
-- as distinct, so a plain unique(student_id, unit_id, section, question_id) would let
-- preparation/reflection rows (question_id is null) duplicate freely.
create unique index submission_items_question_uidx
  on submission_items(student_id, unit_id, section, question_id)
  where question_id is not null;

create unique index submission_items_doc_uidx
  on submission_items(student_id, unit_id, section)
  where question_id is null;

-- ===================== IQA SAMPLING =====================
create table iqa_samples (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  done_by uuid not null references profiles(id),
  done_at timestamptz not null default now(),
  unique (student_id, unit_id)
);

-- ===================== NOTIFICATIONS (audit log / in-app inbox) =====================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid references profiles(id),
  to_profile_id uuid references profiles(id),
  from_email text not null,
  to_email text not null,
  subject text not null,
  body text not null,
  kind text not null check (kind in ('sage', 'coral', 'gold')),
  created_at timestamptz not null default now()
);

create index notifications_to_idx on notifications(to_profile_id);
create index notifications_from_idx on notifications(from_profile_id);

-- Non-admins may update their own row (e.g. to set full_name during invite acceptance)
-- but must never be able to grant themselves a different role/cohort via a direct client call.
create or replace function prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_role_name() <> 'admin' then
    if new.role <> old.role
      or new.cohort_id is distinct from old.cohort_id
      or new.invited_by is distinct from old.invited_by
      or new.email <> old.email then
      raise exception 'Not permitted to change role, cohort, invited_by, or email on your own profile';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
  before update on profiles
  for each row execute function prevent_self_privilege_escalation();

-- ===================== ROW LEVEL SECURITY =====================
alter table cohorts enable row level security;
alter table profiles enable row level security;
alter table units enable row level security;
alter table unit_questions enable row level security;
alter table submission_items enable row level security;
alter table iqa_samples enable row level security;
alter table notifications enable row level security;

-- cohorts: readable by any authenticated user
create policy "cohorts_select_authenticated" on cohorts
  for select to authenticated using (true);

-- profiles
create policy "profiles_select_self" on profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_select_admin" on profiles
  for select to authenticated using (current_role_name() = 'admin');

create policy "profiles_select_assessor" on profiles
  for select to authenticated using (current_role_name() = 'assessor');

create policy "profiles_update_self" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_all_admin" on profiles
  for all to authenticated using (current_role_name() = 'admin') with check (current_role_name() = 'admin');

-- units
create policy "units_select_published" on units
  for select to authenticated using (published = true or current_role_name() = 'admin');

create policy "units_all_admin" on units
  for all to authenticated using (current_role_name() = 'admin') with check (current_role_name() = 'admin');

-- unit_questions
create policy "unit_questions_select" on unit_questions
  for select to authenticated using (
    exists (select 1 from units u where u.id = unit_questions.unit_id and (u.published = true or current_role_name() = 'admin'))
  );

create policy "unit_questions_all_admin" on unit_questions
  for all to authenticated using (current_role_name() = 'admin') with check (current_role_name() = 'admin');

-- submission_items
create policy "submission_items_select_own" on submission_items
  for select to authenticated using (student_id = auth.uid());

create policy "submission_items_insert_own" on submission_items
  for insert to authenticated with check (student_id = auth.uid());

create policy "submission_items_update_own" on submission_items
  for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "submission_items_all_assessor" on submission_items
  for all to authenticated using (current_role_name() = 'assessor') with check (current_role_name() = 'assessor');

create policy "submission_items_all_admin" on submission_items
  for all to authenticated using (current_role_name() = 'admin') with check (current_role_name() = 'admin');

-- iqa_samples
create policy "iqa_select_assessor_admin" on iqa_samples
  for select to authenticated using (current_role_name() in ('assessor', 'admin'));

create policy "iqa_insert_assessor" on iqa_samples
  for insert to authenticated with check (current_role_name() = 'assessor' and done_by = auth.uid());

-- notifications: no direct client insert policy — all inserts go through the service-role client from server code.
create policy "notifications_select_own" on notifications
  for select to authenticated using (to_profile_id = auth.uid() or from_profile_id = auth.uid());

create policy "notifications_select_admin" on notifications
  for select to authenticated using (current_role_name() = 'admin');

-- ===================== SEED CURRICULUM =====================
do $$
declare
  unit_titles text[] := array[
    'Oral Health Education', 'Infection Control', 'Medical Emergencies', 'Radiography Principles',
    'IR(ME)R Compliance', 'Patient Communication', 'Health & Safety', 'Record Keeping',
    'Instrument Decontamination', 'Professionalism & Ethics'
  ];
  u_id uuid;
  i int;
  k int;
begin
  for i in 1..array_length(unit_titles, 1) loop
    insert into units (title, sort_order, published)
    values ('Unit ' || i || ' — ' || unit_titles[i], i, false)
    returning id into u_id;

    for k in 1..10 loop
      insert into unit_questions (unit_id, section, label, sort_order)
      values (u_id, 'knowledge', '1.' || k, k);
    end loop;

    if i = 1 then
      insert into unit_questions (unit_id, section, label, sort_order) values
        (u_id, 'performance', '2.1', 1),
        (u_id, 'performance', '2.2', 2),
        (u_id, 'performance', '3.1', 3),
        (u_id, 'performance', '3.2', 4),
        (u_id, 'performance', '3.3', 5);
    else
      for k in 1..5 loop
        insert into unit_questions (unit_id, section, label, sort_order)
        values (u_id, 'performance', '2.' || k, k);
      end loop;
    end if;
  end loop;
end $$;

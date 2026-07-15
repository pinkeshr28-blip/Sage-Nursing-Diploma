-- Run this ONLY if 0001_init.sql failed partway through and you need a clean slate.
-- It only touches objects this app's migration creates — nothing else in your project.

drop table if exists notifications cascade;
drop table if exists iqa_samples cascade;
drop table if exists submission_items cascade;
drop table if exists unit_questions cascade;
drop table if exists units cascade;
drop table if exists profiles cascade;
drop table if exists cohorts cascade;

drop function if exists prevent_self_privilege_escalation() cascade;
drop function if exists current_role_name() cascade;

drop type if exists item_section cascade;
drop type if exists item_status cascade;
drop type if exists user_role cascade;

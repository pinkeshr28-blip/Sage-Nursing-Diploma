-- Allow admin to deactivate/reactivate a candidate's account.
alter table profiles drop constraint if exists profiles_status_check;
alter table profiles add constraint profiles_status_check check (status in ('invited', 'active', 'inactive'));

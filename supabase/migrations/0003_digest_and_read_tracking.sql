-- Supports: in-app "unread" tracking for the notification pop-up, and the daily
-- assessor digest email (replacing an individual email per upload).
alter table notifications add column if not exists read_at timestamptz;
alter table submission_items add column if not exists digest_sent_at timestamptz;

-- Recipients can mark their own notifications as read (no such policy existed before —
-- previously only server-side/service-role code could write to this table at all).
drop policy if exists "notifications_update_own_read" on notifications;
create policy "notifications_update_own_read" on notifications
  for update to authenticated
  using (to_profile_id = auth.uid())
  with check (to_profile_id = auth.uid());

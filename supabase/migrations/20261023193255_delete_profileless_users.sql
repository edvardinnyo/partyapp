-- D-010: accounts still without a profile 30 days after they were created are deleted every
-- night, whatever way they signed up. They hold no other rows: everything else hangs on the
-- profile. Unconfirmed sign-ups keep their own 7-day rule (D-004/9).
select cron.schedule(
  'delete-profileless-users',
  '15 3 * * *',
  $$
    delete from auth.users u
    where u.created_at < now() - interval '30 days'
      and not exists (select 1 from public.profiles p where p.id = u.id)
  $$
);

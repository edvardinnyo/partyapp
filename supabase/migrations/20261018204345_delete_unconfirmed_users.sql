-- D-004: sign-ups whose email address was not confirmed within 7 days are deleted every night.
-- Unconfirmed users have no profile or avatar yet, so deleting the auth user is enough.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'delete-unconfirmed-users',
  '0 3 * * *',
  $$
    delete from auth.users
    where email_confirmed_at is null
      and created_at < now() - interval '7 days'
  $$
);

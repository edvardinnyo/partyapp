-- F1, Q6: distance search for venues and events ("within the user's radius").
-- Supabase keeps extensions in the `extensions` schema, which is on the default search path.
create extension if not exists postgis with schema extensions;

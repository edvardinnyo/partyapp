-- D-008/13, E-003: events come from partner accounts; the CSV import and its sample data go.
-- The events and venues tables stay (partners will publish into them, phase 4b), and so does
-- the live broadcast on changes (D-007/2).
drop function if exists public.import_events(text, jsonb, boolean);

delete from public.events where source in ('sample', 'csv');
delete from public.venues
where source in ('sample', 'csv')
  and not exists (select 1 from public.events e where e.venue_id = venues.id);

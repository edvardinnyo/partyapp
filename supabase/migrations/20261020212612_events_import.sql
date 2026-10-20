-- D-007/1: the one way events get into the database. Every source (the team's CSV now, partner
-- feeds later) is converted into the same JSON shape (ImportedEvent in
-- supabase/functions/_shared/contracts/events.ts) and written by this function, so switching to
-- a new source needs a new converter only.
--
-- Venues and events are matched by (source, external id): importing the same data again updates
-- the rows instead of duplicating them, and unchanged rows are left alone. With p_prune, the
-- source's events that are missing from the batch and have not ended yet are deleted (cancelled
-- events); past events stay for the closed events section (F3).
create or replace function public.import_events(
  p_source text,
  p_events jsonb,
  p_prune boolean default false
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_venues integer;
  v_events integer;
  v_removed integer := 0;
begin
  if p_source is null or btrim(p_source) = '' then
    raise exception 'import_events: the source is required';
  end if;
  if jsonb_typeof(p_events) is distinct from 'array' then
    raise exception 'import_events: the events must be a JSON array';
  end if;

  -- A venue appears in every row of its events; the last occurrence wins.
  with incoming as (
    select distinct on (item.e -> 'venue' ->> 'externalId')
      item.e -> 'venue' ->> 'externalId' as external_id,
      item.e -> 'venue' ->> 'name' as name,
      item.e -> 'venue' ->> 'address' as address,
      (item.e -> 'venue' ->> 'lat')::double precision as lat,
      (item.e -> 'venue' ->> 'lng')::double precision as lng
    from jsonb_array_elements(p_events) with ordinality as item(e, ordinal)
    order by item.e -> 'venue' ->> 'externalId', item.ordinal desc
  )
  insert into public.venues as v (source, external_id, name, address, lat, lng)
  select p_source, external_id, name, address, lat, lng
  from incoming
  on conflict (source, external_id) do update
    set name = excluded.name,
        address = excluded.address,
        lat = excluded.lat,
        lng = excluded.lng,
        updated_at = now()
    where (v.name, v.address, v.lat, v.lng)
      is distinct from (excluded.name, excluded.address, excluded.lat, excluded.lng);
  get diagnostics v_venues = row_count;

  with incoming as (
    select distinct on (item.e ->> 'externalId')
      item.e ->> 'externalId' as external_id,
      item.e -> 'venue' ->> 'externalId' as venue_external_id,
      item.e ->> 'title' as title,
      (item.e ->> 'kind')::public.event_kind as kind,
      (item.e ->> 'startsAt')::timestamptz as starts_at,
      (item.e ->> 'endsAt')::timestamptz as ends_at,
      array(select jsonb_array_elements_text(item.e -> 'genres'))::public.genre[] as genres,
      array(
        select jsonb_array_elements_text(coalesce(item.e -> 'performers', '[]'::jsonb))
      ) as performers,
      nullif(item.e ->> 'ticketUrl', '') as ticket_url
    from jsonb_array_elements(p_events) with ordinality as item(e, ordinal)
    order by item.e ->> 'externalId', item.ordinal desc
  )
  insert into public.events as ev (
    source, external_id, venue_id, title, kind, starts_at, ends_at, genres, performers, ticket_url
  )
  select
    p_source, i.external_id, v.id, i.title, i.kind, i.starts_at, i.ends_at, i.genres,
    i.performers, i.ticket_url
  from incoming i
  join public.venues v on v.source = p_source and v.external_id = i.venue_external_id
  on conflict (source, external_id) do update
    set venue_id = excluded.venue_id,
        title = excluded.title,
        kind = excluded.kind,
        starts_at = excluded.starts_at,
        ends_at = excluded.ends_at,
        genres = excluded.genres,
        performers = excluded.performers,
        ticket_url = excluded.ticket_url,
        updated_at = now()
    where (ev.venue_id, ev.title, ev.kind, ev.starts_at, ev.ends_at, ev.genres, ev.performers,
           ev.ticket_url)
      is distinct from (excluded.venue_id, excluded.title, excluded.kind, excluded.starts_at,
                        excluded.ends_at, excluded.genres, excluded.performers,
                        excluded.ticket_url);
  get diagnostics v_events = row_count;

  if p_prune then
    delete from public.events ev
    where ev.source = p_source
      and ev.ends_at > now()
      and not exists (
        select 1
        from jsonb_array_elements(p_events) as item(e)
        where item.e ->> 'externalId' = ev.external_id
      );
    get diagnostics v_removed = row_count;
  end if;

  return jsonb_build_object(
    'received', jsonb_array_length(p_events),
    'changedVenues', v_venues,
    'changedEvents', v_events,
    'removedEvents', v_removed
  );
end;
$$;

-- Only the database owner (the import script, later the partner feed job) may run it; the apps
-- never reach the tables directly (Q2).
revoke execute on function public.import_events(text, jsonb, boolean)
  from public, anon, authenticated, service_role;

-- D-007/2: tells the apps that events changed, so the Home grid and the map refresh right away.
-- A public broadcast without any event data: the apps then fetch the events through the API.
create or replace function public.broadcast_events_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(jsonb_build_object('table', tg_table_name), 'changed', 'events', false);
  return null;
end;
$$;

revoke execute on function public.broadcast_events_changed()
  from public, anon, authenticated, service_role;

create trigger events_broadcast_changes
after insert or update or delete on public.events
for each statement execute function public.broadcast_events_changed();

create trigger venues_broadcast_changes
after insert or update or delete on public.venues
for each statement execute function public.broadcast_events_changed();

-- Private bucket for profile pictures (D-004). There are no storage policies on purpose:
-- uploads use signed upload URLs and downloads use signed URLs, both issued by the API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

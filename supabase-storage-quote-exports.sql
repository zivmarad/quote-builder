-- Storage bucket for generated quote PDFs
-- Run in Supabase SQL Editor

insert into storage.buckets (id, name, public)
values ('quote-exports', 'quote-exports', true)
on conflict (id) do nothing;

create policy if not exists "Public read quote exports"
on storage.objects for select
to public
using (bucket_id = 'quote-exports');

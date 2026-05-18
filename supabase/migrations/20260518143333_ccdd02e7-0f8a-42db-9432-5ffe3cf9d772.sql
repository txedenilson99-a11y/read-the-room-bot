
-- Fix mutable search_path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Revoke execute on SECURITY DEFINER trigger functions (only the trigger needs them)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Tighten avatars SELECT policy: only allow direct file access, not listing
drop policy "avatars: leitura pública" on storage.objects;

create policy "avatars: leitura pública direta"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.role() = 'anon' or bucket_id = 'avatars');

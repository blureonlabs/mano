-- Update handle_new_user to support Google OAuth metadata
-- Google sends name as 'full_name' or 'name' depending on the provider config
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_name text;
  slug_base text;
begin
  raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  slug_base := lower(regexp_replace(raw_name, '[^a-z0-9]+', '-', 'gi'));
  slug_base := trim(both '-' from slug_base);

  insert into public.therapists (id, full_name, display_name, slug)
  values (
    new.id,
    raw_name,
    split_part(raw_name, ' ', 1),
    slug_base || '-' || substr(new.id::text, 1, 4)
  );

  return new;
end;
$$ language plpgsql security definer;

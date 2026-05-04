create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger employment_history_set_updated_at
before update on public.employment_history
for each row
execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create or replace function public.update_profile_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.full_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.bio, '')), 'B');
  return new;
end;
$$;

create trigger profile_search_vector_update
before insert or update on public.profiles
for each row
execute function public.update_profile_search_vector();

create index if not exists idx_profiles_search
  on public.profiles
  using gin(search_vector);

create index if not exists idx_profiles_country
  on public.profiles(country);

create index if not exists idx_degrees_level_year
  on public.degrees(level, graduation_year);

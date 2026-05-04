create or replace function public.recompute_profile_completeness(profile_uuid uuid)
returns void
language plpgsql
as $$
declare
  profile_row public.profiles%rowtype;
  score integer := 20;
begin
  select *
  into profile_row
  from public.profiles
  where id = profile_uuid;

  if not found then
    return;
  end if;

  if profile_row.bio is not null and btrim(profile_row.bio) <> '' then
    score := score + 10;
  end if;

  if profile_row.phone is not null and btrim(profile_row.phone) <> '' then
    score := score + 10;
  end if;

  if profile_row.city is not null and btrim(profile_row.city) <> '' then
    score := score + 10;
  end if;

  if profile_row.avatar_url is not null and btrim(profile_row.avatar_url) <> '' then
    score := score + 10;
  end if;

  if profile_row.postal_address is not null and btrim(profile_row.postal_address) <> '' then
    score := score + 10;
  end if;

  if exists (
    select 1
    from public.degrees d
    where d.profile_id = profile_uuid
  ) then
    score := score + 15;
  end if;

  if exists (
    select 1
    from public.employment_history eh
    where eh.profile_id = profile_uuid
  ) then
    score := score + 15;
  end if;

  if exists (
    select 1
    from public.profile_skills ps
    where ps.profile_id = profile_uuid
  ) then
    score := score + 10;
  end if;

  update public.profiles
  set completeness_score = least(score, 100)
  where id = profile_uuid
    and completeness_score is distinct from least(score, 100);
end;
$$;

drop trigger if exists profiles_completeness_recompute on public.profiles;

create trigger profiles_completeness_recompute
after insert or update of bio, phone, city, avatar_url, postal_address
on public.profiles
for each row
execute function public.on_profiles_completeness_change();

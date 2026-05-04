-- Relax directory read: any signed-in user may browse active directory rows.
-- Pending users were blocked by is_active_alumni(); revisit when admin tooling enforces status again.

drop policy if exists profiles_select_policy on public.profiles;

create policy profiles_select_policy
  on public.profiles
  for select
  using (
    auth.uid() = id
    or public.is_admin(auth.uid())
    or (
      status = 'active'
      and directory_visible = true
      and auth.uid() is not null
    )
  );

drop policy if exists degrees_select_policy on public.degrees;

create policy degrees_select_policy
  on public.degrees
  for select
  using (
    auth.uid() = profile_id
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = degrees.profile_id
        and p.status = 'active'
        and p.directory_visible = true
        and auth.uid() is not null
    )
  );

drop policy if exists employment_select_policy on public.employment_history;

create policy employment_select_policy
  on public.employment_history
  for select
  using (
    auth.uid() = profile_id
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = employment_history.profile_id
        and p.status = 'active'
        and p.directory_visible = true
        and auth.uid() is not null
    )
  );

drop policy if exists profile_skills_select_policy on public.profile_skills;

create policy profile_skills_select_policy
  on public.profile_skills
  for select
  using (
    auth.uid() = profile_id
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = profile_skills.profile_id
        and p.status = 'active'
        and p.directory_visible = true
        and auth.uid() is not null
    )
  );

drop policy if exists career_highlights_select_policy on public.career_highlights;

create policy career_highlights_select_policy
  on public.career_highlights
  for select
  using (
    auth.uid() = profile_id
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.id = career_highlights.profile_id
        and p.status = 'active'
        and p.directory_visible = true
        and auth.uid() is not null
    )
  );

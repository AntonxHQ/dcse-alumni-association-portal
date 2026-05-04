-- E-05: Directory visible only to active alumni (not anonymous). Admins retain full read.

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
      and public.is_active_alumni(auth.uid())
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
        and public.is_active_alumni(auth.uid())
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
        and public.is_active_alumni(auth.uid())
    )
  );

-- Skill catalog (names only) for directory filters
drop policy if exists skills_select_policy on public.skills;

create policy skills_select_policy
  on public.skills
  for select
  using (true);

drop policy if exists skills_insert_authenticated_policy on public.skills;

create policy skills_insert_authenticated_policy
  on public.skills
  for insert
  with check (
    auth.role() = 'authenticated'
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
        and public.is_active_alumni(auth.uid())
    )
  );

drop policy if exists profile_skills_insert_own_policy on public.profile_skills;

create policy profile_skills_insert_own_policy
  on public.profile_skills
  for insert
  with check (auth.uid() = profile_id);

drop policy if exists profile_skills_delete_own_policy on public.profile_skills;

create policy profile_skills_delete_own_policy
  on public.profile_skills
  for delete
  using (auth.uid() = profile_id);

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
        and public.is_active_alumni(auth.uid())
    )
  );

-- Paginated profile ids + total count with FTS relevance and grad-year sorts (RLS enforced)
create or replace function public.directory_search_profile_ids(
  p_search text,
  p_profile_ids uuid[],
  p_country text,
  p_sort text,
  p_limit int,
  p_offset int
)
returns table (
  profile_id uuid,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_q tsquery;
  v_sort text := coalesce(nullif(trim(p_sort), ''), 'relevance');
  v_order_clause text;
begin
  if p_search is not null and trim(p_search) <> '' then
    v_q := websearch_to_tsquery('english', p_search);
  end if;

  if v_sort = 'relevance' and v_q is not null then
    v_order_clause := 'n.ft_rank desc nulls last, n.full_name asc';
  elsif v_sort = 'grad_newest' then
    v_order_clause := 'n.max_grad_year desc nulls last, n.full_name asc';
  elsif v_sort = 'grad_oldest' then
    v_order_clause := 'n.max_grad_year asc nulls last, n.full_name asc';
  else
    v_order_clause := 'n.full_name asc';
  end if;

  return query execute format($sql$
    with filtered as (
      select
        p.id as pid,
        p.full_name::text as full_name,
        p.search_vector,
        (
          select max(d.graduation_year)::integer
          from public.degrees d
          where d.profile_id = p.id
        ) as max_grad_year,
        case
          when $1 is not null then ts_rank_cd(p.search_vector, $1)
          else 0::double precision
        end as ft_rank
      from public.profiles p
      where p.status = 'active'
        and p.directory_visible = true
        and (
          $2::text is null
          or length(trim(coalesce($2::text, ''))) = 0
          or trim(p.country::text) = trim($2::text)
        )
        and (
          $3 is null
          or cardinality($3) = 0
          or p.id = any ($3)
        )
        and (
          $1 is null
          or (p.search_vector @@ $1)
        )
    ),
    numbered as (
      select
        f.pid,
        f.full_name,
        f.max_grad_year,
        f.ft_rank,
        count(*) over ()::bigint as total_count
      from filtered f
    )
    select n.pid::uuid as profile_id, n.total_count::bigint as total_count
    from numbered n
    order by %s
    limit greatest(coalesce(nullif($4::int, 0), 20), 1)
    offset greatest(coalesce($5::int, 0), 0)
  $sql$, v_order_clause)
    using v_q,
      nullif(trim(coalesce(p_country, '')), ''),
      case
        when p_profile_ids is not null and cardinality(p_profile_ids) > 0 then p_profile_ids
        else null::uuid[]
      end,
      coalesce(nullif(p_limit, 0), 20),
      greatest(coalesce(p_offset, 0), 0);

  return;
end;
$$;

grant execute on function public.directory_search_profile_ids(
  text, uuid[], text, text, int, int
) to authenticated;

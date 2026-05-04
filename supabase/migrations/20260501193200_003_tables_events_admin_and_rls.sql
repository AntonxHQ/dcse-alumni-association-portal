create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  event_type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  capacity integer,
  allows_guests boolean not null default false,
  is_paid boolean not null default false,
  price numeric(10, 2),
  stripe_price_id text,
  cancel_cutoff_hours smallint not null default 24,
  send_survey boolean not null default false,
  published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null,
  waitlist_position integer,
  qr_token text unique,
  dietary_requirements text,
  guest_count smallint not null default 0,
  stripe_payment_intent text,
  registered_at timestamptz not null default now(),
  constraint event_registrations_event_profile_unique unique (event_id, profile_id)
);

create table if not exists public.admin_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  primary key (profile_id, role),
  constraint admin_roles_role_check check (role in ('super_admin', 'events_manager', 'content_manager'))
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.degrees enable row level security;
alter table public.employment_history enable row level security;
alter table public.career_highlights enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.admin_roles enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.admin_roles
    where profile_id = user_id
  );
$$;

create or replace function public.is_active_alumni(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and status = 'active'
  );
$$;

create policy profiles_select_policy
  on public.profiles
  for select
  using (auth.uid() = id or (status = 'active' and directory_visible = true));

create policy profiles_update_own_policy
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_update_status_admin_policy
  on public.profiles
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy degrees_select_policy
  on public.degrees
  for select
  using (
    auth.uid() = profile_id
    or exists (
      select 1
      from public.profiles p
      where p.id = degrees.profile_id
        and p.status = 'active'
        and p.directory_visible = true
    )
  );

create policy degrees_write_own_policy
  on public.degrees
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy employment_select_policy
  on public.employment_history
  for select
  using (
    auth.uid() = profile_id
    or exists (
      select 1
      from public.profiles p
      where p.id = employment_history.profile_id
        and p.status = 'active'
        and p.directory_visible = true
    )
  );

create policy employment_write_own_policy
  on public.employment_history
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy events_select_policy
  on public.events
  for select
  using (published = true or public.is_admin(auth.uid()));

create policy events_write_admin_policy
  on public.events
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy event_registrations_select_policy
  on public.event_registrations
  for select
  using (auth.uid() = profile_id or public.is_admin(auth.uid()));

create policy event_registrations_insert_active_alumni_policy
  on public.event_registrations
  for insert
  with check (public.is_active_alumni(auth.uid()));

create policy event_registrations_update_own_or_admin_policy
  on public.event_registrations
  for update
  using (auth.uid() = profile_id or public.is_admin(auth.uid()))
  with check (auth.uid() = profile_id or public.is_admin(auth.uid()));

create policy admin_roles_read_admin_policy
  on public.admin_roles
  for select
  using (public.is_admin(auth.uid()));

create policy admin_roles_write_super_admin_policy
  on public.admin_roles
  for all
  using (
    exists (
      select 1
      from public.admin_roles ar
      where ar.profile_id = auth.uid()
        and ar.role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1
      from public.admin_roles ar
      where ar.profile_id = auth.uid()
        and ar.role = 'super_admin'
    )
  );

create policy audit_logs_select_super_admin_policy
  on public.audit_logs
  for select
  using (
    exists (
      select 1
      from public.admin_roles ar
      where ar.profile_id = auth.uid()
        and ar.role = 'super_admin'
    )
  );

create policy audit_logs_insert_service_role_policy
  on public.audit_logs
  for insert
  with check (auth.role() = 'service_role');

create policy audit_logs_update_denied_policy
  on public.audit_logs
  for update
  using (false);

create policy audit_logs_delete_denied_policy
  on public.audit_logs
  for delete
  using (false);

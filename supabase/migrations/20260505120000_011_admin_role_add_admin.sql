-- Add 'admin' role to the admin_roles constraint
alter table public.admin_roles drop constraint if exists admin_roles_role_check;
alter table public.admin_roles
  add constraint admin_roles_role_check
  check (role in ('super_admin', 'admin', 'events_manager', 'content_manager'));

-- Update the is_admin function to treat both 'admin' and 'super_admin' as admins
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
      and role in ('super_admin', 'admin', 'events_manager', 'content_manager')
  );
$$;

-- Helper: check if user is specifically a super_admin
create or replace function public.is_super_admin(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.admin_roles
    where profile_id = user_id
      and role = 'super_admin'
  );
$$;

-- Only super_admins can write to admin_roles
drop policy if exists admin_roles_write_super_admin_policy on public.admin_roles;
create policy admin_roles_write_super_admin_policy
  on public.admin_roles
  for all
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

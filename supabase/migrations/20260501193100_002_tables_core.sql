create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  avatar_url text,
  phone text,
  postal_address text,
  city text,
  country char(2),
  bio text,
  privacy_settings jsonb not null default '{"email":"private","phone":"private","postal_address":"private","city":"alumni_only","employment":"public"}'::jsonb,
  status text not null default 'pending_email',
  directory_visible boolean not null default true,
  completeness_score smallint not null default 0,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_status_check check (status in ('pending_email', 'pending_admin', 'active', 'suspended'))
);

create table if not exists public.degrees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  level text not null,
  registration_no text not null,
  intake_year smallint not null,
  graduation_year smallint not null,
  created_at timestamptz not null default now(),
  constraint degrees_level_check check (level in ('BS', 'MS', 'PhD')),
  constraint degrees_grad_after_intake_check check (graduation_year >= intake_year),
  constraint degrees_unique_profile_level unique (profile_id, level)
);

create table if not exists public.employment_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  job_title text not null,
  company text not null,
  employment_type text,
  start_month date not null,
  end_month date,
  city text,
  country char(2),
  description text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employment_start_month_first_day check (date_trunc('month', start_month)::date = start_month),
  constraint employment_end_month_first_day check (end_month is null or date_trunc('month', end_month)::date = end_month)
);

create table if not exists public.career_highlights (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  year smallint,
  description text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_predefined boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_skills (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id)
);

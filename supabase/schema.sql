-- Run this in Supabase SQL Editor for JobShield.
-- It creates the tables expected by src/api/supabaseClient.js.

create extension if not exists pgcrypto;

create table if not exists public.scans (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_session_id text,
  raw_text text not null,
  file_url text,
  language_detected text,
  risk_score numeric not null,
  risk_level text not null check (risk_level in ('Low Risk', 'Medium Risk', 'High Risk')),
  summary text,
  company_name text,
  red_flags jsonb not null default '[]'::jsonb,
  company_verification jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  fingerprint jsonb not null default '{}'::jsonb,
  offer_dna jsonb,
  recruiter_identity jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  is_sample boolean default false
);

create table if not exists public.community_reports (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_session_id text,
  scam_type text not null,
  company_name text,
  city text,
  channel text,
  amount_demanded numeric default 0,
  description text not null,
  status text not null default 'pending',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  is_sample boolean default false
);

create table if not exists public.scam_patterns (
  id text primary key default gen_random_uuid()::text,
  pattern_type text not null,
  keyword text not null,
  weight numeric not null default 1,
  detected_count numeric default 0,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  is_sample boolean default false
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create or replace function public.touch_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

drop trigger if exists scans_touch_updated_date on public.scans;
create trigger scans_touch_updated_date before update on public.scans
for each row execute function public.touch_updated_date();

drop trigger if exists community_reports_touch_updated_date on public.community_reports;
create trigger community_reports_touch_updated_date before update on public.community_reports
for each row execute function public.touch_updated_date();

drop trigger if exists scam_patterns_touch_updated_date on public.scam_patterns;
create trigger scam_patterns_touch_updated_date before update on public.scam_patterns
for each row execute function public.touch_updated_date();

alter table public.scans enable row level security;
alter table public.community_reports enable row level security;
alter table public.scam_patterns enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "read own scans" on public.scans;
create policy "read own scans" on public.scans for select using (user_id is null or auth.uid() = user_id);

drop policy if exists "create scans" on public.scans;
create policy "create scans" on public.scans for insert with check (user_id is null or auth.uid() = user_id);

drop policy if exists "update own scans" on public.scans;
create policy "update own scans" on public.scans for update using (auth.uid() = user_id);

drop policy if exists "read community reports" on public.community_reports;
create policy "read community reports" on public.community_reports for select using (true);

drop policy if exists "create community reports" on public.community_reports;
create policy "create community reports" on public.community_reports for insert with check (user_id is null or auth.uid() = user_id);

drop policy if exists "read scam patterns" on public.scam_patterns;
create policy "read scam patterns" on public.scam_patterns for select using (true);

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('jobshield-uploads', 'jobshield-uploads', true)
on conflict (id) do nothing;

drop policy if exists "public read jobshield uploads" on storage.objects;
create policy "public read jobshield uploads" on storage.objects for select using (bucket_id = 'jobshield-uploads');

drop policy if exists "authenticated upload jobshield files" on storage.objects;
create policy "authenticated upload jobshield files" on storage.objects for insert with check (bucket_id = 'jobshield-uploads');




create index if not exists scans_anonymous_session_id_idx
on public.scans (anonymous_session_id);

create index if not exists community_reports_anonymous_session_id_idx
on public.community_reports (anonymous_session_id);

create or replace function public.claim_anonymous_reports(p_anonymous_session_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  scan_count integer := 0;
  report_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_anonymous_session_id is null or length(p_anonymous_session_id) < 20 then
    return jsonb_build_object('scans', 0, 'community_reports', 0);
  end if;

  update public.scans
  set user_id = auth.uid()
  where user_id is null
    and anonymous_session_id = p_anonymous_session_id;
  get diagnostics scan_count = row_count;

  update public.community_reports
  set user_id = auth.uid()
  where user_id is null
    and anonymous_session_id = p_anonymous_session_id;
  get diagnostics report_count = row_count;

  return jsonb_build_object('scans', scan_count, 'community_reports', report_count);
end;
$$;

grant execute on function public.claim_anonymous_reports(text) to authenticated;
alter table public.scans
add column if not exists fingerprint jsonb not null default '{}'::jsonb;

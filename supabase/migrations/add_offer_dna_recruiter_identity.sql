alter table public.scans
add column if not exists offer_dna jsonb,
add column if not exists recruiter_identity jsonb;

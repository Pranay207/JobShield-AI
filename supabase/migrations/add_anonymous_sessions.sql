alter table public.scans
add column if not exists anonymous_session_id text;

alter table public.community_reports
add column if not exists anonymous_session_id text;

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

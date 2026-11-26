-- SANOR QUEST · launch (Phase 9)
--   * coordinators: the project lead(s) who see an anonymous summary across every school (network_report)
--   * client_errors: errors from students' and teachers' browsers, grouped per day (report_error)
--   * ops_keys + health_digest: a secret key lets the scheduled health check (GitHub Actions) read the error
--     summary without a teacher password. Only the key's SHA-256 hash is stored.
-- The cross-school summary has no nicknames, no class numbers and no answers: only counts, averages and
-- pre/post score pairs (percent) per class.

create table public.coordinators (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.client_errors (
  day date not null default current_date,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  page text not null default '' check (length(page) <= 80),
  message text not null default '' check (length(message) <= 300),
  source text not null default '' check (length(source) <= 160),
  version text not null default '' check (length(version) <= 24),
  agent text not null default '' check (length(agent) <= 160),
  count int not null default 1 check (count between 1 and 1000000),
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  primary key (day, fingerprint)
);
create table public.ops_keys (
  key_hash text primary key,
  label text not null default '' check (length(label) <= 60),
  created_at timestamptz not null default now()
);
alter table public.coordinators enable row level security;
alter table public.client_errors enable row level security;
alter table public.ops_keys enable row level security;
revoke all on public.coordinators, public.client_errors, public.ops_keys from anon, authenticated;

create or replace function public.sq_coordinator() returns void
  language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not exists (select 1 from public.coordinators where id = auth.uid()) then
    raise exception 'not_coordinator' using errcode = 'P0001';
  end if;
end $$;

-- Is the signed-in teacher also a coordinator? (the research page uses this to show or hide itself)
create or replace function public.am_coordinator() returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (select 1 from public.coordinators where id = auth.uid()) $$;

-- One row per class, grouped by the school name teachers typed when they signed up.
create or replace function public.network_report() returns jsonb
  language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public.sq_coordinator();
  return coalesce((select jsonb_agg(jsonb_build_object(
      'school', coalesce(nullif(btrim(t.school), ''), '?'),
      'className', c.name,
      'created', c.created_at,
      'students', (select count(*) from public.students s where s.class_id = c.id),
      'active7', (select count(*) from public.students s where s.class_id = c.id and s.last_seen > now() - interval '7 days'),
      'minutes', coalesce((select round(sum(e.seconds) / 60.0) from public.events e where e.class_id = c.id and e.kind = 'time'), 0),
      'answers', (select count(*) from public.events e where e.class_id = c.id and e.kind = 'answer'),
      'firstTry', (select count(*) from public.events e where e.class_id = c.id and e.kind = 'answer' and e.first_try),
      'spoken', (select count(*) from public.events e where e.class_id = c.id and e.kind = 'speech' and e.result in ('asr','self')),
      'done', coalesce((select jsonb_object_agg(x.k, x.n) from (
          select p.world || '/' || p.activity as k, count(*) as n from public.progress p join public.students s on s.id = p.student_id
           where s.class_id = c.id and p.done group by 1) x), '{}'),
      'pre', (select count(*) from public.tests x join public.students s on s.id = x.student_id where s.class_id = c.id and x.kind = 'pre'),
      'post', (select count(*) from public.tests x join public.students s on s.id = x.student_id where s.class_id = c.id and x.kind = 'post'),
      'pairs', coalesce((select jsonb_agg(jsonb_build_array(round(100.0 * a.score / nullif(a.total, 0), 1), round(100.0 * b.score / nullif(b.total, 0), 1)) order by s.number)
          from public.students s join public.tests a on a.student_id = s.id and a.kind = 'pre' join public.tests b on b.student_id = s.id and b.kind = 'post'
         where s.class_id = c.id and a.total > 0 and b.total > 0), '[]'),
      'feedback', (select jsonb_build_object('n', count(*), 'fun', round(avg(f.fun), 2), 'easy', round(avg(f.easy), 2), 'learned', round(avg(f.learned), 2))
          from public.feedback f join public.students s on s.id = f.student_id where s.class_id = c.id)
    ) order by lower(btrim(t.school)), c.name)
    from public.classes c join public.teachers t on t.id = c.teacher_id), '[]');
end $$;

-- Browsers report errors here (no sign-in). Up to 10 per call; identical errors on the same day are counted
-- in one row, and at most 500 different errors are kept per day, so the table cannot be flooded.
create or replace function public.report_error(p_errors jsonb) returns int
  language plpgsql security definer set search_path = public, pg_temp as $$
declare e jsonb; n int := 0; fp text; msg text; pg text; src text;
begin
  if jsonb_typeof(p_errors) <> 'array' or jsonb_array_length(p_errors) > 10 then raise exception 'bad_batch' using errcode = 'P0001'; end if;
  for e in select * from jsonb_array_elements(p_errors) loop
    msg := left(btrim(coalesce(e->>'message', '')), 300); pg := left(coalesce(e->>'page', ''), 80); src := left(coalesce(e->>'source', ''), 160);
    continue when msg = '';
    fp := encode(sha256(convert_to(pg || '|' || msg || '|' || src, 'UTF8')), 'hex');
    update public.client_errors set count = least(count + 1, 1000000), last_at = now(),
           version = left(coalesce(e->>'version', ''), 24), agent = left(coalesce(e->>'agent', ''), 160)
     where day = current_date and fingerprint = fp;
    if not found then
      continue when (select count(*) from public.client_errors where day = current_date) >= 500;
      insert into public.client_errors (fingerprint, page, message, source, version, agent)
      values (fp, pg, msg, src, left(coalesce(e->>'version', ''), 24), left(coalesce(e->>'agent', ''), 160))
      on conflict (day, fingerprint) do update set count = least(client_errors.count + 1, 1000000), last_at = now();
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.sq_errors_since(p_since timestamptz) returns jsonb
  language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('page', x.page, 'message', x.message, 'source', x.source, 'version', x.version, 'agent', x.agent,
                                               'count', x.n, 'first', x.f, 'last', x.l) order by x.l desc), '[]')
    from (select page, message, source, max(version) as version, max(agent) as agent, sum(count) as n, min(first_at) as f, max(last_at) as l
            from public.client_errors where last_at > p_since group by page, message, source order by max(last_at) desc limit 100) x $$;

create or replace function public.recent_errors(p_days int) returns jsonb
  language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public.sq_coordinator();
  return public.sq_errors_since(now() - make_interval(days => least(greatest(coalesce(p_days, 7), 1), 90)));
end $$;

-- For the scheduled health check: errors and activity in the last few hours. Needs the ops key.
create or replace function public.health_digest(p_key text, p_hours int) returns jsonb
  language plpgsql stable security definer set search_path = public, pg_temp as $$
declare since timestamptz := now() - make_interval(hours => least(greatest(coalesce(p_hours, 24), 1), 168));
begin
  if not exists (select 1 from public.ops_keys where key_hash = encode(sha256(convert_to(coalesce(p_key, ''), 'UTF8')), 'hex')) then
    raise exception 'bad_key' using errcode = 'P0001';
  end if;
  return jsonb_build_object('since', since, 'errors', public.sq_errors_since(since),
    'activeStudents', (select count(*) from public.students where last_seen > since),
    'events', (select count(*) from public.events where created_at > since),
    'classes', (select count(*) from public.classes));
end $$;

revoke execute on function public.sq_coordinator(), public.am_coordinator(), public.network_report(), public.report_error(jsonb),
  public.sq_errors_since(timestamptz), public.recent_errors(int), public.health_digest(text,int) from public, anon, authenticated;
grant execute on function public.report_error(jsonb), public.health_digest(text,int) to anon, authenticated;
grant execute on function public.am_coordinator(), public.network_report(), public.recent_errors(int) to authenticated;

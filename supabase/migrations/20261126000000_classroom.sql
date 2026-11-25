-- SANOR QUEST · classroom backend (Supabase / Postgres 15+)
--
-- Who can do what
--   * Teachers sign in with Supabase Auth (email + password). Row level security lets a teacher read only
--     the classes they own and the students, progress, answers and tests inside those classes.
--   * Students have no account and no email. They join with a class code + class number + nickname + 4-digit PIN
--     (join_class). They get a random session token and can only write their own data through
--     submit_events(token, …). The anon role has no direct access to any table.
--   * PINs are stored as salted SHA-256 hashes. Five wrong PINs lock that student for 10 minutes.
--
-- Data we keep about students (PDPA): class number, a nickname they choose, PIN hash, game progress,
-- answers, speaking self-checks and test scores. No real names, emails, photos or recordings.

-- ---------------------------------------------------------------- tables
create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 80),
  school text not null default '' check (length(school) <= 120),
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  worlds_open text[] not null default '{01,02}',
  thai_level text check (thai_level in ('starter','explorer','challenger')),   -- null = each student chooses
  tests_open text[] not null default '{pre}' check (tests_open <@ array['pre','post']),
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  number int not null check (number between 1 and 99),
  nickname text not null check (length(nickname) between 1 and 20),
  pin_salt text not null,
  pin_hash text not null,
  failed_logins int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  last_seen timestamptz,
  unique (class_id, number)
);

create table public.sessions (
  token_hash text primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- best progress per activity (XP never goes down; done stays done)
create table public.progress (
  student_id uuid not null references public.students(id) on delete cascade,
  world text not null check (world ~ '^[a-z0-9]{1,12}$'),
  activity text not null check (activity ~ '^[a-z0-9-]{1,24}$'),
  xp int not null default 0 check (xp between 0 and 5000),
  done boolean not null default false,
  stamps int not null default 0 check (stamps between 0 and 200),
  updated_at timestamptz not null default now(),
  primary key (student_id, world, activity)
);

-- every first answer, speaking result and test, as sent by the game (client_id makes re-sending safe)
create table public.events (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  client_id text not null check (length(client_id) between 8 and 64),
  kind text not null check (kind in ('answer','speech')),
  world text not null default '' check (length(world) <= 12),
  activity text not null default '' check (length(activity) <= 24),
  item text not null default '' check (length(item) <= 64),
  label text not null default '' check (length(label) <= 160),
  correct boolean,
  first_try boolean,
  hint boolean,
  result text check (result is null or result in ('asr','self','not-yet','skip')),
  client_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, client_id)
);
create index events_class_idx on public.events (class_id, kind);

create table public.tests (
  student_id uuid not null references public.students(id) on delete cascade,
  kind text not null check (kind in ('pre','post')),
  score int not null check (score >= 0),
  total int not null check (total > 0 and score <= total),
  answers jsonb not null default '[]',
  taken_at timestamptz not null default now(),
  primary key (student_id, kind)
);

-- ---------------------------------------------------------------- row level security
alter table public.teachers enable row level security;
alter table public.classes  enable row level security;
alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.progress enable row level security;
alter table public.events   enable row level security;
alter table public.tests    enable row level security;

revoke all on public.teachers, public.classes, public.students, public.sessions, public.progress, public.events, public.tests from anon;
grant select, insert, update on public.teachers to authenticated;
grant select, update, delete on public.classes to authenticated;
grant select, delete on public.students to authenticated;
grant select on public.progress, public.events, public.tests to authenticated;
revoke all on public.sessions from authenticated;

create policy "teacher: own profile" on public.teachers for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "teacher: own classes" on public.classes for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "teacher: students in own classes" on public.students for all to authenticated
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher: progress in own classes" on public.progress for select to authenticated
  using (exists (select 1 from public.students s join public.classes c on c.id = s.class_id where s.id = student_id and c.teacher_id = auth.uid()));
create policy "teacher: answers in own classes" on public.events for select to authenticated
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
create policy "teacher: tests in own classes" on public.tests for select to authenticated
  using (exists (select 1 from public.students s join public.classes c on c.id = s.class_id where s.id = student_id and c.teacher_id = auth.uid()));

-- ---------------------------------------------------------------- helpers
create or replace function public.sq_hash(salt text, secret text) returns text
  language sql immutable set search_path = public, pg_temp
  as $$ select encode(sha256(convert_to(salt || ':' || secret, 'UTF8')), 'hex') $$;

create or replace function public.sq_student(p_token text) returns public.students
  language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.students;
begin
  select st.* into s from public.sessions se join public.students st on st.id = se.student_id
   where se.token_hash = public.sq_hash('session', coalesce(p_token,'')) and se.expires_at > now();
  if not found then raise exception 'bad_token' using errcode = 'P0001'; end if;
  return s;
end $$;

create or replace function public.sq_settings(c public.classes) returns jsonb
  language sql stable set search_path = public, pg_temp as $$
  select jsonb_build_object('className', c.name, 'code', c.code, 'worldsOpen', to_jsonb(c.worlds_open),
                            'thaiLevel', c.thai_level, 'testsOpen', to_jsonb(c.tests_open)) $$;

create or replace function public.sq_own_class(p_class uuid) returns void
  language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid()) then
    raise exception 'not_your_class' using errcode = 'P0001';
  end if;
end $$;

-- ---------------------------------------------------------------- student functions (anon)
-- Join a class (first time) or sign in again (same class number + PIN). Returns a session token.
create or replace function public.join_class(p_code text, p_number int, p_nickname text, p_pin text) returns jsonb
  language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.classes; s public.students; tok text; nick text := btrim(coalesce(p_nickname,''));
begin
  if coalesce(p_pin,'') !~ '^[0-9]{4}$' then raise exception 'bad_pin_format' using errcode = 'P0001'; end if;
  if p_number is null or p_number not between 1 and 99 then raise exception 'bad_number' using errcode = 'P0001'; end if;
  select * into c from public.classes where code = upper(btrim(coalesce(p_code,'')));
  if not found then raise exception 'class_not_found' using errcode = 'P0001'; end if;
  select * into s from public.students where class_id = c.id and number = p_number for update;
  if found then
    if s.locked_until is not null and s.locked_until > now() then raise exception 'locked' using errcode = 'P0001'; end if;
    if s.pin_hash <> public.sq_hash(s.pin_salt, p_pin) then
      update public.students set failed_logins = failed_logins + 1,
             locked_until = case when failed_logins + 1 >= 5 then now() + interval '10 minutes' else null end
       where id = s.id;
      return jsonb_build_object('error', case when s.failed_logins + 1 >= 5 then 'locked' else 'wrong_pin' end);
    end if;
    update public.students set failed_logins = 0, locked_until = null, last_seen = now() where id = s.id returning * into s;
  else
    if length(nick) not between 1 and 20 then raise exception 'bad_nickname' using errcode = 'P0001'; end if;
    insert into public.students (class_id, number, nickname, pin_salt, pin_hash, last_seen)
    values (c.id, p_number, nick, gen_random_uuid()::text, '', now()) returning * into s;
    update public.students set pin_hash = public.sq_hash(s.pin_salt, p_pin) where id = s.id;
  end if;
  tok := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.sessions (token_hash, student_id, expires_at) values (public.sq_hash('session', tok), s.id, now() + interval '180 days');
  return jsonb_build_object('token', tok, 'student', jsonb_build_object('number', s.number, 'nickname', s.nickname), 'settings', public.sq_settings(c));
end $$;

-- Current class settings (worlds open, Thai-help level, tests open).
create or replace function public.class_settings(p_token text) returns jsonb
  language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.students; c public.classes;
begin
  s := public.sq_student(p_token);
  select * into c from public.classes where id = s.class_id;
  update public.students set last_seen = now() where id = s.id;
  return public.sq_settings(c);
end $$;

-- Upload a batch from the game's outbox. Safe to send twice (client_id). Returns how many were new.
create or replace function public.submit_events(p_token text, p_events jsonb) returns int
  language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.students; e jsonb; n int := 0; k text; got int;
begin
  s := public.sq_student(p_token);
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 200 then raise exception 'bad_batch' using errcode = 'P0001'; end if;
  for e in select * from jsonb_array_elements(p_events) loop
    k := e->>'kind';
    if k in ('answer','speech') then
      insert into public.events (student_id, class_id, client_id, kind, world, activity, item, label, correct, first_try, hint, result, client_at)
      values (s.id, s.class_id, left(e->>'id', 64), k, left(coalesce(e->>'world',''),12), left(coalesce(e->>'activity',''),24),
              left(coalesce(e->>'item',''),64), left(coalesce(e->>'label',''),160),
              (e->>'correct')::boolean, (e->>'firstTry')::boolean, (e->>'hint')::boolean,
              case when e->>'result' in ('asr','self','not-yet','skip') then e->>'result' end,
              least(now(), coalesce((e->>'at')::timestamptz, now())))
      on conflict (student_id, client_id) do nothing;
      get diagnostics got = row_count; n := n + got;
    elsif k = 'progress' then
      insert into public.progress (student_id, world, activity, xp, done, stamps)
      values (s.id, e->>'world', e->>'activity', least(5000, greatest(0, coalesce((e->>'xp')::int,0))), coalesce((e->>'done')::boolean,false), least(200, greatest(0, coalesce((e->>'stamps')::int,0))))
      on conflict (student_id, world, activity) do update
        set xp = greatest(progress.xp, excluded.xp), done = progress.done or excluded.done,
            stamps = greatest(progress.stamps, excluded.stamps), updated_at = now();
      n := n + 1;
    elsif k = 'test' and e->>'test' in ('pre','post') then
      insert into public.tests (student_id, kind, score, total, answers)
      values (s.id, e->>'test', (e->>'score')::int, (e->>'total')::int, coalesce(e->'answers','[]'::jsonb))
      on conflict (student_id, kind) do nothing;          -- the first attempt is the one that counts
      get diagnostics got = row_count; n := n + got;
    end if;
  end loop;
  update public.students set last_seen = now() where id = s.id;
  return n;
end $$;

-- ---------------------------------------------------------------- teacher functions (authenticated)
create or replace function public.ensure_teacher(p_name text, p_school text) returns void
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in' using errcode = 'P0001'; end if;
  insert into public.teachers (id, display_name, school) values (auth.uid(), left(coalesce(p_name,''),80), left(coalesce(p_school,''),120))
  on conflict (id) do update set display_name = case when excluded.display_name <> '' then excluded.display_name else teachers.display_name end,
                                 school = case when excluded.school <> '' then excluded.school else teachers.school end;
end $$;

create or replace function public.create_class(p_name text) returns jsonb
  language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.classes; new_code text; tries int := 0;
begin
  if auth.uid() is null or not exists (select 1 from public.teachers where id = auth.uid()) then raise exception 'not_signed_in' using errcode = 'P0001'; end if;
  loop   -- 6 characters without look-alikes (no 0/O, 1/I)
    new_code := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random()*32)::int, 1), '') from generate_series(1,6));
    exit when not exists (select 1 from public.classes where code = new_code);
    tries := tries + 1; if tries > 20 then raise exception 'no_code' using errcode = 'P0001'; end if;
  end loop;
  insert into public.classes (teacher_id, name, code) values (auth.uid(), btrim(p_name), new_code) returning * into c;
  return jsonb_build_object('id', c.id) || public.sq_settings(c);
end $$;

create or replace function public.my_classes() returns jsonb
  language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'students', (select count(*) from public.students s where s.class_id = c.id)) || public.sq_settings(c) order by c.created_at), '[]')
    from public.classes c where c.teacher_id = auth.uid() $$;

create or replace function public.update_class(p_class uuid, p_name text, p_worlds text[], p_thai text, p_tests text[]) returns jsonb
  language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.classes;
begin
  perform public.sq_own_class(p_class);
  update public.classes set name = coalesce(nullif(btrim(p_name),''), name), worlds_open = coalesce(p_worlds, worlds_open),
         thai_level = case when p_thai in ('starter','explorer','challenger') then p_thai else null end,
         tests_open = coalesce(p_tests, tests_open)
   where id = p_class returning * into c;
  return jsonb_build_object('id', c.id) || public.sq_settings(c);
end $$;

-- Everything the dashboard needs for one class, in one call.
create or replace function public.class_report(p_class uuid) returns jsonb
  language plpgsql stable security definer set search_path = public, pg_temp as $$
declare out jsonb;
begin
  perform public.sq_own_class(p_class);
  select jsonb_build_object(
    'class', (select jsonb_build_object('id', c.id) || public.sq_settings(c) from public.classes c where c.id = p_class),
    'students', coalesce((select jsonb_agg(jsonb_build_object(
        'id', s.id, 'number', s.number, 'nickname', s.nickname, 'lastSeen', s.last_seen, 'locked', s.locked_until > now(),
        'xp', coalesce((select sum(p.xp) from public.progress p where p.student_id = s.id), 0),
        'progress', coalesce((select jsonb_agg(jsonb_build_object('world', p.world, 'activity', p.activity, 'xp', p.xp, 'done', p.done)) from public.progress p where p.student_id = s.id), '[]'),
        'answers', (select count(*) from public.events e where e.student_id = s.id and e.kind = 'answer'),
        'firstTry', (select count(*) from public.events e where e.student_id = s.id and e.kind = 'answer' and e.first_try),
        'hints', (select count(*) from public.events e where e.student_id = s.id and e.kind = 'answer' and e.hint),
        'spoken', (select count(*) from public.events e where e.student_id = s.id and e.kind = 'speech' and e.result in ('asr','self')),
        'pre', (select jsonb_build_object('score', t.score, 'total', t.total) from public.tests t where t.student_id = s.id and t.kind = 'pre'),
        'post', (select jsonb_build_object('score', t.score, 'total', t.total) from public.tests t where t.student_id = s.id and t.kind = 'post')
      ) order by s.number) from public.students s where s.class_id = p_class), '[]'),
    'missed', coalesce((select jsonb_agg(m) from (
        select jsonb_build_object('item', e.item, 'label', max(e.label), 'world', max(e.world), 'missed', count(*) filter (where not e.first_try), 'tries', count(*)) as m
          from public.events e where e.class_id = p_class and e.kind = 'answer' and e.item <> ''
         group by e.item having count(*) filter (where not e.first_try) > 0
         order by count(*) filter (where not e.first_try) desc, e.item limit 10) x), '[]')
  ) into out;
  return out;
end $$;

create or replace function public.student_detail(p_student uuid) returns jsonb
  language plpgsql stable security definer set search_path = public, pg_temp as $$
declare s public.students;
begin
  select * into s from public.students where id = p_student;
  if not found then raise exception 'not_your_class' using errcode = 'P0001'; end if;
  perform public.sq_own_class(s.class_id);
  return jsonb_build_object('number', s.number, 'nickname', s.nickname,
    'events', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'world', e.world, 'activity', e.activity, 'item', e.item, 'label', e.label,
                 'correct', e.correct, 'firstTry', e.first_try, 'hint', e.hint, 'result', e.result, 'at', coalesce(e.client_at, e.created_at)) order by e.id desc)
               from (select * from public.events where student_id = s.id order by id desc limit 500) e), '[]'),
    'tests', coalesce((select jsonb_agg(jsonb_build_object('kind', t.kind, 'score', t.score, 'total', t.total, 'answers', t.answers, 'at', t.taken_at)) from public.tests t where t.student_id = s.id), '[]'));
end $$;

create or replace function public.reset_student_pin(p_student uuid, p_pin text) returns void
  language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.students;
begin
  if coalesce(p_pin,'') !~ '^[0-9]{4}$' then raise exception 'bad_pin_format' using errcode = 'P0001'; end if;
  select * into s from public.students where id = p_student;
  if not found then raise exception 'not_your_class' using errcode = 'P0001'; end if;
  perform public.sq_own_class(s.class_id);
  update public.students set pin_hash = public.sq_hash(pin_salt, p_pin), failed_logins = 0, locked_until = null where id = s.id;
  delete from public.sessions where student_id = s.id;   -- old devices must sign in again
end $$;

create or replace function public.remove_student(p_student uuid) returns void
  language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.students;
begin
  select * into s from public.students where id = p_student;
  if not found then return; end if;
  perform public.sq_own_class(s.class_id);
  delete from public.students where id = s.id;           -- cascades to sessions, progress, events, tests
end $$;

-- ---------------------------------------------------------------- who may call what
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.join_class(text,int,text,text), public.class_settings(text), public.submit_events(text,jsonb) to anon, authenticated;
grant execute on function public.ensure_teacher(text,text), public.create_class(text), public.my_classes(), public.update_class(uuid,text,text[],text,text[]),
  public.class_report(uuid), public.student_detail(uuid), public.reset_student_pin(uuid,text), public.remove_student(uuid) to authenticated;

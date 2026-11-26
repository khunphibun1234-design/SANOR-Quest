-- SANOR QUEST · classroom pilot data (Phase 7)
--   * play time: the game sends active seconds (screen visible and the student doing something) per activity
--   * steps: a question/stage was opened or finished → where students get stuck or stop
--   * student feedback after each mission (3 smiley questions + an optional comment)
--   * teacher notes per week of the pilot
-- Everything follows the same rules as before: students write only their own rows, teachers read only their classes.

alter table public.events drop constraint if exists events_kind_check;
alter table public.events add constraint events_kind_check check (kind in ('answer','speech','time','step'));
alter table public.events add column if not exists seconds int check (seconds is null or seconds between 0 and 3600);
alter table public.events add column if not exists action text check (action is null or action in ('open','done'));
create index if not exists events_class_kind_item_idx on public.events (class_id, kind, world, activity, item);

create table public.feedback (
  student_id uuid not null references public.students(id) on delete cascade,
  world text not null check (length(world) <= 12),
  activity text not null check (length(activity) <= 24),
  fun smallint check (fun between 1 and 3),
  easy smallint check (easy between 1 and 3),
  learned smallint check (learned between 1 and 3),
  comment text not null default '' check (length(comment) <= 300),
  created_at timestamptz not null default now(),
  primary key (student_id, world, activity)
);
create table public.teacher_notes (
  id bigint generated always as identity primary key,
  class_id uuid not null references public.classes(id) on delete cascade,
  week int not null check (week between 0 and 52),
  note text not null check (length(note) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
alter table public.teacher_notes enable row level security;
revoke all on public.feedback, public.teacher_notes from anon;
grant select on public.feedback, public.teacher_notes to authenticated;
create policy "teacher: feedback in own classes" on public.feedback for select to authenticated
  using (exists (select 1 from public.students s join public.classes c on c.id = s.class_id where s.id = student_id and c.teacher_id = auth.uid()));
create policy "teacher: notes in own classes" on public.teacher_notes for select to authenticated
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- submit_events: also accepts time, step and feedback
create or replace function public.submit_events(p_token text, p_events jsonb) returns int
  language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.students; e jsonb; n int := 0; k text; got int;
begin
  s := public.sq_student(p_token);
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 200 then raise exception 'bad_batch' using errcode = 'P0001'; end if;
  for e in select * from jsonb_array_elements(p_events) loop
    k := e->>'kind';
    if k in ('answer','speech','time','step') then
      insert into public.events (student_id, class_id, client_id, kind, world, activity, item, label, correct, first_try, hint, result, seconds, action, client_at)
      values (s.id, s.class_id, left(e->>'id', 64), k, left(coalesce(e->>'world',''),12), left(coalesce(e->>'activity',''),24),
              left(coalesce(e->>'item',''),64), left(coalesce(e->>'label',''),160),
              (e->>'correct')::boolean, (e->>'firstTry')::boolean, (e->>'hint')::boolean,
              case when e->>'result' in ('asr','self','not-yet','skip') then e->>'result' end,
              case when k = 'time' then least(3600, greatest(0, coalesce((e->>'seconds')::int, 0))) end,
              case when e->>'action' in ('open','done') then e->>'action' end,
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
      on conflict (student_id, kind) do nothing;
      get diagnostics got = row_count; n := n + got;
    elsif k = 'feedback' then                                   -- the latest answer per mission counts
      insert into public.feedback (student_id, world, activity, fun, easy, learned, comment)
      values (s.id, left(coalesce(e->>'world',''),12), left(coalesce(e->>'activity',''),24),
              nullif((e->>'fun')::int,0), nullif((e->>'easy')::int,0), nullif((e->>'learned')::int,0), left(coalesce(e->>'comment',''),300))
      on conflict (student_id, world, activity) do update set fun = excluded.fun, easy = excluded.easy, learned = excluded.learned, comment = excluded.comment, created_at = now();
      n := n + 1;
    end if;
  end loop;
  update public.students set last_seen = now() where id = s.id;
  return n;
end $$;

-- Everything the pilot tab needs for one class. Weeks count from the class's creation (week 1 = first 7 days).
create or replace function public.pilot_report(p_class uuid) returns jsonb
  language plpgsql stable security definer set search_path = public, pg_temp as $$
declare c public.classes;
begin
  perform public.sq_own_class(p_class);
  select * into c from public.classes where id = p_class;
  return jsonb_build_object(
    'start', c.created_at,
    'time', coalesce((select jsonb_agg(jsonb_build_object('student', x.student_id, 'week', x.week, 'world', x.world, 'activity', x.activity, 'seconds', x.secs)) from (
        select e.student_id, greatest(1, floor(extract(epoch from (coalesce(e.client_at, e.created_at) - c.created_at)) / 604800)::int + 1) as week, e.world, e.activity, sum(e.seconds)::int as secs
          from public.events e where e.class_id = p_class and e.kind = 'time' group by 1,2,3,4) x), '[]'),
    'steps', coalesce((select jsonb_agg(jsonb_build_object('world', x.world, 'activity', x.activity, 'item', x.item, 'opened', x.opened, 'done', x.done)) from (
        select e.world, e.activity, e.item, count(distinct e.student_id) filter (where e.action = 'open') as opened, count(distinct e.student_id) filter (where e.action = 'done') as done
          from public.events e where e.class_id = p_class and e.kind = 'step' group by 1,2,3) x), '[]'),
    'feedback', coalesce((select jsonb_agg(jsonb_build_object('world', f.world, 'activity', f.activity, 'fun', f.fun, 'easy', f.easy, 'learned', f.learned, 'comment', f.comment, 'number', s.number, 'at', f.created_at) order by f.created_at desc)
        from public.feedback f join public.students s on s.id = f.student_id where s.class_id = p_class), '[]'),
    'notes', coalesce((select jsonb_agg(jsonb_build_object('week', n.week, 'note', n.note, 'at', n.created_at) order by n.created_at desc) from public.teacher_notes n where n.class_id = p_class), '[]'));
end $$;

create or replace function public.add_teacher_note(p_class uuid, p_week int, p_note text) returns void
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.sq_own_class(p_class);
  insert into public.teacher_notes (class_id, week, note) values (p_class, p_week, btrim(p_note));
end $$;

-- Raw answers/steps/time for research (CSV export), newest first, at most 20 000 rows.
create or replace function public.pilot_events(p_class uuid) returns jsonb
  language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  perform public.sq_own_class(p_class);
  return coalesce((select jsonb_agg(jsonb_build_object('number', s.number, 'kind', e.kind, 'world', e.world, 'activity', e.activity, 'item', e.item, 'label', e.label,
           'correct', e.correct, 'firstTry', e.first_try, 'hint', e.hint, 'result', e.result, 'seconds', e.seconds, 'action', e.action, 'at', coalesce(e.client_at, e.created_at)))
    from (select * from public.events where class_id = p_class order by id desc limit 20000) e join public.students s on s.id = e.student_id), '[]');
end $$;

revoke execute on function public.pilot_report(uuid), public.add_teacher_note(uuid,int,text), public.pilot_events(uuid) from public, anon, authenticated;
grant execute on function public.submit_events(text,jsonb) to anon, authenticated;
grant execute on function public.pilot_report(uuid), public.add_teacher_note(uuid,int,text), public.pilot_events(uuid) to authenticated;

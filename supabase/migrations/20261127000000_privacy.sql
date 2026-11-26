-- SANOR QUEST · privacy (PDPA): a student can delete everything stored about them, and a teacher can delete a
-- whole class at the end of the school year. Deleting cascades to sessions, progress, answers and tests.

create or replace function public.delete_me(p_token text) returns void
  language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.students;
begin
  s := public.sq_student(p_token);
  delete from public.students where id = s.id;
end $$;

create or replace function public.delete_class(p_class uuid) returns void
  language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.sq_own_class(p_class);
  delete from public.classes where id = p_class;
end $$;

revoke execute on function public.delete_me(text), public.delete_class(uuid) from public, anon, authenticated;
grant execute on function public.delete_me(text) to anon, authenticated;
grant execute on function public.delete_class(uuid) to authenticated;

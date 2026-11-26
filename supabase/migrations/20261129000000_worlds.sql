-- SANOR QUEST · Maps 03–06 are playable: new classes open all six worlds (teachers can still close any of them).
alter table public.classes alter column worlds_open set default '{01,02,03,04,05,06}';

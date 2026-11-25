// Runs the Supabase migration on PGlite (real Postgres in WebAssembly) with a minimal stand-in for Supabase's
// auth schema and roles, so the access rules and functions can be tested without a Supabase project.
import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';import path from 'node:path';
export async function freshDb(){
  const db=new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
  const dir=path.join(import.meta.dirname,'../../supabase/migrations');
  for(const f of fs.readdirSync(dir).sort())await db.exec(fs.readFileSync(path.join(dir,f),'utf8'));
  // act as a role: 'anon' (a student's browser) or a teacher id (signed-in teacher)
  const as=async(who,sql,params=[])=>{await db.exec(who==='anon'?`set role anon; select set_config('request.jwt.claim.sub','',false)`:`set role authenticated; select set_config('request.jwt.claim.sub','${who}',false)`);
    try{return (await db.query(sql,params)).rows;}finally{await db.exec('reset role');}};
  const teacher=async(id,name='Kru A')=>{await db.query('insert into auth.users(id) values ($1)',[id]);await as(id,'select ensure_teacher($1,$2)',[name,'Phibun School']);return id;};
  return {db,as,teacher};}

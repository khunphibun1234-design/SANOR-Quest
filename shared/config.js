/* SANOR QUEST · connection settings.
 * Leave both empty to run in demo mode (class data stays in this browser; good for trying the teacher dashboard).
 * To use a real classroom server, create a Supabase project, run supabase/migrations/*.sql, then paste the
 * Project URL and the anon public key here (Supabase → Project Settings → API). The anon key is meant to be public:
 * the database rules (row level security) decide what it can do. See docs/SETUP-SUPABASE.md. */
window.SQ_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};

# Repository Notes

This is a standalone Supabase + Vite app. Keep backend secrets in Supabase Edge Function secrets, not in frontend code.

Important paths:

- `src/api/supabaseClient.js`: Supabase client and app data/auth adapter.
- `src/lib/jobshieldAnalysis.js`: frontend calls into the `jobshield-ai` Edge Function.
- `supabase/schema.sql`: database tables, RLS policies, and storage bucket setup.
- `supabase/functions/jobshield-ai/index.ts`: Gemini-powered analysis function.

Use `npm run dev` for local frontend development and `npm run build` before handing off changes.

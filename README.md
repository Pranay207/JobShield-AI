# JobShield

JobShield is a React/Vite app for checking suspicious job offers. It uses Supabase for auth, database, storage, and Edge Functions, with Gemini powering AI analysis through the `jobshield-ai` function.

## Local Setup

```bash
npm install
npm run dev
```

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Set Edge Function secrets:

```bash
supabase link --project-ref tuayaldzrqivsdyrehg
supabase secrets set GEMINI_API_KEY=your_new_gemini_key
supabase secrets set GEMINI_MODEL=gemini-3.5-flash
supabase functions deploy jobshield-ai
```

3. Import CSV exports through Supabase Table Editor:

- `CommunityReport_export.csv` -> `community_reports`
- `Scan_export.csv` -> `scans`
- `ScamPattern_export.csv` -> `scam_patterns` if it has rows

Never put Gemini secret keys in frontend `.env` files.

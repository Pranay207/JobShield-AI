# Supabase + Gemini Setup

JobShield uses Supabase for auth/database/storage and the `jobshield-ai` Edge Function for Gemini-powered scan analysis.

## 1. Rotate the exposed key

If you pasted a Gemini key into chat or screenshots, revoke it in Google AI Studio and create a new one.

## 2. Create Supabase tables

Open Supabase SQL Editor and run:

```sql
-- paste the contents of supabase/schema.sql
```

## 3. Set Edge Function secrets

Install/login to the Supabase CLI, then run from this project folder:

```bash
supabase login
supabase link --project-ref tuayaldzrqivsdyrehg
supabase secrets set GEMINI_API_KEY=your_new_gemini_key
supabase secrets set GEMINI_MODEL=gemini-3.5-flash
```

## 4. Deploy the AI function

```bash
supabase functions deploy jobshield-ai
```

## 5. Import legacy CSV exports

Use Supabase Table Editor CSV import:

- `CommunityReport_export.csv` -> `community_reports`
- `Scan_export.csv` -> `scans`
- `ScamPattern_export.csv` -> `scam_patterns` if it has rows

The app will use Gemini for pasted text, uploaded file text extraction, company verification, and the scan coach once the function is deployed.


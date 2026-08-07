# JobShield ScamShield Copilot

Chrome/Edge extension prototype for real-time job scam detection.

## What works

- Scans visible page text automatically.
- Scores risk locally with fast scam rules.
- Calls the deployed Supabase Edge Function for AI analysis when enabled.
- Highlights risky page text.
- Supports selected-text scanning.
- Opens JobShield Analyzer with page text prefilled.
- Popup lets you change the JobShield app URL after deployment.

## Install locally

1. Open `edge://extensions` or `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this folder:

```text
C:\Users\Shiva\Downloads\Jobshield\extension\jobshield-copilot
```

## After Vercel deploy

Open the extension popup and change JobShield app URL from:

```text
https://job-shield-ai-beta.vercel.app
```

to your Vercel URL.

The Gemini API key is not stored in the extension. AI requests go through Supabase Edge Function `jobshield-ai`.

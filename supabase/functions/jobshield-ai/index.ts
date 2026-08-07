const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini';
const OPENAI_URL = 'https://api.openai.com/v1/responses';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseJsonText(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI did not return JSON.');
    return JSON.parse(match[0]);
  }
}

async function callGemini(parts: Array<Record<string, unknown>>, useJson = true) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in Supabase secrets.');
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.2,
      ...(useJson ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Gemini request failed.');
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join('\n').trim();
  if (!text) throw new Error('Gemini returned an empty response.');
  return useJson ? parseJsonText(text) : { answer: text };
}


function openAIContentFromGeminiParts(parts: Array<Record<string, unknown>>) {
  return parts.map((part) => {
    if (typeof part.text === 'string') {
      return { type: 'input_text', text: part.text };
    }

    const inline = part.inline_data as { mime_type?: string; data?: string } | undefined;
    if (inline?.data && inline?.mime_type) {
      const dataUrl = `data:${inline.mime_type};base64,${inline.data}`;
      if (inline.mime_type.startsWith('image/')) {
        return { type: 'input_image', image_url: dataUrl };
      }
      return { type: 'input_file', filename: `jobshield-upload.${inline.mime_type.includes('pdf') ? 'pdf' : 'bin'}`, file_data: dataUrl };
    }

    return { type: 'input_text', text: JSON.stringify(part) };
  });
}

function textFromOpenAIResponse(data: Record<string, unknown>) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();

  const output = data.output as Array<Record<string, unknown>> | undefined;
  const chunks: string[] = [];
  for (const item of output || []) {
    const content = item.content as Array<Record<string, unknown>> | undefined;
    for (const part of content || []) {
      if (typeof part.text === 'string') chunks.push(part.text);
    }
  }
  return chunks.join('\n').trim();
}

async function callOpenAI(parts: Array<Record<string, unknown>>, useJson = true) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in Supabase secrets.');
  }

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [{ role: 'user', content: openAIContentFromGeminiParts(parts) }],
      temperature: 0.2,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'OpenAI request failed.');
  }

  const text = textFromOpenAIResponse(data);
  if (!text) throw new Error('OpenAI returned an empty response.');
  return useJson ? parseJsonText(text) : { answer: text };
}

async function callAI(parts: Array<Record<string, unknown>>, useJson = true) {
  try {
    return await callGemini(parts, useJson);
  } catch (geminiError) {
    console.warn('Gemini failed, trying OpenAI backup:', geminiError);
    return await callOpenAI(parts, useJson);
  }
}

const analysisPrompt = (text: string) => `You are JobShield, an expert scam-detection system for job offers targeting job seekers in India.

Analyze the job-offer text below and assess the probability that it is a fraudulent/fake job offer scam.

The input may be written in English, Hindi, Telugu, Hinglish, or a mix. Your summary and red flag descriptions must be in clear English.

Look for: upfront payment demands, urgency, free/generic email domains, WhatsApp/Telegram-only contact, unrealistic salary, no interview, vague role details, fabricated company names, early Aadhaar/PAN/bank requests, and poor corporate authenticity.

Return ONLY valid JSON with this exact shape:
{
  "risk_score": 0,
  "risk_level": "Low Risk | Medium Risk | High Risk",
  "language_detected": "English",
  "company_name": "",
  "summary": "",
  "red_flags": [{ "type": "", "title": "", "description": "", "severity": "low | medium | high", "evidence": "" }],
  "recommendations": [""]
}

Rules:
- risk_score must be an integer 0-100.
- risk_level must match score: Low 0-39, Medium 40-69, High 70-100.
- Only include red flags supported by evidence in the text.
- Never recommend paying any fee.

JOB OFFER TEXT:
"""
${text}
"""`;

const verificationPrompt = (companyName: string) => `Verify this Indian company name for a job-scam check: "${companyName}".

Return ONLY valid JSON:
{
  "company_name": "${companyName}",
  "mca_status": "Verified | Not Found | Uncertain",
  "gst_status": "Verified | Not Found | Uncertain",
  "domain_check": "Legitimate | Suspicious | Not Found",
  "blacklist_check": "Clear | Flagged | Uncertain",
  "is_verified": false,
  "notes": ""
}

Be conservative. If you cannot verify from provided knowledge, mark Uncertain or Not Found.`;

const offerDnaPrompt = (text: string) => `You are OfferDNA, a contract and financial-risk parser for job offer letters in India.

Find hidden traps in this offer letter or recruiter message: upfront fees, refundable deposits, training fees, bonds, penalties, unpaid probation, salary deductions, document retention, UPI/bank transfer instructions, fake equipment charges, and legal pressure.

Return ONLY valid JSON:
{
  "score": 0,
  "level": "Low Contract Risk | Medium Contract Risk | High Contract Risk",
  "estimated_money_at_risk": 0,
  "clauses": [{ "type": "", "label": "", "severity": "low | medium | high | critical", "evidence": "", "explanation": "" }],
  "hidden_traps": [""],
  "recommendation": ""
}

Rules:
- score must be 0-100.
- Only include clauses supported by evidence.
- estimated_money_at_risk should be the largest amount demanded or 0.
- Never advise payment.

TEXT:
"""
${text}
"""`;

const recruiterRealityPrompt = (text: string, companyName: string, verification: unknown) => `You are Recruiter Reality Check, an identity-risk analyzer for job scams.

Check whether the recruiter appears to actually belong to the claimed company. Look at email domains, free email usage, phone-only hiring, WhatsApp/Telegram pressure, LinkedIn/profile proof, mismatch between claimed company and sender identity, and company verification context.

Claimed company: ${companyName || 'Unknown'}
Company verification context: ${JSON.stringify(verification || {})}

Return ONLY valid JSON:
{
  "score": 0,
  "status": "Verified Recruiter | Needs Manual Proof | Impersonation Risk",
  "recruiter_name": "",
  "claimed_company": "",
  "emails": [""],
  "phones": [""],
  "linkedin_profile": "",
  "checks": [{ "label": "", "status": "pass | warn | fail", "detail": "" }],
  "verdict": ""
}

Rules:
- score must be 0-100.
- Be conservative. A real company name does not prove the recruiter is real.
- Free email + personal messaging + payment request should strongly reduce score.

TEXT:
"""
${text}
"""`;

const coachPrompt = (context: string, question: string) => `You are JobShield Coach, an anti-scam assistant for Indian job seekers.

Context:
${context}

User question: ${question}

Answer clearly, briefly, and practically. Never recommend paying a fee. If reporting is relevant, mention cybercrime.gov.in and 1930.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const payload = await req.json();
    const action = payload.action || 'analyze';

    if (action === 'analyze') {
      if (!payload.text || String(payload.text).trim().length < 20) {
        return json({ error: 'Offer text is too short.' }, 400);
      }
      return json(await callAI([{ text: analysisPrompt(String(payload.text)) }]));
    }

    if (action === 'extract') {
      if (!payload.base64 || !payload.mimeType) {
        return json({ error: 'Missing file content.' }, 400);
      }
      const prompt = 'Extract all readable job-offer text from this file. Detect the primary language. Return ONLY JSON: { "extracted_text": "", "language_detected": "English" }';
      return json(await callAI([
        { text: prompt },
        { inline_data: { mime_type: payload.mimeType, data: payload.base64 } },
      ]));
    }

    if (action === 'verify_company') {
      if (!payload.companyName) return json({ error: 'Missing companyName.' }, 400);
      return json(await callAI([{ text: verificationPrompt(String(payload.companyName)) }]));
    }

    if (action === 'offer_dna') {
      if (!payload.text || String(payload.text).trim().length < 20) {
        return json({ error: 'Offer text is too short.' }, 400);
      }
      return json(await callAI([{ text: offerDnaPrompt(String(payload.text)) }]));
    }

    if (action === 'recruiter_reality') {
      if (!payload.text || String(payload.text).trim().length < 20) {
        return json({ error: 'Offer text is too short.' }, 400);
      }
      return json(await callAI([{ text: recruiterRealityPrompt(String(payload.text), String(payload.companyName || ''), payload.verification || null) }]));
    }
    if (action === 'coach') {
      if (!payload.question) return json({ error: 'Missing question.' }, 400);
      return json(await callAI([{ text: coachPrompt(String(payload.context || ''), String(payload.question)) }], false));
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});



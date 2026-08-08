const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL');

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isHighRiskReport(report: Record<string, unknown>) {
  const scamType = String(report.scam_type || '').toLowerCase();
  const channel = String(report.channel || '').toLowerCase();
  const description = String(report.description || '').toLowerCase();
  const amount = Number(report.amount_demanded || 0);
  const text = `${scamType} ${channel} ${description}`;

  return amount > 0 ||
    /upfront|payment|document|fake recruiter|whatsapp|telegram|fraud|otp|aadhaar|aadhar|pan|bank|upi|deposit|registration|training|security|refundable/i.test(text);
}

function clean(value: unknown, fallback = 'Not provided') {
  const text = String(value || '').trim();
  return text || fallback;
}

function truncate(value: unknown, limit = 900) {
  const text = clean(value, 'No description');
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function slackPayload(report: Record<string, unknown>) {
  const amount = Number(report.amount_demanded || 0);
  const amountLine = amount > 0 ? `Rs. ${amount.toLocaleString('en-IN')}` : 'No amount entered';

  return {
    text: `High-risk JobShield scam report: ${clean(report.scam_type)}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'High-risk JobShield scam report', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Scam type:*\n${clean(report.scam_type)}` },
          { type: 'mrkdwn', text: `*Channel:*\n${clean(report.channel)}` },
          { type: 'mrkdwn', text: `*Company / recruiter:*\n${clean(report.company_name)}` },
          { type: 'mrkdwn', text: `*City:*\n${clean(report.city)}` },
          { type: 'mrkdwn', text: `*Amount demanded:*\n${amountLine}` },
          { type: 'mrkdwn', text: `*Report ID:*\n${clean(report.id)}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Description:*\n${truncate(report.description)}` },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: 'Sent automatically by JobShield community reporting.' },
        ],
      },
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const payload = await req.json();
    const report = payload.report || payload;

    if (!report || typeof report !== 'object') {
      return json({ error: 'Missing report payload.' }, 400);
    }

    if (!isHighRiskReport(report)) {
      return json({ skipped: true, reason: 'Report is not high risk.' });
    }

    if (!SLACK_WEBHOOK_URL) {
      return json({ skipped: true, reason: 'SLACK_WEBHOOK_URL is not configured.' });
    }

    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload(report)),
    });

    if (!res.ok) {
      const message = await res.text();
      return json({ error: message || 'Slack webhook failed.' }, 502);
    }

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
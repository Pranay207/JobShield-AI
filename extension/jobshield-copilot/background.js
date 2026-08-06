const DEFAULTS = {
  appUrl: "http://127.0.0.1:5173",
  supabaseUrl: "https://tuayaldzrqivsdyrrehg.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YXlhbGR6cnFpdnNkeXJyZWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjA5OTksImV4cCI6MjEwMTU5Njk5OX0.6CkuMtSTTlQvhYLwU_0pXaxDRkV4RN23HBfVLbfZs78",
  aiEnabled: true
};

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULTS, resolve);
  });
}

async function saveSettings(values) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(values, resolve);
  });
}

async function analyzeWithJobShield(text) {
  const settings = await getSettings();
  if (!settings.aiEnabled) return { skipped: true };
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) return { skipped: true };

  const endpoint = `${settings.supabaseUrl.replace(/\/$/, "")}/functions/v1/jobshield-ai`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: settings.supabaseAnonKey,
      Authorization: `Bearer ${settings.supabaseAnonKey}`
    },
    body: JSON.stringify({ action: "analyze", text: text.slice(0, 12000) })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error || "AI scan failed");
  return data;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (current) => {
    chrome.storage.sync.set({ ...DEFAULTS, ...current });
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "JOBSHIELD_GET_SETTINGS") {
    getSettings().then((settings) => sendResponse({ ok: true, settings }));
    return true;
  }

  if (message?.type === "JOBSHIELD_SAVE_SETTINGS") {
    saveSettings(message.settings || {}).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "JOBSHIELD_AI_ANALYZE") {
    analyzeWithJobShield(message.text || "")
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message || "AI scan failed" }));
    return true;
  }

  return false;
});
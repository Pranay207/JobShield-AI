const DEFAULTS = {
  appUrl: "https://job-shield-ai-beta.vercel.app",
  aiEnabled: true
};

const appUrl = document.getElementById("appUrl");
const aiEnabled = document.getElementById("aiEnabled");
const statusEl = document.getElementById("status");

function send(type, payload = {}) {
  return new Promise((resolve) => chrome.runtime.sendMessage({ type, ...payload }, resolve));
}

async function load() {
  const response = await send("JOBSHIELD_GET_SETTINGS");
  const settings = { ...DEFAULTS, ...(response?.settings || {}) };
  appUrl.value = settings.appUrl;
  aiEnabled.checked = Boolean(settings.aiEnabled);
}

async function save() {
  await send("JOBSHIELD_SAVE_SETTINGS", {
    settings: {
      appUrl: appUrl.value.trim() || DEFAULTS.appUrl,
      aiEnabled: aiEnabled.checked
    }
  });
  statusEl.textContent = "Saved";
  setTimeout(() => { statusEl.textContent = ""; }, 1500);
}

document.getElementById("save")?.addEventListener("click", save);
document.getElementById("open")?.addEventListener("click", () => {
  const base = (appUrl.value.trim() || DEFAULTS.appUrl).replace(/\/$/, "");
  chrome.tabs.create({ url: `${base}/analyzer` });
});

load();

import {
  ALLOW,
  REDIRECT,
  effectiveMode,
  isOnion,
  loadSettings,
  normalizeDomain,
  saveSettings,
  setSiteMode,
} from "./sites.js";

const siteEl = document.getElementById("site");
const statusEl = document.getElementById("status");
const enabledEl = document.getElementById("enabled");
const redirectBtn = document.getElementById("redirect");
const allowBtn = document.getElementById("allow");

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const host = tab?.url && /^https?:/.test(tab.url) ? normalizeDomain(tab.url) : null;

async function render() {
  const { sites, enabled } = await loadSettings();
  enabledEl.checked = enabled;

  if (!host || isOnion(host)) {
    siteEl.textContent = host ?? "This page";
    statusEl.textContent = host ? "You're already on The Onion." : "Onionifier only works on websites.";
    redirectBtn.disabled = allowBtn.disabled = true;
    return;
  }

  const mode = effectiveMode(sites, host);
  siteEl.textContent = host;
  statusEl.textContent =
    mode === REDIRECT ? "This site is sent to The Onion." : "This site loads normally.";
  redirectBtn.disabled = mode === REDIRECT;
  allowBtn.disabled = mode === ALLOW;
}

async function changeMode(mode) {
  const { sites } = await loadSettings();
  await saveSettings({ sites: setSiteMode(sites, host, mode) });
  if (mode === REDIRECT) {
    chrome.tabs.reload(tab.id);
    window.close();
  } else {
    render();
  }
}

enabledEl.addEventListener("change", async () => {
  await saveSettings({ enabled: enabledEl.checked });
});
redirectBtn.addEventListener("click", () => changeMode(REDIRECT));
allowBtn.addEventListener("click", () => changeMode(ALLOW));
document.getElementById("manage").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

render();

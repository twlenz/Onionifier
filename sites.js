// Shared helpers for reading and changing which sites get sent to The Onion.
// Settings live in chrome.storage.sync:
//   sites:   { "bbc.com": "redirect", "mail.yahoo.com": "allow", ... }
//   enabled: true | false
// An entry covers the domain and all of its subdomains. When both a redirect
// entry and an allow entry cover a site, the allow entry wins.

export const REDIRECT = "redirect";
export const ALLOW = "allow";

const REDIRECT_URL = "https://theonion.com/";
const ONION_DOMAIN = "theonion.com";
const RULE_ID = 1;

export function covers(domain, host) {
  return host === domain || host.endsWith("." + domain);
}

export function isOnion(host) {
  return covers(ONION_DOMAIN, host);
}

// Turns whatever the user typed ("BBC.com", "https://www.bbc.com/news") into a
// bare domain ("bbc.com"), or null if it isn't one.
export function normalizeDomain(input) {
  let text = String(input).trim().toLowerCase();
  if (!text) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(text)) text = "http://" + text;
  let host;
  try {
    host = new URL(text).hostname;
  } catch {
    return null;
  }
  host = host.replace(/\.$/, "").replace(/^www\./, "");
  return /^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/.test(host) ? host : null;
}

export function effectiveMode(sites, host) {
  const modes = Object.entries(sites)
    .filter(([domain]) => covers(domain, host))
    .map(([, mode]) => mode);
  if (modes.includes(ALLOW)) return ALLOW;
  if (modes.includes(REDIRECT)) return REDIRECT;
  return ALLOW;
}

// Returns a copy of `sites` changed so that `host` ends up with `mode`.
export function setSiteMode(sites, host, mode) {
  const next = { ...sites };
  if (mode === REDIRECT) {
    // Allow entries beat redirects, so drop any that cover this site.
    for (const domain of Object.keys(next)) {
      if (next[domain] === ALLOW && covers(domain, host)) delete next[domain];
    }
    if (effectiveMode(next, host) !== REDIRECT) next[host] = REDIRECT;
  } else {
    if (next[host] === REDIRECT) delete next[host];
    if (effectiveMode(next, host) !== ALLOW) next[host] = ALLOW;
  }
  return next;
}

export async function getDefaultSites() {
  const response = await fetch(chrome.runtime.getURL("news-sites.json"));
  const domains = await response.json();
  return Object.fromEntries(domains.map((domain) => [domain, REDIRECT]));
}

export async function loadSettings() {
  const { sites, enabled } = await chrome.storage.sync.get(["sites", "enabled"]);
  return { sites: sites ?? (await getDefaultSites()), enabled: enabled ?? true };
}

// Saves the given settings and applies them right away.
export async function saveSettings(changes) {
  await chrome.storage.sync.set(changes);
  await syncRules();
}

// Rebuilds the redirect rule from the saved settings.
export async function syncRules() {
  const { sites, enabled } = await loadSettings();
  const domains = (mode) =>
    Object.keys(sites).filter((domain) => sites[domain] === mode && !isOnion(domain));
  const redirected = domains(REDIRECT);

  const addRules = [];
  if (enabled && redirected.length > 0) {
    addRules.push({
      id: RULE_ID,
      priority: 1,
      action: { type: "redirect", redirect: { url: REDIRECT_URL } },
      condition: {
        requestDomains: redirected,
        excludedRequestDomains: [ONION_DOMAIN, ...domains(ALLOW)],
        resourceTypes: ["main_frame"],
      },
    });
  }
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [RULE_ID], addRules });
}

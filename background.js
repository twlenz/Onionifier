import { getDefaultSites, syncRules } from "./sites.js";

chrome.runtime.onInstalled.addListener(async () => {
  const { sites } = await chrome.storage.sync.get("sites");
  if (!sites) await chrome.storage.sync.set({ sites: await getDefaultSites() });
  await syncRules();
});

chrome.runtime.onStartup.addListener(syncRules);

// Picks up settings that arrive through Chrome sync from another computer.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.sites || changes.enabled)) syncRules();
});

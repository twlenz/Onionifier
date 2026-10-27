import {
  ALLOW,
  REDIRECT,
  getDefaultSites,
  isOnion,
  loadSettings,
  normalizeDomain,
  saveSettings,
} from "./sites.js";

const enabledEl = document.getElementById("enabled");
const form = document.getElementById("add-form");
const input = document.getElementById("add-input");
const errorEl = document.getElementById("add-error");
const filterEl = document.getElementById("filter");

const lists = {
  [REDIRECT]: {
    list: document.getElementById("redirect-list"),
    count: document.getElementById("redirect-count"),
    move: { label: "Allow", to: ALLOW },
    empty: "No sites are being sent to The Onion.",
  },
  [ALLOW]: {
    list: document.getElementById("allow-list"),
    count: document.getElementById("allow-count"),
    move: { label: "Send to Onion", to: REDIRECT },
    empty: "No sites are on the allow list.",
  },
};

let sites = {};

function makeButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function render() {
  const query = filterEl.value.trim().toLowerCase();
  for (const [mode, { list, count, move, empty }] of Object.entries(lists)) {
    const domains = Object.keys(sites)
      .filter((domain) => sites[domain] === mode)
      .sort();
    count.textContent = domains.length;

    const shown = domains.filter((domain) => domain.includes(query));
    list.replaceChildren(
      ...shown.map((domain) => {
        const item = document.createElement("li");
        const name = document.createElement("span");
        name.className = "domain";
        name.textContent = domain;
        item.append(
          name,
          makeButton(move.label, () => update({ ...sites, [domain]: move.to })),
          makeButton("Remove", () => {
            const { [domain]: _removed, ...rest } = sites;
            update(rest);
          }),
        );
        return item;
      }),
    );
    if (shown.length === 0) {
      const item = document.createElement("li");
      item.className = "empty";
      item.textContent = query ? "No matches." : empty;
      list.append(item);
    }
  }
}

async function update(nextSites) {
  sites = nextSites;
  render();
  await saveSettings({ sites });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const mode = event.submitter?.dataset.mode ?? REDIRECT;
  const domain = normalizeDomain(input.value);
  if (!domain) {
    errorEl.textContent = "That doesn't look like a website address.";
    return;
  }
  if (isOnion(domain)) {
    errorEl.textContent = "The Onion can't be sent to itself.";
    return;
  }
  errorEl.textContent = "";
  input.value = "";
  update({ ...sites, [domain]: mode });
});

input.addEventListener("input", () => {
  errorEl.textContent = "";
});

filterEl.addEventListener("input", render);

enabledEl.addEventListener("change", () => saveSettings({ enabled: enabledEl.checked }));

document.getElementById("reset").addEventListener("click", async () => {
  if (!confirm("Replace both lists with the default list of news sites?")) return;
  update(await getDefaultSites());
});

// Keeps the page current if settings change in the popup or another tab.
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "sync") return;
  ({ sites } = await loadSettings());
  if (changes.enabled) enabledEl.checked = changes.enabled.newValue;
  render();
});

const settings = await loadSettings();
sites = settings.sites;
enabledEl.checked = settings.enabled;
render();

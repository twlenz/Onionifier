#!/usr/bin/env node
// Regenerates rules.json and the manifest's host_permissions from news-sites.json.
// Run with `node scripts/build.js` after editing the site list.

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sitesPath = path.join(root, "news-sites.json");
const rulesPath = path.join(root, "rules.json");
const manifestPath = path.join(root, "manifest.json");

const REDIRECT_URL = "https://theonion.com/";

const sites = JSON.parse(fs.readFileSync(sitesPath, "utf8"));
const domains = [...new Set(sites.map((s) => s.trim().toLowerCase()))].sort();

for (const domain of domains) {
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    throw new Error(`Invalid domain in news-sites.json: "${domain}"`);
  }
  if (domain === "theonion.com" || domain.endsWith(".theonion.com")) {
    throw new Error("theonion.com cannot be in the list (it would cause a redirect loop)");
  }
}

// requestDomains also matches subdomains, so "bbc.co.uk" covers "www.bbc.co.uk".
const rules = [
  {
    id: 1,
    priority: 1,
    action: { type: "redirect", redirect: { url: REDIRECT_URL } },
    condition: { requestDomains: domains, resourceTypes: ["main_frame"] },
  },
];
fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2) + "\n");

// Redirect rules need host access to the sites they redirect away from.
// "*://*.example.com/*" matches example.com and all of its subdomains.
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.host_permissions = domains.map((d) => `*://*.${d}/*`);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`Wrote ${domains.length} news sites to rules.json and manifest.json`);

# Onionifier

A Chrome extension that redirects you to [The Onion](https://theonion.com/) whenever you visit a news website.

## Install

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.

Now visit e.g. `bbc.com` and you'll land on The Onion instead.

## How it works

The extension uses Chrome's [`declarativeNetRequest`](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest) API with a single static rule (`rules.json`) that redirects top-level page loads on any listed domain, or any of its subdomains, to `https://theonion.com/`. There is no background script and no page content is read.

## Editing the site list

The list of news sites lives in `news-sites.json`. After editing it, regenerate `rules.json` and the manifest's `host_permissions`:

```sh
node scripts/build.js
```

Then click the reload button for Onionifier on `chrome://extensions`.

Note that each entry covers the whole domain, so `nytimes.com` also catches NYT Games and NYT Cooking.

# Onionifier

A Chrome extension that redirects you to [The Onion](https://theonion.com/) whenever you visit a news website.

_Built with Claude code_

## Install

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.

Now visit e.g. `bbc.com` and you'll land on The Onion instead.

## Choosing which sites get sent to The Onion

Everything is changed from inside Chrome; no files to edit.

**From the toolbar.** Click the Onionifier icon (pin it from the puzzle-piece menu) on any site:

- **Send this site to The Onion** adds the site and reloads the tab, which takes you straight to The Onion.
- **Allow this site** makes the site load normally.
- **On** turns all redirects off or on at once.

**From the settings page.** Click **Manage all sites** in the popup, or right-click the icon and choose **Options**. The page has two lists:

- **Sent to The Onion**: these sites, and all of their subdomains, redirect.
- **Always allowed**: these load normally. Use this for exceptions, e.g. send `yahoo.com` to The Onion but allow `mail.yahoo.com`.

Type a domain or paste any link into **Add a site** and pick a list. Each site has buttons to move it to the other list or remove it, there's a search box, and **Reset to the default list** restores the original ~100 news sites.

Settings are saved with Chrome sync, so they follow you to other computers where you're signed in to Chrome with this extension installed.

## How it works

`news-sites.json` is the default list, copied into Chrome storage on first install. Whenever the lists change, the extension rebuilds a single [`declarativeNetRequest`](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest) rule that redirects top-level page loads on the "Sent to The Onion" domains to `https://theonion.com/`, with the "Always allowed" domains excluded. The browser applies the rule itself; the extension never reads page content.

Because you can add any site, the extension needs permission to redirect on all websites, so Chrome's install prompt says it can "read and change all your data on all websites".

| File | Purpose |
| --- | --- |
| `manifest.json` | Extension manifest |
| `news-sites.json` | Default list of news sites |
| `sites.js` | Shared logic: settings storage, domain parsing, building the redirect rule |
| `background.js` | Installs the default list and keeps the rule up to date |
| `popup.html`, `popup.js` | Toolbar popup |
| `options.html`, `options.js` | Settings page |
| `styles.css` | Shared styles (light and dark mode) |

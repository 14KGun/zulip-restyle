importScripts("shared.js");

// Keeps one dynamic content script registered for every saved domain that
// we hold host permission for, and injects into tabs that are already open
// when a domain is added.

async function grantedPatterns() {
  const { sites = {} } = await chrome.storage.sync.get("sites");
  const patterns = [];
  for (const host of Object.keys(sites)) {
    const pattern = zrHostToPattern(host);
    if (await chrome.permissions.contains({ origins: [pattern] })) {
      patterns.push(pattern);
    }
  }
  return patterns;
}

async function syncRegistration() {
  const patterns = await grantedPatterns();
  const existing = await chrome.scripting.getRegisteredContentScripts({
    ids: [ZR_SCRIPT_ID],
  });
  if (existing.length) {
    await chrome.scripting.unregisterContentScripts({ ids: [ZR_SCRIPT_ID] });
  }
  if (patterns.length) {
    await chrome.scripting.registerContentScripts([
      {
        id: ZR_SCRIPT_ID,
        matches: patterns,
        js: ZR_JS_FILES,
        css: ZR_CSS_FILES,
        runAt: "document_start",
        persistAcrossSessions: true,
      },
    ]);
  }
  return patterns;
}

async function injectIntoOpenTabs(patterns) {
  if (!patterns.length) return;
  const tabs = await chrome.tabs.query({ url: patterns });
  for (const tab of tabs) {
    try {
      const [{ result: loaded }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => Boolean(window.__zulipRestyleLoaded),
      });
      if (loaded) continue;
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ZR_CSS_FILES,
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ZR_JS_FILES,
      });
    } catch (e) {
      // Tab closed, discarded or not scriptable; it picks the script up on reload.
      console.debug("inject skipped", tab.url, e);
    }
  }
}

async function refresh() {
  try {
    const patterns = await syncRegistration();
    await injectIntoOpenTabs(patterns);
  } catch (e) {
    console.error("Restyle for Zulip: refresh failed", e);
  }
}

chrome.runtime.onInstalled.addListener(refresh);
chrome.runtime.onStartup.addListener(refresh);
chrome.permissions.onAdded.addListener(refresh);
chrome.permissions.onRemoved.addListener(refresh);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.sites) return;
  const before = Object.keys(changes.sites.oldValue || {});
  const after = Object.keys(changes.sites.newValue || {});
  // Only the domain list affects registration; theme changes are picked up
  // live by content.js through its own storage listener.
  if (before.length !== after.length || before.some((h) => !after.includes(h))) {
    refresh();
  }
});

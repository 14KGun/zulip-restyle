// Runs at document_start on registered domains. It only sets data-zr-*
// attributes on <html>; every rule in styles/restyle.css is scoped to them,
// so removing the attributes turns the theme off without a reload.
(() => {
  if (window.__zulipRestyleLoaded) return;
  window.__zulipRestyleLoaded = true;

  const CACHE_KEY = "zulip-restyle:site";
  const ATTRS = ["theme", "font", "density", "width"];
  const root = document.documentElement;
  const hostname = location.hostname;

  function apply(site) {
    if (!site || site.enabled === false) {
      for (const a of ATTRS) root.removeAttribute(`data-zr-${a}`);
      return;
    }
    root.setAttribute("data-zr-theme", site.theme || "neutral");
    root.setAttribute("data-zr-font", site.font === false ? "off" : "on");
    root.setAttribute("data-zr-density", site.density || "normal");
    root.setAttribute("data-zr-width", site.width || "auto");
  }

  function cache(site) {
    try {
      if (site) localStorage.setItem(CACHE_KEY, JSON.stringify(site));
      else localStorage.removeItem(CACHE_KEY);
    } catch {
      // Storage blocked; we just lose the no-flash first paint.
    }
  }

  // Apply the last known settings synchronously to avoid a flash of the
  // stock theme, then confirm against extension storage.
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) apply(JSON.parse(cached));
  } catch {
    // Ignore a corrupt or unavailable cache.
  }

  function load(sites) {
    const site = zrFindSite(sites, hostname); // from shared.js
    apply(site);
    cache(site);
  }

  chrome.storage.sync.get("sites").then(({ sites }) => load(sites));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.sites) load(changes.sites.newValue);
  });
})();

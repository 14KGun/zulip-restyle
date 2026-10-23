// Shared between the service worker (importScripts) and the popup (<script>).
// Kept as plain globals so it works in both without a bundler.

const ZR_SCRIPT_ID = "zulip-restyle";
const ZR_CSS_FILES = ["styles/restyle.css"];
const ZR_JS_FILES = ["shared.js", "content.js"];

const ZR_THEMES = [
  {
    id: "neutral",
    name: "차분한 뉴트럴",
    desc: "회색조 바탕에 남색 포인트. 가장 무난함",
    swatch: ["#F7F7F5", "#FFFFFF", "#4F5BD5", "#1F2328"],
  },
  {
    id: "dark-pro",
    name: "다크 프로",
    desc: "항상 어두운 화면, 청록 포인트, 고정폭 시간",
    swatch: ["#0F1216", "#1F242C", "#3DD6C4", "#E6E8EB"],
  },
  {
    id: "bubble",
    name: "메신저 말풍선",
    desc: "메시지를 말풍선으로, 둥근 아바타",
    swatch: ["#F6F7F9", "#EEF0F3", "#2563EB", "#191B1F"],
  },
  {
    id: "reader",
    name: "읽기 집중",
    desc: "아바타 없이 넓은 여백, 녹색 포인트",
    swatch: ["#F4F6F5", "#FFFFFF", "#1D6B57", "#16181B"],
  },
];

const ZR_DEFAULT_SITE = {
  enabled: true,
  theme: "neutral",
  font: true,
  density: "normal", // compact | normal | relaxed
  width: "auto", // auto | narrow
};

// Accepts "zulip.example.com", "https://zulip.example.com/#narrow/...",
// "*.example.com" or "10.0.0.5:9991" and returns a bare host pattern.
function zrNormalizeHost(input) {
  let s = String(input || "").trim().toLowerCase();
  if (!s) return null;
  let wildcard = false;
  if (s.startsWith("*.")) {
    wildcard = true;
    s = s.slice(2);
  }
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(s)) s = "http://" + s;
  let host;
  try {
    host = new URL(s).hostname;
  } catch {
    return null;
  }
  if (!host || /[^a-z0-9.\-[\]:]/.test(host)) return null;
  return wildcard ? "*." + host : host;
}

// Match patterns ignore the port, so these cover every port on the host.
// The schemes are listed separately because chrome.permissions.request only
// accepts origins contained in a single optional_host_permissions entry, and
// `*://` is contained in neither "http://*/*" nor "https://*/*" on its own.
function zrHostToPatterns(host) {
  return [`http://${host}/*`, `https://${host}/*`];
}

function zrHostMatches(pattern, hostname) {
  if (pattern.startsWith("*.")) {
    const base = pattern.slice(2);
    return hostname === base || hostname.endsWith("." + base);
  }
  return hostname === pattern;
}

// An exact host wins over a wildcard; among wildcards the longest wins.
function zrFindSite(sites, hostname) {
  if (!sites) return null;
  if (sites[hostname]) return { host: hostname, ...sites[hostname] };
  let best = null;
  for (const host of Object.keys(sites)) {
    if (host.startsWith("*.") && zrHostMatches(host, hostname)) {
      if (!best || host.length > best.length) best = host;
    }
  }
  return best ? { host: best, ...sites[best] } : null;
}

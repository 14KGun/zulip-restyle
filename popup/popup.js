// Popup: manage the domain list and each domain's theme options.
// Settings live in chrome.storage.sync under `sites`, keyed by host pattern.

const $ = (sel) => document.querySelector(sel);

const state = {
  sites: {},
  granted: new Set(),
  selected: null,
  currentHost: null,
};

async function load() {
  const { sites = {} } = await chrome.storage.sync.get("sites");
  state.sites = sites;
  state.granted = new Set();
  for (const host of Object.keys(sites)) {
    if (await chrome.permissions.contains({ origins: zrHostToPatterns(host) })) {
      state.granted.add(host);
    }
  }
  if (!state.selected || !sites[state.selected]) {
    const current = state.currentHost && zrFindSite(sites, state.currentHost);
    state.selected = current ? current.host : Object.keys(sites)[0] || null;
  }
}

function save() {
  return chrome.storage.sync.set({ sites: state.sites });
}

// chrome.permissions.request must run inside the click's user gesture, so it
// is started before anything is awaited. The site is saved first in case the
// popup closes while Chrome's permission prompt is open; the service worker
// registers the script once permissions.onAdded fires.
function addSite(host) {
  const request = chrome.permissions.request({ origins: zrHostToPatterns(host) });
  if (!state.sites[host]) {
    state.sites[host] = { ...ZR_DEFAULT_SITE };
  }
  state.selected = host;
  save();
  return request
    .then((ok) => {
      if (ok) state.granted.add(host);
    })
    .catch((e) => showError(e.message))
    .finally(render);
}

function grant(host) {
  chrome.permissions
    .request({ origins: zrHostToPatterns(host) })
    .then((ok) => {
      if (ok) state.granted.add(host);
    })
    .catch((e) => showError(e.message))
    .finally(render);
}

async function removeSite(host) {
  delete state.sites[host];
  if (state.selected === host) state.selected = Object.keys(state.sites)[0] || null;
  await save();
  // Drop the host permission too; each saved host has its own patterns.
  await chrome.permissions.remove({ origins: zrHostToPatterns(host) }).catch(() => {});
  state.granted.delete(host);
  render();
}

function updateSelected(patch) {
  const host = state.selected;
  if (!host) return;
  state.sites[host] = { ...ZR_DEFAULT_SITE, ...state.sites[host], ...patch };
  save();
  render();
}

function showError(msg) {
  const el = $("#form-error");
  el.textContent = msg || "";
  el.hidden = !msg;
}

function themeName(id) {
  return (ZR_THEMES.find((t) => t.id === id) || ZR_THEMES[0]).name;
}

function renderCurrent() {
  const box = $("#current");
  const host = state.currentHost;
  const covered = host && zrFindSite(state.sites, host);
  box.hidden = !host || Boolean(covered);
  if (!box.hidden) $("#current-host").textContent = host;
}

function renderSites() {
  const list = $("#sites");
  list.replaceChildren();
  const hosts = Object.keys(state.sites).sort();
  $("#empty").hidden = hosts.length > 0;

  for (const host of hosts) {
    const site = { ...ZR_DEFAULT_SITE, ...state.sites[host] };
    const li = document.createElement("li");
    li.className = "site";
    li.classList.toggle("selected", host === state.selected);
    li.classList.toggle("off", !site.enabled);
    li.addEventListener("click", () => {
      state.selected = host;
      render();
    });

    const main = document.createElement("div");
    main.className = "site-main";
    const name = document.createElement("span");
    name.className = "site-host";
    name.textContent = host;
    const meta = document.createElement("span");
    meta.className = "site-meta";
    main.append(name, meta);

    li.append(main);

    if (!state.granted.has(host)) {
      meta.textContent = "접근 권한이 필요해요";
      meta.classList.add("warn");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn small primary";
      btn.textContent = "권한 허용";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        grant(host);
      });
      li.append(btn);
    } else {
      meta.textContent = site.enabled ? themeName(site.theme) : "꺼짐";
      const sw = document.createElement("label");
      sw.className = "switch";
      sw.title = site.enabled ? "끄기" : "켜기";
      sw.addEventListener("click", (e) => e.stopPropagation());
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = site.enabled;
      input.setAttribute("aria-label", `${host} 적용`);
      input.addEventListener("change", () => {
        state.sites[host] = { ...site, enabled: input.checked };
        save();
        render();
      });
      sw.append(input, document.createElement("span"));
      li.append(sw);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "icon-btn";
    del.textContent = "×";
    del.title = "삭제";
    del.setAttribute("aria-label", `${host} 삭제`);
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      removeSite(host);
    });
    li.append(del);

    list.append(li);
  }
}

function buildThemeCards() {
  const wrap = $("#themes");
  for (const theme of ZR_THEMES) {
    const [bg, surface, accent, text] = theme.swatch;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme";
    btn.dataset.theme = theme.id;
    btn.setAttribute("role", "radio");

    const preview = document.createElement("div");
    preview.className = "theme-preview";
    preview.innerHTML = `
      <div class="side" style="background:${bg}">
        <i style="background:${accent};width:80%"></i>
        <i style="background:${text};opacity:.25;width:60%"></i>
        <i style="background:${text};opacity:.25;width:70%"></i>
      </div>
      <div class="main" style="background:${theme.id === "bubble" ? "#fff" : surface}">
        <i style="background:${text};opacity:.7;width:35%"></i>
        <i style="background:${theme.id === "bubble" ? surface : text};opacity:${theme.id === "bubble" ? 1 : 0.3};width:80%;height:${theme.id === "bubble" ? 8 : 4}px;border-radius:4px"></i>
        <i style="background:${text};opacity:.3;width:60%"></i>
      </div>`;

    const name = document.createElement("span");
    name.className = "theme-name";
    name.textContent = theme.name;
    const desc = document.createElement("span");
    desc.className = "theme-desc";
    desc.textContent = theme.desc;

    btn.append(preview, name, desc);
    btn.addEventListener("click", () => {
      const patch = { theme: theme.id };
      // The reader layout is meant to be read in a centered column.
      if (theme.id === "reader") patch.width = "narrow";
      updateSelected(patch);
    });
    wrap.append(btn);
  }
}

function renderSettings() {
  const panel = $("#settings");
  const host = state.selected;
  panel.hidden = !host;
  if (!host) return;
  const site = { ...ZR_DEFAULT_SITE, ...state.sites[host] };
  $("#settings-host").textContent = host;
  for (const btn of document.querySelectorAll(".theme")) {
    btn.setAttribute("aria-checked", String(btn.dataset.theme === site.theme));
  }
  $("#opt-font").checked = site.font;
  // Rank colors only exist in the discord theme.
  $("#row-rank").hidden = site.theme !== "discord";
  $("#opt-rank").checked = site.rankColors;
  for (const seg of document.querySelectorAll(".seg")) {
    const value = site[seg.dataset.opt];
    for (const b of seg.querySelectorAll("button")) {
      b.setAttribute("aria-pressed", String(b.dataset.value === value));
    }
  }
}

function render() {
  renderCurrent();
  renderSites();
  renderSettings();
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url && /^https?:/.test(tab.url)) {
    state.currentHost = new URL(tab.url).hostname;
  }

  buildThemeCards();

  $("#add-current").addEventListener("click", () => {
    if (state.currentHost) addSite(state.currentHost);
  });

  $("#add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#domain-input");
    const host = zrNormalizeHost(input.value);
    if (!host) {
      showError("도메인 형식을 확인해주세요. 예: zulip.example.com");
      return;
    }
    showError("");
    input.value = "";
    addSite(host);
  });

  $("#opt-font").addEventListener("change", (e) => updateSelected({ font: e.target.checked }));
  $("#opt-rank").addEventListener("change", (e) => updateSelected({ rankColors: e.target.checked }));
  for (const seg of document.querySelectorAll(".seg")) {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) updateSelected({ [seg.dataset.opt]: b.dataset.value });
    });
  }

  await load();
  render();
}

init();

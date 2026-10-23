// DOM additions for the themes that go beyond recoloring (discord, notion).
// content.js calls zrEnhance(site) whenever settings change. Everything this
// file adds carries a zr- class or data-zr-* attribute, and turning the theme
// off removes it again.
//
// Zulip re-renders its sidebars often, so instead of hooking into its code we
// watch the DOM and re-apply our additions after each batch of changes. Every
// step is idempotent and cheap to repeat.

// Korean military ranks, longest first so "상병" wins over "병".
const ZR_RANKS = [
  ["이병", "ibyeong"],
  ["일병", "ilbyeong"],
  ["상병", "sangbyeong"],
  ["병장", "byeongjang"],
  ["하사", "nco"],
  ["중사", "nco"],
  ["상사", "nco"],
  ["원사", "nco"],
  ["준위", "nco"],
  ["소위", "officer"],
  ["중위", "officer"],
  ["대위", "officer"],
  ["소령", "officer"],
  ["중령", "officer"],
  ["대령", "officer"],
  ["준장", "general"],
  ["소장", "general"],
  ["중장", "general"],
  ["대장", "general"],
];

function zrRankOf(name) {
  const first = String(name || "").trim().split(/\s+/)[0];
  for (const [label, id] of ZR_RANKS) {
    if (first === label) return id;
  }
  return "";
}

// "GENEARL" -> "GE", "Product team" -> "PT", "개발팀" -> "개발".
function zrInitials(title) {
  const words = String(title || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (/^[\p{Script=Hangul}]/u.test(words[0])) return words[0].slice(0, 2);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Stable small integer per string, used to pick a folder tint.
function zrHash(text, mod) {
  let h = 0;
  for (const ch of String(text)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h % mod;
}

const zrEnhancer = {
  theme: null,
  observer: null,
  scheduled: false,

  update(site) {
    const theme = site && ["discord", "notion"].includes(site.theme) ? site.theme : null;
    if (theme === this.theme) {
      this.schedule();
      return;
    }
    this.teardown();
    this.theme = theme;
    if (!theme) return;
    const start = () => {
      if (this.theme !== theme || this.observer) return;
      this.observer = new MutationObserver(() => this.schedule());
      this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      window.addEventListener("hashchange", this.onHashChange);
      this.run();
    };
    if (document.body) start();
    else document.addEventListener("DOMContentLoaded", start, { once: true });
  },

  onHashChange: () => zrEnhancer.schedule(),

  schedule() {
    if (this.scheduled || !this.theme) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      if (!this.theme) return;
      // Our own writes would otherwise wake the observer again.
      this.observer?.disconnect();
      try {
        this.run();
      } finally {
        this.observer?.observe(document.body, { childList: true, subtree: true, characterData: true });
      }
    });
  },

  run() {
    if (this.theme === "discord") this.tagRanks();
    this.addDmAvatars();
    this.tagFolders();
    if (this.theme === "discord") this.renderRail();
    else this.removeRail();
    if (this.theme === "notion") this.renderPageTitle();
    else this.removePageTitle();
  },

  teardown() {
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener("hashchange", this.onHashChange);
    this.removeRail();
    this.removePageTitle();
    for (const el of document.querySelectorAll(".zr-dm-avatar")) el.remove();
    for (const el of document.querySelectorAll("[data-zr-rank]")) el.removeAttribute("data-zr-rank");
    for (const el of document.querySelectorAll("[data-zr-title]")) {
      for (const a of ["title", "initial", "tint", "label"]) el.removeAttribute(`data-zr-${a}`);
    }
    document.documentElement.removeAttribute("data-zr-rail");
  },

  // Names in the buddy list, message headers and 1:1 DM rows get
  // data-zr-rank so the CSS can color them. The attribute is set even when
  // no rank matches, so each name is only parsed once.
  tagRanks() {
    const names = document.querySelectorAll(
      ".user-name:not([data-zr-rank]), .dm-box[data-is-group='false'] .conversation-partners-list:not([data-zr-rank])",
    );
    for (const el of names) el.setAttribute("data-zr-rank", zrRankOf(el.textContent));
  },

  // Zulip's DM list shows only a presence dot. Put the partner's avatar
  // behind it; /avatar/<id> redirects to the current picture.
  addDmAvatars() {
    const boxes = document.querySelectorAll(".dm-box[data-is-group='false']");
    for (const box of boxes) {
      if (box.querySelector(":scope > .zr-dm-avatar")) continue;
      const id = box.dataset.userIdsString;
      if (!/^\d+$/.test(id || "")) continue;
      const img = document.createElement("img");
      img.className = "zr-dm-avatar";
      img.alt = "";
      img.loading = "lazy";
      img.src = `/avatar/${id}`;
      box.prepend(img);
    }
  },

  // Channel folder headings get an initial, a tint and a sentence-case
  // label for the notion badges. Zulip upper-cases folder names
  // ("GENEARL"); the label turns that back into "Genearl".
  tagFolders() {
    for (const h of document.querySelectorAll(".stream-list-subsection-header .left-sidebar-title")) {
      const title = h.textContent.trim();
      if (!title || h.getAttribute("data-zr-title") === title) continue;
      h.setAttribute("data-zr-title", title);
      h.setAttribute("data-zr-initial", zrInitials(title).slice(0, 1));
      h.setAttribute("data-zr-tint", String(zrHash(title, 6)));
      h.setAttribute("data-zr-label", title.charAt(0) + title.slice(1).toLowerCase());
    }
  },

  // ---------- Discord rail ----------

  railSections() {
    const sections = [];
    for (const box of document.querySelectorAll("#streams_list .stream-list-section-container")) {
      if (box.classList.contains("no-display")) continue;
      const header = box.querySelector(".stream-list-subsection-header");
      const title = header?.querySelector(".left-sidebar-title")?.textContent.trim();
      if (!title) continue;
      sections.push({
        id: box.dataset.sectionId || title,
        title,
        box,
        unread: Boolean(header.querySelector(".unread_count")?.textContent.trim()),
        mention: Boolean(header.querySelector(".unread_mention_info")?.textContent.trim()),
        active: Boolean(box.querySelector(".narrow-filter.active-filter")),
      });
    }
    return sections;
  },

  renderRail() {
    // Inside the column, so the rail moves and hides with the sidebar.
    const column = document.getElementById("left-sidebar-container");
    if (!column || !document.getElementById("left-sidebar")) return;
    const sections = this.railSections();
    const dmHeader = document.getElementById("direct-messages-section-header");
    const dmUnread = Boolean(dmHeader?.querySelector(".unread_count")?.textContent.trim());
    const hash = location.hash;
    const dmActive =
      /^#narrow\/(dm|is\/dm|pm-with)/.test(hash) || Boolean(document.querySelector(".dm-list-item.active-sub-filter"));

    const key = JSON.stringify([dmUnread, dmActive, sections.map((s) => [s.id, s.title, s.unread, s.mention, s.active])]);
    let rail = document.getElementById("zr-rail");
    if (rail && rail.parentElement === column && rail.dataset.key === key) return;
    if (!rail) {
      rail = document.createElement("nav");
      rail.id = "zr-rail";
      rail.setAttribute("aria-label", "채널 폴더");
    }
    if (rail.parentElement !== column) column.prepend(rail);
    rail.dataset.key = key;
    document.documentElement.setAttribute("data-zr-rail", "on");

    const items = [];
    const home = this.railItem({
      label: "개인 메시지",
      href: "#narrow/is/dm",
      unread: dmUnread,
      active: dmActive,
      icon: true,
    });
    home.classList.add("zr-rail-home");
    items.push(home);

    const sep = document.createElement("span");
    sep.className = "zr-rail-sep";
    items.push(sep);

    for (const s of sections) {
      const btn = this.railItem({
        label: s.title,
        text: zrInitials(s.title),
        unread: s.unread,
        mention: s.mention,
        active: s.active,
      });
      btn.addEventListener("click", () => this.jumpToSection(s.id));
      items.push(btn);
    }

    const browse = this.railItem({ label: "채널 둘러보기", href: "#channels/all", plus: true });
    browse.classList.add("zr-rail-browse");
    items.push(browse);

    rail.replaceChildren(...items);
  },

  railItem({ label, text, href, unread, mention, active, icon, plus }) {
    const el = document.createElement(href ? "a" : "button");
    if (href) el.href = href;
    else el.type = "button";
    el.className = "zr-rail-item";
    el.title = label;
    el.setAttribute("aria-label", label);
    if (active) el.setAttribute("aria-current", "true");
    if (unread) el.classList.add("zr-unread");
    if (icon || plus) {
      const glyph = document.createElement("span");
      glyph.className = plus ? "zr-rail-glyph zr-rail-plus" : "zr-rail-glyph zr-rail-dm";
      el.append(glyph);
    } else {
      el.textContent = text;
    }
    if (mention) {
      const badge = document.createElement("span");
      badge.className = "zr-rail-badge";
      badge.textContent = "@";
      el.append(badge);
    }
    return el;
  },

  jumpToSection(id) {
    const box = document.querySelector(`#streams_list .stream-list-section-container[data-section-id="${CSS.escape(id)}"]`);
    if (!box) return;
    if (box.classList.contains("collapsed")) box.querySelector(".stream-list-section-toggle")?.click();
    box.scrollIntoView({ block: "start", behavior: "smooth" });
  },

  removeRail() {
    document.getElementById("zr-rail")?.remove();
    document.documentElement.removeAttribute("data-zr-rail");
  },

  // ---------- Notion page title ----------

  // A large title above the message feed, taken from the navbar. It sits
  // before the message list, so like a Notion page it is seen when scrolled
  // to the start of the conversation.
  renderPageTitle() {
    const feed = document.getElementById("main_div");
    const header = document.getElementById("message_view_header");
    if (!feed || !header) return;
    const title = header.querySelector(".message-header-navbar-title")?.textContent.trim() || "";
    const desc = header.querySelector(".narrow_description")?.textContent.trim() || "";
    const iconClass = [...(header.querySelector(".navbar-icon")?.classList || [])].find(
      (c) => c.startsWith("zulip-icon-") && c !== "zulip-icon",
    );

    let block = document.getElementById("zr-page-title");
    if (!block) {
      block = document.createElement("div");
      block.id = "zr-page-title";
      block.innerHTML =
        '<div class="zr-page-icon"><i class="zulip-icon" aria-hidden="true"></i></div><h1></h1><p></p>';
    }
    const anchor = document.getElementById("message-lists-container");
    if (anchor && block.nextElementSibling !== anchor) feed.insertBefore(block, anchor);

    block.hidden = !title;
    const h1 = block.querySelector("h1");
    if (h1.textContent !== title) h1.textContent = title;
    const p = block.querySelector("p");
    if (p.textContent !== desc) p.textContent = desc;
    p.hidden = !desc;
    const i = block.querySelector(".zr-page-icon i");
    const wanted = `zulip-icon ${iconClass || "zulip-icon-hashtag"}`;
    if (i.className !== wanted) i.className = wanted;
  },

  removePageTitle() {
    document.getElementById("zr-page-title")?.remove();
  },
};

function zrEnhance(site) {
  zrEnhancer.update(site);
}

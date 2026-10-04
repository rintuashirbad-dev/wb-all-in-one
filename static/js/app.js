(() => {
  "use strict";
  const S = {
    data: null,
    lang: localStorage.getItem("lang") || "bn",
    theme: localStorage.getItem("theme") || "dark",
    token: localStorage.getItem("userToken") || "",
    user: null,
    heroIdx: 0,
    heroTimer: null,
    heroDur: 5000,
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const t = (k) => (I18N[S.lang] && I18N[S.lang][k]) || I18N.en[k] || k;
  const other = () => (S.lang === "bn" ? "en" : "bn");
  const L = (o, f) => (o ? o[`${f}_${S.lang}`] || o[`${f}_${other()}`] || "" : "");
  const safeUrl = (u) => (/^(https?:\/\/|\/|#|tel:|mailto:)/i.test(String(u || "").trim()) ? String(u).trim() : "");
  const ICON_YT = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1-5.8 3.1z"/></svg>';

  async function api(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    const token = opts.token !== undefined ? opts.token : S.token;
    if (token) headers.Authorization = `Bearer ${token}`;
    let body = opts.body;
    if (body && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }
    const res = await fetch(path, { method: opts.method || "GET", headers, body });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      let msg = (data && data.detail) || `HTTP ${res.status}`;
      if (Array.isArray(msg)) msg = msg.map((d) => `${(d.loc || []).slice(-1)[0]}: ${d.msg}`).join(", ");
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function toast(msg, type = "") {
    const el = document.createElement("div");
    el.className = `toast glass ${type}`;
    el.textContent = msg;
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------- modal ----------
  function openModal(html, wide = false) {
    $("#modalBody").innerHTML = html;
    $("#modal .modal-card").classList.toggle("wide", wide);
    $("#modal").classList.add("open");
    $("#modal").setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    $("#modal").classList.remove("open");
    $("#modal").setAttribute("aria-hidden", "true");
    setTimeout(() => { if (!$("#modal").classList.contains("open")) $("#modalBody").innerHTML = ""; }, 300);
  }

  // ---------- YouTube ----------
  function ytId(url) {
    const m = String(url || "").match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  }
  function playYT(url, title) {
    const u = safeUrl(url);
    if (!u) return;
    const id = ytId(u);
    if (!id) { window.open(u, "_blank", "noopener"); return; }
    openModal(`<h2>▶ ${esc(title || t("yt_help_long"))}</h2>
      <div class="yt-frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="YouTube"></iframe></div>
      <a class="btn btn-ghost btn-sm" href="${esc(u)}" target="_blank" rel="noopener">${t("open_youtube")} ↗</a>`, true);
  }
  const ytBtn = (url, title, sm = false, label = true) => (safeUrl(url)
    ? `<button class="btn btn-yt ${sm ? "btn-sm" : ""}" data-yt="${esc(url)}" data-yt-title="${esc(title)}" title="${esc(t("yt_help_long"))}">${ICON_YT}${label ? `<span>${t("yt_help")}</span>` : ""}</button>` : "");

  function openLink(url) {
    const u = safeUrl(url);
    if (!u) return;
    if (u.startsWith("#")) location.hash = u;
    else window.open(u, "_blank", "noopener");
  }
  const linkAttrs = (u) => { const s = safeUrl(u); return s.startsWith("#") || !s ? `href="${esc(s || "#")}"` : `href="${esc(s)}" target="_blank" rel="noopener"`; };

  // ---------- effects ----------
  function bindTilt(root = document) {
    $$(".tilt", root).forEach((el) => {
      if (el.dataset.tilt) return;
      el.dataset.tilt = "1";
      if (!el.querySelector(":scope > .gloss")) el.insertAdjacentHTML("beforeend", '<i class="gloss"></i>');
      const max = Number(el.dataset.max || 9);
      el.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateY(-4px)`;
        el.style.setProperty("--gx", `${x * 100}%`);
        el.style.setProperty("--gy", `${y * 100}%`);
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }
  let revealObs = null;
  function bindReveal(root = document) {
    if (!("IntersectionObserver" in window)) { $$(".reveal", root).forEach((e) => e.classList.add("in")); return; }
    revealObs = revealObs || new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); }
    }), { threshold: 0.08 });
    $$(".reveal:not(.in)", root).forEach((e) => revealObs.observe(e));
  }
  function countUp(root = document) {
    $$("[data-count]", root).forEach((el) => {
      const end = Number(el.dataset.count) || 0;
      const fmt = new Intl.NumberFormat(S.lang === "bn" ? "bn-IN" : "en-IN");
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 1200);
        el.textContent = fmt.format(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ---------- data helpers ----------
  const sections = () => S.data.sections;
  const sectionByKey = (k) => sections().find((s) => s.key === k);
  const itemsOf = (k) => S.data.items.filter((i) => i.section_key === k);
  const mainSlides = () => S.data.slides.filter((s) => s.position !== "side");
  const sideSlides = () => S.data.slides.filter((s) => s.position === "side");

  function cardHTML(it, showSection = false, idx = 0) {
    const sec = sectionByKey(it.section_key) || {};
    const isVideo = sec.kind === "videos";
    const title = L(it, "title"), desc = L(it, "desc");
    const vid = ytId(it.link_url);
    const img = safeUrl(it.image) || (isVideo && vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : "");
    const media = img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<div class="glyph">${esc(it.icon || sec.icon || "✨")}</div>`;
    const badge = it.badge ? `<span class="badge ${esc(it.badge)}">${t("badge_" + it.badge)}</span>` : "";
    const label = L(it, "link_label") || (isVideo ? t("watch") : t("open"));
    const main = isVideo
      ? `<button class="btn btn-primary" data-yt="${esc(it.link_url)}" data-yt-title="${esc(title)}">▶ ${esc(label)}</button>`
      : (safeUrl(it.link_url) ? `<a class="btn btn-primary" ${linkAttrs(it.link_url)}>${esc(label)} ↗</a>` : "");
    return `<article class="card glass tilt reveal c${idx % 6}" data-search="${esc(`${it.title_bn} ${it.title_en} ${it.desc_bn} ${it.desc_en}`.toLowerCase())}">
      <div class="card-media">${badge}${media}${isVideo ? `<button class="play" data-yt="${esc(it.link_url)}" data-yt-title="${esc(title)}" aria-label="Play">▶</button>` : ""}</div>
      <div class="card-body">
        ${showSection ? `<span class="card-sec">${esc(sec.icon || "")} ${esc(L(sec, "title"))}</span>` : ""}
        <h3>${esc(title)}</h3>
        <p>${esc(desc)}</p>
        <div class="card-actions">${main}${ytBtn(it.youtube_url, title)}</div>
      </div></article>`;
  }
  const cardsHTML = (list, showSection) => (list.length ? list.map((it, i) => cardHTML(it, showSection, i)).join("") : `<div class="empty glass">${t("no_results")}</div>`);

  // ---------- header / chrome ----------
  function renderChrome() {
    const site = S.data.site || {};
    document.documentElement.lang = S.lang;
    document.documentElement.dataset.theme = S.theme;
    document.title = L(site, "name") || "Portal";
    $("#brandName").textContent = L(site, "name");
    $("#brandTagline").textContent = L(site, "tagline");
    const logo = safeUrl(site.logo) || "/static/img/seed/logo.svg";
    $("#brandLogo").src = logo;
    $("#favicon").href = logo;
    $("#langLabel").textContent = S.lang === "bn" ? "EN" : "বাং";
    $("#themeBtn").textContent = S.theme === "dark" ? "☀" : "☾";
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    const notice = L(site, "notice");
    $("#ticker").classList.toggle("no-notice", !notice);
    $("#tickerText").textContent = notice;
    const wa = String((S.data.contact || {}).whatsapp || "").replace(/\D/g, "");
    $("#waFloat").style.display = wa ? "" : "none";
    if (wa) $("#waFloat").href = `https://wa.me/${wa}`;
    const route = location.hash || "#/";
    const links = [["#/", t("home")], ...sections().map((s) => [`#/section/${s.key}`, L(s, "title")]),
      ["#/helplines", t("helplines")], ["#/donate", t("donate")], ["#/contact", t("contact")]];
    $("#nav").innerHTML = links.map(([h, l]) => `<a href="${esc(h)}" class="${route === h ? "active" : ""}">${esc(l)}</a>`).join("");
    renderAuthArea();
    renderFooter();
  }

  function avatar(u, cls = "") {
    return safeUrl(u && u.photo) ? `<img class="${cls}" src="${esc(u.photo)}" alt="">` : `<span class="avatar-fallback ${cls}">${esc(((u && u.name) || "U").trim().charAt(0).toUpperCase())}</span>`;
  }
  function renderAuthArea() {
    const a = $("#authArea");
    if (S.user) {
      a.innerHTML = `<div class="user-chip" id="userChip" title="${esc(t("profile"))}">${avatar(S.user)}<span><b>${esc(S.user.name.split(" ")[0])}</b><small>${esc(S.user.code)}</small></span></div>
        <button class="icon-btn" id="adminBtn" title="${esc(t("admin"))}">⚙</button>`;
    } else {
      a.innerHTML = `<button class="btn btn-ghost btn-sm" data-auth="login">${t("login")}</button>
        <button class="btn btn-primary btn-sm reg" data-auth="signup">${t("register")}</button>
        <button class="icon-btn" id="adminBtn" title="${esc(t("admin"))}">⚙</button>`;
    }
  }

  function renderFooter() {
    const site = S.data.site || {}, c = S.data.contact || {};
    const fmt = new Intl.NumberFormat(S.lang === "bn" ? "bn-IN" : "en-IN");
    $("#footer").innerHTML = `
      <div><a class="brand" href="#/"><img class="brand-logo" src="${esc(safeUrl(site.logo) || "/static/img/seed/logo.svg")}" alt=""><span class="brand-text"><b>${esc(L(site, "name"))}</b><small>${esc(L(site, "tagline"))}</small></span></a>
        <p>${esc(L(site, "footer"))}</p></div>
      <div><h4>${t("quick_links")}</h4><ul>${sections().map((s) => `<li><a href="#/section/${esc(s.key)}">${esc(s.icon)} ${esc(L(s, "title"))}</a></li>`).join("")}
        <li><a href="#/helplines">☎ ${t("helplines")}</a></li><li><a href="#/donate">💝 ${t("donate")}</a></li></ul></div>
      <div><h4>${t("contact")}</h4><ul>
        ${c.phone ? `<li><a href="tel:${esc(c.phone.replace(/[^0-9+]/g, ""))}">📞 ${esc(c.phone)}</a></li>` : ""}
        ${c.email ? `<li><a href="mailto:${esc(c.email)}">✉ ${esc(c.email)}</a></li>` : ""}
        ${L(c, "address") ? `<li><p>📍 ${esc(L(c, "address"))}</p></li>` : ""}
        ${L(c, "hours") ? `<li><p>🕘 ${esc(L(c, "hours"))}</p></li>` : ""}</ul></div>
      <div class="copy"><span>© ${new Date().getFullYear()} ${esc(L(site, "name"))} · ${t("rights")}</span>
        <span>👁 ${t("visitors")}: ${fmt.format(S.data.stats.visits)} · <button class="admin-link" id="footAdmin">⚙ ${t("admin_login")}</button></span></div>`;
  }

  function tickClock() {
    const now = new Date();
    const loc = S.lang === "bn" ? "bn-IN" : "en-IN";
    $("#liveDate").textContent = now.toLocaleDateString(loc, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    $("#liveTime").textContent = now.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  }

  // ---------- hero ----------
  function heroHTML() {
    const slides = mainSlides();
    const site = S.data.site || {};
    const main = slides.length ? slides.map((s, i) => `
      <div class="hero-slide ${s.fit === "contain" ? "fit-contain" : ""}" data-i="${i}">
        <img class="hero-img" src="${esc(safeUrl(s.image))}" alt="${esc(L(s, "title"))}" ${i ? 'loading="lazy"' : ""}>
        <div class="hero-shade"></div>
        <div class="hero-caption">
          ${L(s, "title") ? `<h1>${esc(L(s, "title"))}</h1>` : ""}
          ${L(s, "sub") ? `<p>${esc(L(s, "sub"))}</p>` : "<p></p>"}
          <div class="actions">${safeUrl(s.link_url) ? `<a class="btn btn-primary" ${linkAttrs(s.link_url)}>${esc(L(s, "btn") || t("hero_open"))} →</a>` : ""}${ytBtn(s.youtube_url, L(s, "title"))}</div>
        </div>
      </div>`).join("") : `<div class="hero-empty"><div><h1>${esc(L(site, "name"))}</h1><p>${esc(L(site, "tagline"))}</p></div></div>`;
    return `<section class="hero">
      <div class="hero-main" id="heroMain">
        ${main}
        ${slides.length > 1 ? `<button class="hero-arrow hero-prev" id="heroPrev" aria-label="Previous">‹</button>
          <button class="hero-arrow hero-next" id="heroNext" aria-label="Next">›</button>
          <div class="hero-dots" id="heroDots">${slides.map((_, i) => `<button data-dot="${i}" aria-label="Slide ${i + 1}"></button>`).join("")}</div>
          <div class="hero-progress" id="heroProgress"></div>` : ""}
      </div>
      <aside class="hero-side" id="heroSide">
        <div class="side-info glass tilt" data-max="6" id="heroInfo"></div>
        ${sideSlides().map((s) => `<a class="side-promo tilt" data-max="7" ${linkAttrs(s.link_url)}>
          <img src="${esc(safeUrl(s.image))}" alt="" loading="lazy"><div class="txt"><b>${esc(L(s, "title"))}</b><small>${esc(L(s, "sub"))}</small></div></a>`).join("")}
      </aside></section>`;
  }

  function heroInfoHTML() {
    const slides = mainSlides();
    const site = S.data.site || {};
    if (!slides.length) return `<span class="eyebrow">✦ ${esc(L(site, "name"))}</span><h3>${esc(L(site, "tagline"))}</h3>`;
    const s = slides[S.heroIdx];
    const pad = (n) => String(n).padStart(2, "0");
    return `<span class="eyebrow">✦ ${t("side_now")} <span class="side-counter">${pad(S.heroIdx + 1)} / ${pad(slides.length)}</span></span>
      <h3>${esc(L(s, "title") || L(site, "name"))}</h3><p>${esc(L(s, "sub") || L(site, "tagline"))}</p>
      <div class="actions">${safeUrl(s.link_url) ? `<a class="btn btn-ghost btn-sm" ${linkAttrs(s.link_url)}>🔗 ${esc(L(s, "btn") || t("hero_open"))}</a>` : ""}${ytBtn(s.youtube_url, L(s, "title"), true)}</div>`;
  }

  function goHero(i) {
    const slides = $$("#heroMain .hero-slide");
    if (!slides.length) { const info = $("#heroInfo"); if (info) info.innerHTML = heroInfoHTML(); return; }
    S.heroIdx = (i + slides.length) % slides.length;
    slides.forEach((el, k) => el.classList.toggle("active", k === S.heroIdx));
    $$("#heroDots button").forEach((el, k) => el.classList.toggle("active", k === S.heroIdx));
    const info = $("#heroInfo");
    if (info) { info.innerHTML = heroInfoHTML(); info.insertAdjacentHTML("beforeend", '<i class="gloss"></i>'); }
    const bar = $("#heroProgress");
    if (bar) { bar.classList.remove("run"); void bar.offsetWidth; bar.style.setProperty("--dur", `${S.heroDur}ms`); bar.classList.add("run"); }
    restartHeroTimer();
  }
  function restartHeroTimer() {
    clearInterval(S.heroTimer);
    if (mainSlides().length > 1) S.heroTimer = setInterval(() => goHero(S.heroIdx + 1), S.heroDur);
  }
  function bindHero() {
    const hero = $("#heroMain");
    if (!hero) return;
    if (S.heroIdx >= mainSlides().length) S.heroIdx = 0;
    goHero(S.heroIdx);
    const prev = $("#heroPrev"), next = $("#heroNext");
    if (prev) prev.onclick = () => goHero(S.heroIdx - 1);
    if (next) next.onclick = () => goHero(S.heroIdx + 1);
    $$("#heroDots button").forEach((b) => { b.onclick = () => goHero(Number(b.dataset.dot)); });
    hero.addEventListener("click", (e) => {
      if (!e.target.classList.contains("hero-img")) return;
      const s = mainSlides()[S.heroIdx];
      if (s) openLink(s.link_url);
    });
    hero.addEventListener("pointerenter", () => { clearInterval(S.heroTimer); const b = $("#heroProgress"); if (b) b.style.animationPlayState = "paused"; });
    hero.addEventListener("pointerleave", () => {
      hero.style.transform = "";
      $$(".hero-slide", hero).forEach((sl) => { sl.style.removeProperty("--px"); sl.style.removeProperty("--py"); sl.style.removeProperty("--cx"); sl.style.removeProperty("--cy"); });
      const b = $("#heroProgress"); if (b) b.style.animationPlayState = "running";
      restartHeroTimer();
    });
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      hero.style.transform = `rotateX(${-y * 4}deg) rotateY(${x * 5}deg)`;
      const sl = $(".hero-slide.active", hero);
      if (sl) {
        sl.style.setProperty("--px", `${-x * 28}px`); sl.style.setProperty("--py", `${-y * 20}px`);
        sl.style.setProperty("--cx", `${x * 16}px`); sl.style.setProperty("--cy", `${y * 10}px`);
      }
    });
    let sx = null;
    hero.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) goHero(S.heroIdx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  // ---------- pages ----------
  function homeHTML() {
    const tiles = [...sections().map((s) => [`#/section/${s.key}`, s.icon, L(s, "title"), `${itemsOf(s.key).length} ${t("items_count")}`]),
      ["#/helplines", "☎️", t("helplines"), `${S.data.helplines.length}+`], ["#/donate", "💝", t("donate"), "UPI • QR"], ["#/contact", "📞", t("contact"), t("need_help")]];
    const hot = S.data.items.filter((i) => i.badge === "hot" || i.badge === "trending").slice(0, 8);
    const news = sectionByKey("news") ? itemsOf("news").slice(0, 3) : [];
    const helps = S.data.helplines.slice(0, 4);
    const st = S.data.stats;
    return `<div class="page">
      ${heroHTML()}
      <div class="search-wrap"><input class="search" id="globalSearch" type="search" placeholder="${esc(t("search_all"))}" autocomplete="off"></div>
      <div id="searchResults" class="section-block" hidden></div>
      <div id="homeBlocks">
        <section class="section-block reveal"><div class="section-head"><div><span class="eyebrow">✦ ${t("quick_access")}</span><h2>${t("quick_sub")}</h2></div></div>
          <div class="tiles">${tiles.map(([h, i, l, s]) => `<a class="tile glass tilt" href="${esc(h)}"><span class="ico">${esc(i)}</span><span><b>${esc(l)}</b><small>${esc(s)}</small></span></a>`).join("")}</div></section>
        ${hot.length ? `<section class="section-block"><div class="section-head"><div><span class="eyebrow">🔥 ${t("hot_trending")}</span><h2>${t("hot_trending")}</h2></div></div><div class="cards">${cardsHTML(hot, true)}</div></section>` : ""}
        ${news.length ? `<section class="section-block"><div class="section-head"><div><span class="eyebrow">📰 ${t("latest_news")}</span><h2>${esc(L(sectionByKey("news"), "title"))}</h2></div><a class="btn btn-ghost btn-sm" href="#/section/news">${t("view_all")} →</a></div><div class="cards">${cardsHTML(news)}</div></section>` : ""}
        ${helps.length ? `<section class="section-block"><div class="section-head"><div><span class="eyebrow">☎ ${t("helplines")}</span><h2>${esc(L(S.data.helplines_page, "title") || t("helplines"))}</h2></div><a class="btn btn-ghost btn-sm" href="#/helplines">${t("view_all")} →</a></div><div class="help-grid">${helps.map(helpCardHTML).join("")}</div></section>` : ""}
        <section class="section-block reveal"><div class="stats">
          <div class="stat glass tilt"><b data-count="${st.visits}">0</b><span>👁 ${t("visitors")}</span></div>
          <div class="stat glass tilt"><b data-count="${st.items}">0</b><span>🧩 ${t("services")}</span></div>
          <div class="stat glass tilt"><b data-count="${st.users}">0</b><span>👥 ${t("members")}</span></div></div></section>
        <section class="section-block reveal cta">
          <div class="panel glass tilt" data-max="5"><span class="eyebrow">💝 ${t("support_us")}</span><h2>${esc(L(S.data.donate, "title") || t("support_us"))}</h2><p>${t("support_sub")}</p><a class="btn btn-primary" href="#/donate">${t("donate_now")} →</a></div>
          <div class="panel glass tilt" data-max="5"><span class="eyebrow">🤝 ${t("need_help")}</span><h2>${t("need_help_sub")}</h2><p>${esc((S.data.contact || {}).phone || "")} · ${esc((S.data.contact || {}).email || "")}</p><a class="btn btn-ghost" href="#/contact">${t("contact_us")} →</a></div>
        </section>
        <section class="section-block reveal">${feedbackHTML()}</section>
      </div></div>`;
  }

  function sectionHTML(key) {
    const s = sectionByKey(key);
    if (!s) return `<div class="page empty glass">${t("no_results")}</div>`;
    const list = itemsOf(key);
    return `<div class="page"><a class="back-link" href="#/">← ${t("back")}</a>
      <div class="page-hero glass"><span class="big-ico">${esc(s.icon || "✨")}</span>
        <div class="grow"><span class="eyebrow">${list.length} ${t("items_count")}</span><h1>${esc(L(s, "title"))}</h1><p>${esc(L(s, "subtitle"))}</p></div>
        <div class="actions">${ytBtn(s.youtube_url, L(s, "title"), false)}</div></div>
      <div class="search-wrap sm" style="margin:16px 0"><input class="search sm" id="sectionSearch" type="search" placeholder="${esc(t("search_section"))}"></div>
      <div class="cards" id="sectionCards">${cardsHTML(list)}</div>
      <div class="empty glass" id="sectionEmpty" hidden>${t("no_results")}</div></div>`;
  }

  function helpCardHTML(h) {
    const img = safeUrl(h.image);
    return `<div class="help-card glass tilt reveal" data-max="6"><div class="hc-top"><span class="hc-ico">${img ? `<img src="${esc(img)}" alt="">` : esc(h.icon || "☎")}</span>
      <div style="flex:1"><h3>${esc(L(h, "title"))}</h3><small>${esc(L(h, "desc"))}</small></div>${ytBtn(h.youtube_url, L(h, "title"), true, false)}</div>
      <div class="num-list">${(h.numbers || []).map((n) => `<a class="num" href="tel:${esc(String(n.number).replace(/[^0-9+]/g, ""))}"><span>📞 ${esc(L(n, "label"))}</span><b>${esc(n.number)}</b></a>`).join("")}</div></div>`;
  }

  function helplinesHTML() {
    const p = S.data.helplines_page || {};
    return `<div class="page"><a class="back-link" href="#/">← ${t("back")}</a>
      <div class="page-hero glass"><span class="big-ico">☎️</span><div class="grow"><h1>${esc(L(p, "title") || t("helplines"))}</h1><p>${esc(L(p, "subtitle"))}</p></div>
      <div class="actions">${ytBtn(p.youtube_url, L(p, "title"))}</div></div>
      <div class="help-grid section-block">${S.data.helplines.map(helpCardHTML).join("") || `<div class="empty glass">${t("no_results")}</div>`}</div></div>`;
  }

  function donateHTML() {
    const d = S.data.donate || {};
    const upi = d.upi_id ? `upi://pay?pa=${encodeURIComponent(d.upi_id)}&pn=${encodeURIComponent(d.payee_name || "")}&cu=INR` : "";
    const vid = ytId(d.youtube_url);
    return `<div class="page"><a class="back-link" href="#/">← ${t("back")}</a>
      <div class="page-hero glass"><span class="big-ico">💝</span><div class="grow"><h1>${esc(L(d, "title") || t("donate"))}</h1><p>${esc(L(d, "desc"))}</p></div>
      <div class="actions">${ytBtn(d.youtube_url, L(d, "title"))}</div></div>
      <div class="two-col section-block">
        <div class="panel glass reveal"><h3>📱 ${t("scan_qr")}</h3><div class="qr-box">
          ${safeUrl(d.qr_image) ? `<img src="${esc(d.qr_image)}" alt="QR">` : ""}
          <div style="flex:1;min-width:200px">
            ${d.upi_id ? `<div class="kv"><div><small>${t("upi_id")}</small><b id="upiId">${esc(d.upi_id)}</b></div><button class="btn btn-ghost btn-sm" data-copy="${esc(d.upi_id)}">${t("copy")}</button></div>` : ""}
            ${d.payee_name ? `<div class="kv"><div><small>${t("payee")}</small><b>${esc(d.payee_name)}</b></div></div>` : ""}
            ${L(d, "bank") ? `<div class="kv"><div><small>🏦</small><b>${esc(L(d, "bank"))}</b></div></div>` : ""}
            ${upi ? `<a class="btn btn-primary" href="${esc(upi)}">⚡ ${t("pay_upi")}</a>` : ""}
          </div></div>
          ${vid ? `<h3 style="margin-top:20px">▶ ${t("donate_video")}</h3><div class="yt-frame"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/${vid}?rel=0" allowfullscreen title="YouTube"></iframe></div>` : ""}
        </div>
        <div class="panel glass reveal"><h3>🧾 ${t("record_donation")}</h3>
          <form id="donorForm" class="form-grid">
            <div><label class="lbl">${t("donor_name")}</label><input class="input" name="name" required minlength="2" maxlength="80" value="${esc(S.user ? S.user.name : "")}"></div>
            <div><label class="lbl">${t("donor_mobile")}</label><input class="input" name="mobile" maxlength="20" value="${esc(S.user ? S.user.mobile : "")}"></div>
            <div class="full"><label class="lbl">${t("amount")}</label><input class="input" name="amount" type="number" min="1" step="1" required></div>
            <div class="full"><label class="lbl">${t("note")}</label><textarea class="textarea" name="note" maxlength="500"></textarea></div>
            <div class="full"><button class="btn btn-primary" type="submit">${t("submit")}</button></div>
          </form></div></div></div>`;
  }

  function contactHTML() {
    const c = S.data.contact || {};
    const wa = String(c.whatsapp || "").replace(/\D/g, "");
    const cards = [
      c.phone && ["📞", t("phone"), c.phone, `tel:${c.phone.replace(/[^0-9+]/g, "")}`],
      wa && ["💬", t("whatsapp"), `+${wa}`, `https://wa.me/${wa}`],
      c.email && ["✉️", t("email"), c.email, `mailto:${c.email}`],
      L(c, "address") && ["📍", t("address"), L(c, "address"), safeUrl(c.map_url)],
      L(c, "hours") && ["🕘", t("hours"), L(c, "hours"), ""],
      safeUrl(c.youtube_channel) && ["▶️", "YouTube", "YouTube", c.youtube_channel],
      safeUrl(c.facebook_url) && ["📘", "Facebook", "Facebook", c.facebook_url],
    ].filter(Boolean);
    const people = S.data.contacts || [];
    return `<div class="page"><a class="back-link" href="#/">← ${t("back")}</a>
      <div class="page-hero glass"><span class="big-ico">📞</span><div class="grow"><h1>${t("contact")}</h1><p>${t("need_help_sub")}</p></div>
      <div class="actions">${wa ? `<a class="btn btn-primary" href="https://wa.me/${wa}" target="_blank" rel="noopener">💬 ${t("chat_whatsapp")}</a>` : ""}${ytBtn(c.youtube_url, t("contact"))}</div></div>
      <div class="contact-grid section-block">${cards.map(([i, l, v, h]) => `<${h ? `a ${linkAttrs(h)}` : "div"} class="contact-card glass tilt reveal" data-max="6"><span class="ci">${i}</span><span><small>${esc(l)}</small><b>${esc(v)}</b></span></${h ? "a" : "div"}>`).join("")}</div>
      ${people.length ? `<section class="section-block"><div class="section-head"><div><span class="eyebrow">👥 ${t("our_team")}</span><h2>${t("our_team")}</h2></div></div>
        <div class="contact-grid">${people.map((p) => `<div class="person glass tilt reveal">${safeUrl(p.photo) ? `<img src="${esc(p.photo)}" alt="">` : `<span class="avatar-fallback">${esc((L(p, "name") || "?").charAt(0))}</span>`}
          <h4>${esc(L(p, "name"))}</h4><small>${esc(L(p, "role"))}</small><div class="actions">
          ${p.phone ? `<a class="btn btn-ghost btn-sm" href="tel:${esc(p.phone.replace(/[^0-9+]/g, ""))}">📞 ${t("call")}</a>` : ""}
          ${p.email ? `<a class="btn btn-ghost btn-sm" href="mailto:${esc(p.email)}">✉ ${t("email")}</a>` : ""}</div></div>`).join("")}</div></section>` : ""}
      <section class="section-block">${feedbackHTML()}</section></div>`;
  }

  function feedbackHTML() {
    return `<div class="panel glass"><span class="eyebrow">📨 ${t("feedback_title")}</span><h2>${t("feedback_sub")}</h2>
      <form class="form-grid fb-form">
        <div><label class="lbl">${t("fb_feedback")}</label><select class="select" name="kind"><option value="feedback">${t("fb_feedback")}</option><option value="suggestion">${t("fb_suggestion")}</option><option value="complaint">${t("fb_complaint")}</option></select></div>
        <div><label class="lbl">${t("your_name")}</label><input class="input" name="name" maxlength="80" value="${esc(S.user ? S.user.name : "")}"></div>
        <div class="full"><label class="lbl">${t("fb_rating")}</label><div class="stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}">★</button>`).join("")}</div><input type="hidden" name="rating" value="0"></div>
        <div class="full"><textarea class="textarea" name="message" required minlength="2" maxlength="2000" placeholder="${esc(t("fb_message"))}"></textarea></div>
        <div class="full"><button class="btn btn-primary" type="submit">📨 ${t("submit")}</button></div></form></div>`;
  }

  // ---------- router ----------
  function render() {
    if (!S.data) return;
    const h = location.hash || "#/";
    let html;
    const m = h.match(/^#\/section\/([\w-]+)/);
    if (m) html = sectionHTML(m[1]);
    else if (h.startsWith("#/helplines")) html = helplinesHTML();
    else if (h.startsWith("#/donate")) html = donateHTML();
    else if (h.startsWith("#/contact")) html = contactHTML();
    else html = homeHTML();
    clearInterval(S.heroTimer);
    $("#app").innerHTML = html;
    renderChrome();
    bindHero();
    bindTilt($("#app"));
    bindTilt($("#footer"));
    bindReveal($("#app"));
    countUp($("#app"));
    bindPage();
  }

  function bindPage() {
    const gs = $("#globalSearch");
    if (gs) gs.addEventListener("input", () => {
      const q = gs.value.trim().toLowerCase();
      const box = $("#searchResults");
      $("#homeBlocks").hidden = !!q;
      box.hidden = !q;
      if (!q) return;
      const hits = S.data.items.filter((i) => `${i.title_bn} ${i.title_en} ${i.desc_bn} ${i.desc_en}`.toLowerCase().includes(q));
      box.innerHTML = `<div class="section-head"><h2>${t("results_for")}: “${esc(gs.value.trim())}”</h2></div><div class="cards">${cardsHTML(hits, true)}</div>`;
      bindTilt(box); $$(".reveal", box).forEach((e) => e.classList.add("in"));
    });
    const ss = $("#sectionSearch");
    if (ss) ss.addEventListener("input", () => {
      const q = ss.value.trim().toLowerCase();
      let n = 0;
      $$("#sectionCards .card").forEach((c) => { const ok = !q || c.dataset.search.includes(q); c.hidden = !ok; if (ok) { n++; c.classList.add("in"); } });
      $("#sectionEmpty").hidden = n > 0;
    });
    $$(".fb-form").forEach((f) => {
      $$("[data-star]", f).forEach((b) => b.addEventListener("click", () => {
        const n = Number(b.dataset.star);
        f.rating.value = n;
        $$("[data-star]", f).forEach((x) => x.classList.toggle("on", Number(x.dataset.star) <= n));
      }));
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (Number(f.rating.value) < 1) { toast(t("fb_need_rating"), "err"); return; }
        try {
          await api("/api/feedback", { method: "POST", body: { kind: f.kind.value, rating: Number(f.rating.value), message: f.message.value, name: f.name.value } });
          f.reset(); f.rating.value = 0; $$("[data-star]", f).forEach((x) => x.classList.remove("on"));
          toast(t("fb_thanks"));
        } catch (err) { toast(err.message, "err"); }
      });
    });
    const df = $("#donorForm");
    if (df) df.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await api("/api/donors", { method: "POST", body: { name: df.name.value, mobile: df.mobile.value, amount: Number(df.amount.value), note: df.note.value } });
        df.amount.value = ""; df.note.value = "";
        toast(t("thanks_donation"));
      } catch (err) { toast(err.message, "err"); }
    });
  }

  // ---------- auth ----------
  function authModal(mode) {
    const signup = mode === "signup";
    openModal(`<h2>${signup ? "👤 " + t("signup_title") : "🔐 " + t("login_title")}</h2><p class="sub">${esc(L(S.data.site, "name"))}</p>
      <form class="stack" id="authForm">
        ${signup ? `<input class="input" name="name" placeholder="${esc(t("full_name"))}" required minlength="2">
          <input class="input" name="mobile" inputmode="numeric" placeholder="${esc(t("mobile"))}" required>
          <input class="input" name="email" type="email" placeholder="${esc(t("email"))}" required>`
        : `<input class="input" name="identifier" placeholder="${esc(t("mobile_or_email"))}" required>`}
        <input class="input" name="password" type="password" placeholder="${esc(t("password"))}" required minlength="${signup ? 6 : 1}">
        <div class="msg" id="authMsg"></div>
        <button class="btn btn-primary" type="submit">${signup ? t("register") : t("login")}</button>
        <div class="switch-line">${signup ? t("have_account") : t("no_account")} <button type="button" class="link-btn" data-auth="${signup ? "login" : "signup"}">${signup ? t("login_here") : t("register_here")}</button></div>
        ${signup ? "" : `<div class="switch-line"><button type="button" class="link-btn" id="forgotBtn">${t("forgot")}</button></div>`}
      </form>`);
    const f = $("#authForm");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#authMsg");
      msg.className = "msg"; msg.textContent = "…";
      try {
        const body = signup ? { name: f.name.value, mobile: f.mobile.value, email: f.email.value, password: f.password.value } : { identifier: f.identifier.value, password: f.password.value };
        const r = await api(`/api/auth/${signup ? "signup" : "login"}`, { method: "POST", body, token: "" });
        S.token = r.token; S.user = r.user; localStorage.setItem("userToken", r.token);
        msg.className = "msg ok"; msg.textContent = `✓ ${t("welcome")}, ${r.user.name} (${r.user.code})`;
        renderAuthArea();
        setTimeout(closeModal, 700);
      } catch (err) { msg.className = "msg err"; msg.textContent = `✕ ${err.message}`; }
    });
    const fb = $("#forgotBtn");
    if (fb) fb.onclick = () => {
      const wa = String((S.data.contact || {}).whatsapp || "").replace(/\D/g, "");
      $("#authMsg").className = "msg ok";
      $("#authMsg").innerHTML = `${esc(t("forgot_msg"))} ${wa ? `<a href="https://wa.me/${wa}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ""}`;
    };
  }

  function profileModal() {
    const u = S.user;
    if (!u) { authModal("login"); return; }
    const keys = ["name", "mobile", "email", "dob", "father", "spouse", "photo"];
    const pct = Math.round((keys.filter((k) => String(u[k] || "").trim()).length / keys.length) * 100);
    openModal(`<div class="profile-top"><div class="pic">${avatar(u)}<label class="cam" title="${esc(t("change_photo"))}">📷<input type="file" accept="image/*" id="photoInput" hidden></label></div>
      <div><h2>${esc(u.name)}</h2><span class="uid">${t("user_id")}: ${esc(u.code)}</span><div class="hint">${t("member_since")}: ${esc((u.created_at || "").slice(0, 10))}</div></div></div>
      <small class="hint">${t("completion")}: ${pct}%</small><div class="meter"><i style="width:${pct}%"></i></div>
      <form id="profileForm" class="form-grid">
        <div class="full"><label class="lbl">${t("full_name")}</label><input class="input" name="name" value="${esc(u.name)}" required minlength="2"></div>
        <div><label class="lbl">${t("dob")}</label><input class="input" name="dob" type="date" value="${esc(u.dob)}"></div>
        <div><label class="lbl">${t("mobile")}</label><input class="input" value="${esc(u.mobile)}" disabled></div>
        <div><label class="lbl">${t("father")}</label><input class="input" name="father" value="${esc(u.father)}"></div>
        <div><label class="lbl">${t("spouse")}</label><input class="input" name="spouse" value="${esc(u.spouse)}"></div>
        <div class="full"><label class="lbl">${t("email")}</label><input class="input" value="${esc(u.email)}" disabled></div>
        <div class="full" style="display:flex;gap:8px"><button class="btn btn-primary" type="submit">💾 ${t("save")}</button><button class="btn btn-ghost" type="button" id="logoutBtn">↪ ${t("logout")}</button></div>
      </form>`);
    $("#profileForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        S.user = await api("/api/auth/me", { method: "PUT", body: { name: f.name.value, dob: f.dob.value, father: f.father.value, spouse: f.spouse.value } });
        toast(t("saved")); renderAuthArea(); profileModal();
      } catch (err) { toast(err.message, "err"); }
    });
    $("#photoInput").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const fd = new FormData(); fd.append("file", file);
        const up = await api("/api/auth/upload", { method: "POST", body: fd });
        S.user = await api("/api/auth/me", { method: "PUT", body: { photo: up.url } });
        toast(t("saved")); renderAuthArea(); profileModal();
      } catch (err) { toast(err.message, "err"); }
    });
    $("#logoutBtn").onclick = () => { S.token = ""; S.user = null; localStorage.removeItem("userToken"); closeModal(); renderAuthArea(); };
  }

  // ---------- global events ----------
  document.addEventListener("click", (e) => {
    const yt = e.target.closest("[data-yt]");
    if (yt) { e.preventDefault(); e.stopPropagation(); playYT(yt.dataset.yt, yt.dataset.ytTitle); return; }
    const au = e.target.closest("[data-auth]");
    if (au) { authModal(au.dataset.auth); return; }
    if (e.target.closest("#userChip")) { profileModal(); return; }
    if (e.target.closest("#adminBtn") || e.target.closest("#footAdmin")) { window.Admin && window.Admin.open(); return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) { navigator.clipboard && navigator.clipboard.writeText(cp.dataset.copy).then(() => toast(t("copied"))); return; }
    if (e.target.closest("[data-close]") || e.target === $("#modal")) { closeModal(); return; }
    if (e.target.closest("#nav a")) $("#nav").classList.remove("open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (!$("#heroMain") || $("#modal").classList.contains("open") || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") goHero(S.heroIdx + 1);
    if (e.key === "ArrowLeft") goHero(S.heroIdx - 1);
  });
  $("#langBtn").addEventListener("click", () => { S.lang = S.lang === "bn" ? "en" : "bn"; localStorage.setItem("lang", S.lang); render(); tickClock(); });
  $("#themeBtn").addEventListener("click", () => { S.theme = S.theme === "dark" ? "light" : "dark"; localStorage.setItem("theme", S.theme); renderChrome(); });
  $("#menuBtn").addEventListener("click", () => $("#nav").classList.toggle("open"));
  window.addEventListener("hashchange", () => { render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  window.addEventListener("scroll", () => {
    const sl = $("#heroMain .hero-slide.active .hero-img");
    if (sl && window.scrollY < 700) sl.parentElement.style.setProperty("--py", `${window.scrollY * 0.12}px`);
  }, { passive: true });

  async function reload() {
    S.data = await api("/api/public/site", { token: "" });
    render();
  }

  async function boot() {
    document.documentElement.lang = S.lang;
    document.documentElement.dataset.theme = S.theme;
    tickClock();
    setInterval(tickClock, 1000);
    try {
      S.data = await api("/api/public/site", { token: "" });
    } catch (err) {
      $("#app").innerHTML = `<div class="empty glass">${esc(t("error"))}: ${esc(err.message)}</div>`;
      return;
    }
    if (S.token) {
      try { S.user = await api("/api/auth/me"); } catch { S.token = ""; localStorage.removeItem("userToken"); }
    }
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("visitDay") !== today) {
      try { const v = await api("/api/public/visit", { method: "POST", token: "" }); S.data.stats.visits = v.visits; localStorage.setItem("visitDay", today); } catch { /* non-critical */ }
    }
    render();
  }

  window.Portal = { S, api, esc, t, L, safeUrl, toast, openModal, closeModal, reload, render, ytId, bindTilt };
  boot();
})();

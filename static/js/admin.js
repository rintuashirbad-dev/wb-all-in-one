(() => {
  "use strict";
  const P = window.Portal;
  const { esc, L, safeUrl, toast } = P;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const A = {
    token: sessionStorage.getItem("adminToken") || "",
    tab: "dashboard",
    data: null,
    editing: null,
    itemFilter: "",
  };

  // bilingual admin labels: key -> [bn, en]
  const W = {
    dashboard: ["ড্যাশবোর্ড", "Dashboard"], hero: ["হিরো স্লাইড", "Hero Slides"], sections: ["বিভাগ", "Sections"],
    items: ["আইটেম / কার্ড", "Items / Cards"], helplines: ["হেল্পলাইন", "Helplines"], contacts: ["যোগাযোগ ব্যক্তি", "Contact People"],
    site: ["সাইট ও ব্র্যান্ডিং", "Site & Branding"], contact: ["যোগাযোগ তথ্য", "Contact Info"], donate: ["অনুদান", "Donate"],
    users: ["ইউজার", "Users"], feedback: ["মতামত", "Feedback"], donors: ["দাতা", "Donors"], view_site: ["সাইট দেখুন", "View site"],
    logout: ["লগআউট", "Logout"], add: ["যোগ করুন", "Add"], update: ["আপডেট করুন", "Update"], cancel: ["বাতিল", "Cancel"],
    edit: ["এডিট", "Edit"], del: ["ডিলিট", "Delete"], save: ["সংরক্ষণ", "Save"], saved: ["সংরক্ষিত হয়েছে", "Saved"],
    deleted: ["ডিলিট হয়েছে", "Deleted"], confirm_del: ["নিশ্চিতভাবে ডিলিট করবেন?", "Delete this permanently?"],
    upload: ["ছবি আপলোড", "Upload image"], replace: ["ছবি বদলান", "Replace image"], clear: ["সরান", "Clear"], uploaded: ["আপলোড হয়েছে", "Uploaded"],
    image: ["ছবি", "Image"], title_bn: ["শিরোনাম (বাংলা)", "Title (Bengali)"], title_en: ["শিরোনাম (ইংরেজি)", "Title (English)"],
    sub_bn: ["উপশিরোনাম (বাংলা)", "Subtitle (Bengali)"], sub_en: ["উপশিরোনাম (ইংরেজি)", "Subtitle (English)"],
    subtitle_bn: ["উপশিরোনাম (বাংলা)", "Subtitle (Bengali)"], subtitle_en: ["উপশিরোনাম (ইংরেজি)", "Subtitle (English)"],
    desc_bn: ["বিবরণ (বাংলা)", "Description (Bengali)"], desc_en: ["বিবরণ (ইংরেজি)", "Description (English)"],
    link_url: ["লিঙ্ক (https://… বা #/section/…)", "Link (https://… or #/section/…)"], btn_bn: ["বাটন লেখা (বাংলা)", "Button text (Bengali)"],
    btn_en: ["বাটন লেখা (ইংরেজি)", "Button text (English)"], youtube_url: ["ইউটিউব হেল্প লিঙ্ক", "YouTube help link"],
    position: ["অবস্থান", "Position"], fit: ["ছবির ফিট", "Image fit"], active: ["সক্রিয় (দেখাবে)", "Active (visible)"],
    key: ["কী (ইংরেজি ছোট হাতের, যেমন jobs)", "Key (lowercase, e.g. jobs)"], icon: ["আইকন (ইমোজি)", "Icon (emoji)"], kind: ["ধরন", "Kind"],
    sort_order: ["ক্রম", "Order"], section_key: ["বিভাগ", "Section"], link_label_bn: ["বাটন লেখা (বাংলা)", "Button label (Bengali)"],
    link_label_en: ["বাটন লেখা (ইংরেজি)", "Button label (English)"], badge: ["ব্যাজ", "Badge"], numbers: ["নম্বর তালিকা", "Numbers"],
    name_bn: ["নাম (বাংলা)", "Name (Bengali)"], name_en: ["নাম (ইংরেজি)", "Name (English)"], role_bn: ["পদ (বাংলা)", "Role (Bengali)"],
    role_en: ["পদ (ইংরেজি)", "Role (English)"], phone: ["ফোন", "Phone"], email: ["ইমেইল", "Email"], photo: ["ছবি", "Photo"],
    tagline_bn: ["ট্যাগলাইন (বাংলা)", "Tagline (Bengali)"], tagline_en: ["ট্যাগলাইন (ইংরেজি)", "Tagline (English)"], logo: ["লোগো", "Logo"],
    notice_bn: ["চলমান বার্তা (বাংলা)", "Moving notice (Bengali)"], notice_en: ["চলমান বার্তা (ইংরেজি)", "Moving notice (English)"],
    footer_bn: ["ফুটার লেখা (বাংলা)", "Footer text (Bengali)"], footer_en: ["ফুটার লেখা (ইংরেজি)", "Footer text (English)"],
    user_id_prefix: ["ইউজার আইডি প্রিফিক্স", "User ID prefix"], whatsapp: ["হোয়াটসঅ্যাপ (শুধু সংখ্যা, দেশের কোড সহ)", "WhatsApp (digits incl. country code)"],
    address_bn: ["ঠিকানা (বাংলা)", "Address (Bengali)"], address_en: ["ঠিকানা (ইংরেজি)", "Address (English)"], hours_bn: ["সময় (বাংলা)", "Hours (Bengali)"],
    hours_en: ["সময় (ইংরেজি)", "Hours (English)"], map_url: ["ম্যাপ লিঙ্ক", "Map link"], facebook_url: ["ফেসবুক লিঙ্ক", "Facebook link"],
    youtube_channel: ["ইউটিউব চ্যানেল", "YouTube channel"], upi_id: ["UPI আইডি", "UPI ID"], payee_name: ["প্রাপকের নাম", "Payee name"],
    qr_image: ["QR কোড ছবি", "QR code image"], bank_bn: ["ব্যাংক তথ্য (বাংলা)", "Bank details (Bengali)"], bank_en: ["ব্যাংক তথ্য (ইংরেজি)", "Bank details (English)"],
    page_settings: ["পেজ সেটিংস", "Page settings"], add_hero: ["নতুন হিরো ছবি যোগ করুন", "Add home hero image"], edit_hero: ["হিরো ছবি এডিট", "Edit hero image"],
    hero_hint: ["মূল স্লাইড বড় স্লাইডারে ঘুরবে (অটো-স্লাইড, ডট, আগে/পরে)। সাইড স্লাইড ডানদিকে প্রোমো কার্ড হিসেবে দেখাবে।", "Main slides rotate in the big slider (auto-slide, dots, prev/next). Side slides show as promo cards on the right."],
    main: ["মূল স্লাইডার", "Main slider"], side: ["সাইড প্রোমো", "Side promo"], cover: ["পুরো ভরাট (cover)", "Fill (cover)"], contain: ["সম্পূর্ণ দেখাবে (contain)", "Fit whole (contain)"],
    cards: ["কার্ড", "Cards"], videos: ["ভিডিও", "Videos"], none: ["কোনোটি নয়", "None"], new: ["নতুন", "New"], hot: ["হট", "Hot"], trending: ["ট্রেন্ডিং", "Trending"],
    all: ["সব", "All"], up: ["উপরে", "Up"], down: ["নিচে", "Down"], visitors: ["দর্শক", "Visitors"], set: ["সেট", "Set"],
    visitor_control: ["দর্শক নিয়ন্ত্রণ", "Visitor control"], reset_pw: ["পাসওয়ার্ড রিসেট", "Reset password"], new_pw: ["নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)", "New password (min 6 chars)"],
    search: ["খুঁজুন…", "Search…"], total: ["মোট", "Total"], no_data: ["কোনো তথ্য নেই", "Nothing here yet"], joined: ["যোগদান", "Joined"],
    name: ["নাম", "Name"], mobile: ["মোবাইল", "Mobile"], amount: ["পরিমাণ", "Amount"], note: ["বার্তা", "Note"], date: ["তারিখ", "Date"],
    has_yt: ["ইউটিউব হেল্প আছে", "YouTube help set"], hidden: ["লুকানো", "Hidden"], add_number: ["নম্বর যোগ", "Add number"],
    label_bn: ["লেবেল (বাংলা)", "Label (Bengali)"], label_en: ["লেবেল (ইংরেজি)", "Label (English)"], number: ["নম্বর", "Number"],
    login_title: ["অ্যাডমিন লগইন", "Admin Login"], username: ["ইউজারনেম", "Username"], password: ["পাসওয়ার্ড", "Password"], login: ["লগইন", "Login"],
    donations: ["মোট অনুদান", "Total donations"], slides: ["স্লাইড", "Slides"], cfg_section_yt: ["প্রতিটি বিভাগের ইউটিউব হেল্প লিঙ্ক এখানে সেট করুন।", "Set each section's YouTube help link here."],
    preview: ["প্রিভিউ", "Preview"], kind_videos_hint: ["ভিডিও ধরনের বিভাগে লিঙ্কটি ইউটিউব ভিডিও হলে কার্ডে প্লেয়ার খুলবে।", "In a Videos section, a YouTube link opens in the player."],
  };
  const w = (k) => (W[k] ? W[k][P.S.lang === "bn" ? 0 : 1] : k);

  const api = (path, opts = {}) => P.api(path, { ...opts, token: A.token }).catch((err) => {
    if (err.status === 401) { logout(); toast(w("login_title"), "err"); }
    throw err;
  });

  const opt = (vals) => vals.map((v) => [v, w(v || "none")]);
  const FIELDS = {
    slides: [["image", "image", "full"], ["title_bn"], ["title_en"], ["sub_bn", "textarea"], ["sub_en", "textarea"], ["link_url", "url", "full"],
      ["btn_bn"], ["btn_en"], ["youtube_url", "url", "full"], ["position", "select", "", opt(["main", "side"])], ["fit", "select", "", opt(["cover", "contain"])], ["active", "check"]],
    sections: [["key"], ["icon"], ["title_bn"], ["title_en"], ["subtitle_bn"], ["subtitle_en"], ["kind", "select", "", opt(["cards", "videos"])],
      ["sort_order", "number"], ["youtube_url", "url", "full"], ["active", "check"]],
    items: [["section_key", "select", "", () => A.data.sections.map((s) => [s.key, `${s.icon} ${L(s, "title")}`])], ["badge", "select", "", opt(["", "new", "hot", "trending"])],
      ["title_bn"], ["title_en"], ["desc_bn", "textarea"], ["desc_en", "textarea"], ["image", "image", "full"], ["icon"], ["link_url", "url"],
      ["link_label_bn"], ["link_label_en"], ["youtube_url", "url", "full"], ["active", "check"]],
    helplines: [["title_bn"], ["title_en"], ["desc_bn"], ["desc_en"], ["icon"], ["youtube_url", "url"], ["image", "image", "full"], ["numbers", "numbers", "full"]],
    contacts: [["name_bn"], ["name_en"], ["role_bn"], ["role_en"], ["phone"], ["email"], ["photo", "image", "full"]],
    site: [["name_bn"], ["name_en"], ["tagline_bn"], ["tagline_en"], ["logo", "image", "full"], ["notice_bn", "textarea"], ["notice_en", "textarea"],
      ["footer_bn", "textarea"], ["footer_en", "textarea"], ["user_id_prefix"]],
    contact: [["phone"], ["whatsapp"], ["email"], ["map_url", "url"], ["address_bn", "textarea"], ["address_en", "textarea"], ["hours_bn"], ["hours_en"],
      ["facebook_url", "url"], ["youtube_channel", "url"], ["youtube_url", "url", "full"]],
    donate: [["title_bn"], ["title_en"], ["desc_bn", "textarea"], ["desc_en", "textarea"], ["upi_id"], ["payee_name"], ["qr_image", "image", "full"],
      ["bank_bn", "textarea"], ["bank_en", "textarea"], ["youtube_url", "url", "full"]],
    helplines_page: [["title_bn"], ["title_en"], ["subtitle_bn"], ["subtitle_en"], ["youtube_url", "url", "full"]],
  };
  const DEFAULTS = { slides: { position: "main", fit: "cover", active: true }, sections: { kind: "cards", active: true }, items: { active: true }, helplines: { numbers: [] } };

  // ---------- form builder ----------
  function fieldHTML([name, type = "text", cls = "", options], v) {
    const lbl = `<label class="lbl">${esc(w(name))}</label>`;
    const val = v === undefined || v === null ? "" : v;
    if (type === "image") {
      return `<div class="${cls || "full"}">${lbl}<div class="img-field" data-img="${name}">
        <img class="prev" ${safeUrl(val) ? `src="${esc(val)}"` : ""} alt="">
        <div class="grow"><input class="input" name="${name}" value="${esc(val)}" placeholder="/uploads/… or https://…">
        <div style="display:flex;gap:6px;flex-wrap:wrap"><label class="btn btn-primary btn-sm">⬆ ${esc(val ? w("replace") : w("upload"))}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden data-upload="${name}"></label>
        <button type="button" class="btn btn-ghost btn-sm" data-clear="${name}">✕ ${esc(w("clear"))}</button></div></div></div></div>`;
    }
    if (type === "textarea") return `<div class="${cls}">${lbl}<textarea class="textarea" rows="2" name="${name}">${esc(val)}</textarea></div>`;
    if (type === "select") {
      const opts = typeof options === "function" ? options() : options;
      return `<div class="${cls}">${lbl}<select class="select" name="${name}">${opts.map(([o, l]) => `<option value="${esc(o)}" ${String(o) === String(val) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`;
    }
    if (type === "check") return `<div class="${cls || "full"}"><label class="chk"><input type="checkbox" name="${name}" ${val ? "checked" : ""}> ${esc(w(name))}</label></div>`;
    if (type === "numbers") {
      const rows = (Array.isArray(val) ? val : []).map(numRow).join("");
      return `<div class="full">${lbl}<div class="num-rows" data-numbers>${rows}</div><button type="button" class="btn btn-ghost btn-sm" data-addnum style="margin-top:8px">＋ ${esc(w("add_number"))}</button></div>`;
    }
    const itype = type === "number" ? "number" : type === "url" ? "text" : "text";
    return `<div class="${cls}">${lbl}<input class="input" type="${itype}" name="${name}" value="${esc(val)}" ${type === "url" ? 'placeholder="https://…"' : ""}></div>`;
  }
  const numRow = (n = {}) => `<div class="nr"><input class="input" data-k="label_bn" placeholder="${esc(w("label_bn"))}" value="${esc(n.label_bn || "")}">
    <input class="input" data-k="label_en" placeholder="${esc(w("label_en"))}" value="${esc(n.label_en || "")}">
    <input class="input" data-k="number" placeholder="${esc(w("number"))}" value="${esc(n.number || "")}"><button type="button" class="btn btn-ghost btn-sm" data-rmnum>✕</button></div>`;

  function formHTML(fields, values, id) {
    return `<form class="a-grid" id="${id}">${fields.map((f) => fieldHTML(f, values[f[0]])).join("")}</form>`;
  }
  function readForm(form, fields) {
    const out = {};
    fields.forEach(([name, type = "text"]) => {
      if (type === "numbers") {
        out[name] = $$("[data-numbers] .nr", form).map((r) => ({
          label_bn: $('[data-k="label_bn"]', r).value.trim(), label_en: $('[data-k="label_en"]', r).value.trim(), number: $('[data-k="number"]', r).value.trim(),
        })).filter((n) => n.number);
        return;
      }
      const el = form.elements[name];
      if (!el) return;
      if (type === "check") out[name] = el.checked;
      else if (type === "number") out[name] = Number(el.value) || 0;
      else out[name] = el.value.trim();
    });
    return out;
  }
  function bindForm(form) {
    form.addEventListener("change", async (e) => {
      const inp = e.target.closest("[data-upload]");
      if (!inp || !inp.files[0]) return;
      const name = inp.dataset.upload;
      const fd = new FormData();
      fd.append("file", inp.files[0]);
      try {
        const r = await api("/api/admin/upload", { method: "POST", body: fd });
        form.elements[name].value = r.url;
        const prev = $(`[data-img="${name}"] .prev`, form);
        prev.src = r.url;
        toast(`✓ ${w("uploaded")}`);
      } catch (err) { toast(err.message, "err"); }
      inp.value = "";
    });
    form.addEventListener("input", (e) => {
      const box = e.target.closest("[data-img]");
      if (box && e.target.name) { const p = $(".prev", box); if (safeUrl(e.target.value)) p.src = e.target.value; else p.removeAttribute("src"); }
    });
    form.addEventListener("click", (e) => {
      const c = e.target.closest("[data-clear]");
      if (c) { form.elements[c.dataset.clear].value = ""; $(`[data-img="${c.dataset.clear}"] .prev`, form).removeAttribute("src"); }
      if (e.target.closest("[data-addnum]")) $("[data-numbers]", form).insertAdjacentHTML("beforeend", numRow());
      const rm = e.target.closest("[data-rmnum]");
      if (rm) rm.closest(".nr").remove();
    });
  }

  // ---------- login / shell ----------
  function open() {
    if (!P.S.data) return;
    if (A.token) { showShell(); return; }
    P.openModal(`<h2>⚙ ${esc(w("login_title"))}</h2><p class="sub">${esc(L(P.S.data.site, "name"))}</p>
      <form class="stack" id="adminLogin"><input class="input" name="username" placeholder="${esc(w("username"))}" value="admin" required autocomplete="username">
      <input class="input" name="password" type="password" placeholder="${esc(w("password"))}" required autocomplete="current-password">
      <div class="msg" id="adminMsg"></div><button class="btn btn-primary" type="submit">${esc(w("login"))}</button></form>`);
    $("#adminLogin").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        const r = await P.api("/api/admin/login", { method: "POST", body: { username: f.username.value, password: f.password.value }, token: "" });
        A.token = r.token; sessionStorage.setItem("adminToken", r.token);
        P.closeModal(); showShell();
      } catch (err) { $("#adminMsg").className = "msg err"; $("#adminMsg").textContent = `✕ ${err.message}`; }
    });
  }
  function logout() {
    A.token = ""; sessionStorage.removeItem("adminToken");
    $("#adminShell").classList.remove("open"); $("#adminShell").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  const TABS = [["dashboard", "📊"], ["hero", "🖼️"], ["sections", "🗂️"], ["items", "🧩"], ["helplines", "☎️"], ["contacts", "👥"],
    ["site", "🎨"], ["contact", "📞"], ["donate", "💝"], ["users", "🧑‍💻"], ["feedback", "📨"], ["donors", "🧾"]];

  async function showShell() {
    const shell = $("#adminShell");
    shell.classList.add("open"); shell.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    try { await loadData(); } catch { return; }
    renderShell();
  }
  async function loadData() { A.data = await api("/api/admin/data"); }
  async function refreshAll() { await loadData(); await P.reload(); renderTab(); }

  function renderShell() {
    const site = P.S.data.site || {};
    $("#adminShell").innerHTML = `<aside class="admin-side" id="aSide">
        <a class="brand" href="#/"><img class="brand-logo" src="${esc(safeUrl(site.logo) || "/static/img/seed/logo.svg")}" alt=""><span class="brand-text"><b>${esc(L(site, "name"))}</b><small>Admin</small></span></a>
        ${TABS.map(([k, i]) => `<button data-tab="${k}" class="${A.tab === k ? "active" : ""}">${i} ${esc(w(k))}</button>`).join("")}
        <hr style="border:0;border-top:1px solid var(--line);margin:12px 0">
        <button data-act="lang">🌐 ${P.S.lang === "bn" ? "English" : "বাংলা"}</button>
        <button data-act="site">👁 ${esc(w("view_site"))}</button><button data-act="logout">↪ ${esc(w("logout"))}</button></aside>
      <section class="admin-main"><div class="admin-top"><div style="display:flex;gap:10px;align-items:center"><button class="icon-btn admin-menu-btn" data-act="menu">☰</button><h1 id="aTitle"></h1></div><div class="actions" id="aActions"></div></div><div id="aBody"></div></section>`;
    $("#adminShell").onclick = (e) => {
      const tb = e.target.closest("[data-tab]");
      if (tb) { A.tab = tb.dataset.tab; A.editing = null; $$("#aSide [data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === A.tab)); $("#aSide").classList.remove("open"); renderTab(); return; }
      const act = e.target.closest("[data-act]");
      if (!act) return;
      if (act.dataset.act === "logout") logout();
      if (act.dataset.act === "site") { $("#adminShell").classList.remove("open"); document.body.style.overflow = ""; }
      if (act.dataset.act === "menu") $("#aSide").classList.toggle("open");
      if (act.dataset.act === "lang") { P.S.lang = P.S.lang === "bn" ? "en" : "bn"; localStorage.setItem("lang", P.S.lang); P.render(); renderShell(); }
    };
    renderTab();
  }

  function renderTab() {
    $("#aTitle").textContent = w(A.tab);
    $("#aActions").innerHTML = "";
    const body = $("#aBody");
    ({ dashboard, hero: () => listTab("slides"), sections: () => listTab("sections"), items: () => listTab("items"), helplines: () => listTab("helplines"),
      contacts: () => listTab("contacts"), site: () => settingsTab(["site"]), contact: () => settingsTab(["contact"]), donate: () => settingsTab(["donate"]),
      users, feedback, donors })[A.tab](body);
  }

  // ---------- dashboard ----------
  async function dashboard(body) {
    const s = await api("/api/admin/stats");
    const cards = [["visitors", s.visits, "dashboard"], ["users", s.users, "users"], ["items", s.items, "items"], ["slides", s.slides, "hero"],
      ["sections", s.sections, "sections"], ["feedback", s.feedback, "feedback"], ["donors", s.donors, "donors"], ["donations", `₹${s.donations}`, "donors"]];
    body.innerHTML = `<div class="dash-grid">${cards.map(([k, v, tab]) => `<div class="dash-card glass tilt" data-tab="${tab}" style="cursor:pointer"><b>${esc(v)}</b><span>${esc(w(k))}</span></div>`).join("")}</div>
      <div class="a-form glass"><h3>👁 ${esc(w("visitor_control"))}: <span id="vCount">${s.visits}</span></h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${[-10, -1, 1, 10].map((d) => `<button class="btn btn-ghost btn-sm" data-vd="${d}">${d > 0 ? "+" : "−"}${Math.abs(d)}</button>`).join("")}
      <input class="input" id="vSet" type="number" min="0" style="max-width:180px" placeholder="${esc(w("set"))}"><button class="btn btn-primary btn-sm" id="vSetBtn">${esc(w("set"))}</button></div></div>`;
    P.bindTilt(body);
    const setV = async (n) => { const r = await api("/api/admin/visits", { method: "PUT", body: { visits: Math.max(0, n) } }); $("#vCount").textContent = r.visits; P.S.data.stats.visits = r.visits; toast(`✓ ${w("saved")}`); };
    $$("[data-vd]", body).forEach((b) => { b.onclick = () => setV(Number($("#vCount").textContent) + Number(b.dataset.vd)); });
    $("#vSetBtn").onclick = () => { if ($("#vSet").value !== "") setV(Number($("#vSet").value)); };
  }

  // ---------- generic list tabs ----------
  const PK = { sections: "key" };
  const REORDER = new Set(["slides", "items", "helplines", "contacts"]);
  function rowsOf(entity) {
    let rows = A.data[entity] || [];
    if (entity === "items" && A.itemFilter) rows = rows.filter((r) => r.section_key === A.itemFilter);
    return rows;
  }
  function rowTitle(entity, r) {
    if (entity === "contacts") return L(r, "name");
    return L(r, "title") || `#${r.id}`;
  }
  function rowSub(entity, r) {
    if (entity === "slides") return r.link_url || "—";
    if (entity === "sections") return `${r.key} · ${L(r, "subtitle")}`;
    if (entity === "items") { const s = A.data.sections.find((x) => x.key === r.section_key); return `${s ? L(s, "title") : r.section_key} · ${r.link_url}`; }
    if (entity === "helplines") return (r.numbers || []).map((n) => n.number).join(", ");
    if (entity === "contacts") return `${L(r, "role")} · ${r.phone} ${r.email}`;
    return "";
  }
  function thumb(entity, r) {
    const img = safeUrl(r.image || r.photo);
    return `<div class="thumb">${img ? `<img src="${esc(img)}" alt="">` : esc(r.icon || "✨")}</div>`;
  }

  function listTab(entity) {
    const body = $("#aBody");
    const fields = FIELDS[entity];
    const editing = A.editing && A.editing.entity === entity ? A.editing.row : null;
    const values = editing || { ...(DEFAULTS[entity] || {}), ...(entity === "items" && A.itemFilter ? { section_key: A.itemFilter } : {}) };
    const formFields = editing && entity === "sections" ? fields.filter((f) => f[0] !== "key") : fields;
    const heading = entity === "slides" ? (editing ? w("edit_hero") : w("add_hero")) : `${editing ? w("edit") : w("add")} — ${w(entity === "slides" ? "hero" : entity)}`;
    const rows = rowsOf(entity);
    body.innerHTML = `
      ${entity === "helplines" ? `<div class="a-form glass"><h3>⚙ ${esc(w("page_settings"))}</h3>${formHTML(FIELDS.helplines_page, A.data.settings.helplines_page || {}, "hpForm")}<div style="margin-top:12px"><button class="btn btn-primary" id="hpSave">💾 ${esc(w("save"))}</button></div></div>` : ""}
      <div class="a-form glass" id="entityFormWrap"><h3>${editing ? "✏️" : "➕"} ${esc(heading)}</h3>
        ${entity === "slides" ? `<p class="hint">${esc(w("hero_hint"))}</p>` : ""}${entity === "sections" ? `<p class="hint">${esc(w("cfg_section_yt"))} ${esc(w("kind_videos_hint"))}</p>` : ""}
        ${formHTML(formFields, values, "entityForm")}
        <div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-primary" id="entitySave">💾 ${esc(editing ? w("update") : w("add"))}</button>${editing ? `<button class="btn btn-ghost" id="entityCancel">${esc(w("cancel"))}</button>` : ""}</div></div>
      ${entity === "items" ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"><button class="btn btn-sm ${A.itemFilter ? "btn-ghost" : "btn-primary"}" data-filter="">${esc(w("all"))} (${A.data.items.length})</button>${A.data.sections.map((s) => `<button class="btn btn-sm ${A.itemFilter === s.key ? "btn-primary" : "btn-ghost"}" data-filter="${esc(s.key)}">${esc(s.icon)} ${esc(L(s, "title"))} (${A.data.items.filter((i) => i.section_key === s.key).length})</button>`).join("")}</div>` : ""}
      <div class="a-list">${rows.length ? rows.map((r, i) => `<div class="a-row glass" data-id="${esc(r[PK[entity] || "id"])}">${thumb(entity, r)}
        <div style="min-width:0"><b>${esc(rowTitle(entity, r))}</b><small>${esc(rowSub(entity, r))}</small><div class="tags">
          ${entity === "slides" ? `<span class="tag">${esc(w(r.position))}</span><span class="tag">${esc(w(r.fit))}</span>` : ""}
          ${r.badge ? `<span class="tag">${esc(w(r.badge))}</span>` : ""}${r.kind ? `<span class="tag">${esc(w(r.kind))}</span>` : ""}
          ${safeUrl(r.youtube_url) ? `<span class="tag yt">▶ ${esc(w("has_yt"))}</span>` : ""}${r.active === false ? `<span class="tag off">${esc(w("hidden"))}</span>` : ""}</div></div>
        <div class="ops">${REORDER.has(entity) ? `<button class="btn btn-ghost btn-sm" data-move="-1" ${i === 0 ? "disabled" : ""} title="${esc(w("up"))}">▲</button><button class="btn btn-ghost btn-sm" data-move="1" ${i === rows.length - 1 ? "disabled" : ""} title="${esc(w("down"))}">▼</button>` : ""}
          <button class="btn btn-ghost btn-sm" data-edit>✏️ ${esc(w("edit"))}</button><button class="btn btn-danger btn-sm" data-del>🗑 ${esc(w("del"))}</button></div></div>`).join("") : `<div class="empty glass">${esc(w("no_data"))}</div>`}</div>`;

    const form = $("#entityForm");
    bindForm(form);
    const base = `/api/admin/${entity}`;
    $("#entitySave").onclick = async () => {
      const data = readForm(form, formFields);
      try {
        if (editing) await api(`${base}/${encodeURIComponent(editing[PK[entity] || "id"])}`, { method: "PUT", body: data });
        else {
          if (REORDER.has(entity)) data.sort_order = (A.data[entity] || []).length;
          await api(base, { method: "POST", body: data });
        }
        A.editing = null;
        toast(`✓ ${w("saved")}`);
        await refreshAll();
      } catch (err) { toast(err.message, "err"); }
    };
    const cancel = $("#entityCancel");
    if (cancel) cancel.onclick = () => { A.editing = null; renderTab(); };
    if (entity === "helplines") {
      const hp = $("#hpForm"); bindForm(hp);
      $("#hpSave").onclick = () => saveSetting("helplines_page", readForm(hp, FIELDS.helplines_page));
    }
    $$("[data-filter]", body).forEach((b) => { b.onclick = () => { A.itemFilter = b.dataset.filter; renderTab(); }; });
    $$(".a-row", body).forEach((rowEl) => {
      const id = rowEl.dataset.id;
      const row = rows.find((r) => String(r[PK[entity] || "id"]) === id);
      $("[data-edit]", rowEl).onclick = () => { A.editing = { entity, row }; renderTab(); $("#entityFormWrap").scrollIntoView({ behavior: "smooth" }); };
      $("[data-del]", rowEl).onclick = async () => {
        if (!confirm(w("confirm_del"))) return;
        try { await api(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" }); toast(`✓ ${w("deleted")}`); if (A.editing && A.editing.row === row) A.editing = null; await refreshAll(); } catch (err) { toast(err.message, "err"); }
      };
      $$("[data-move]", rowEl).forEach((b) => {
        b.onclick = async () => {
          const ids = rows.map((r) => r.id);
          const i = ids.indexOf(row.id), j = i + Number(b.dataset.move);
          if (j < 0 || j >= ids.length) return;
          [ids[i], ids[j]] = [ids[j], ids[i]];
          try { await api(`/api/admin/reorder/${entity}`, { method: "POST", body: { ids } }); await refreshAll(); } catch (err) { toast(err.message, "err"); }
        };
      });
    });
  }

  // ---------- settings ----------
  async function saveSetting(key, data) {
    try { await api(`/api/admin/settings/${key}`, { method: "PUT", body: data }); toast(`✓ ${w("saved")}`); await refreshAll(); } catch (err) { toast(err.message, "err"); }
  }
  function settingsTab(keys) {
    const body = $("#aBody");
    body.innerHTML = keys.map((k) => `<div class="a-form glass"><h3>${esc(w(k))}</h3>${formHTML(FIELDS[k], A.data.settings[k] || {}, `set_${k}`)}
      <div style="margin-top:14px"><button class="btn btn-primary" data-save="${k}">💾 ${esc(w("save"))}</button></div></div>`).join("");
    keys.forEach((k) => bindForm($(`#set_${k}`)));
    $$("[data-save]", body).forEach((b) => { b.onclick = () => saveSetting(b.dataset.save, readForm($(`#set_${b.dataset.save}`), FIELDS[b.dataset.save])); });
  }

  // ---------- users / feedback / donors ----------
  async function users(body, q = "") {
    const list = await api(`/api/admin/users?q=${encodeURIComponent(q)}`);
    body.innerHTML = `<div class="search-wrap sm" style="margin-bottom:14px"><input class="search sm" id="uSearch" value="${esc(q)}" placeholder="${esc(w("search"))}"></div>
      <div class="a-form glass" style="overflow:auto"><h3>${esc(w("total"))}: ${list.length}</h3><table class="table"><thead><tr><th>ID</th><th>${esc(w("name"))}</th><th>${esc(w("mobile"))}</th><th>${esc(w("email"))}</th><th>${esc(w("joined"))}</th><th></th></tr></thead>
      <tbody>${list.map((u) => `<tr data-uid="${u.id}"><td><b>${esc(u.code)}</b></td><td>${esc(u.name)}<div class="hint">${esc(u.father || "")}</div></td><td>${esc(u.mobile)}</td><td>${esc(u.email)}</td><td>${esc((u.created_at || "").slice(0, 10))}</td>
      <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-reset>🔑 ${esc(w("reset_pw"))}</button> <button class="btn btn-danger btn-sm" data-udel>🗑</button></td></tr>`).join("") || `<tr><td colspan="6">${esc(w("no_data"))}</td></tr>`}</tbody></table></div>`;
    let timer;
    $("#uSearch").oninput = (e) => { clearTimeout(timer); timer = setTimeout(() => users(body, e.target.value).then(() => { const s = $("#uSearch"); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }), 300); };
    $$("tr[data-uid]", body).forEach((tr) => {
      const id = tr.dataset.uid;
      $("[data-udel]", tr).onclick = async () => { if (!confirm(w("confirm_del"))) return; try { await api(`/api/admin/users/${id}`, { method: "DELETE" }); toast(`✓ ${w("deleted")}`); users(body, q); } catch (err) { toast(err.message, "err"); } };
      $("[data-reset]", tr).onclick = async () => {
        const pw = prompt(w("new_pw"));
        if (!pw) return;
        try { await api(`/api/admin/users/${id}/password`, { method: "PUT", body: { password: pw } }); toast(`✓ ${w("saved")}`); } catch (err) { toast(err.message, "err"); }
      };
    });
  }
  async function feedback(body) {
    const list = await api("/api/admin/feedback");
    body.innerHTML = `<div class="a-list">${list.map((f) => `<div class="a-row glass" data-fid="${f.id}" style="grid-template-columns:1fr auto"><div><b>${esc(f.kind)} · <span style="color:var(--gold)">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</span></b>
      <div style="margin:4px 0;white-space:pre-wrap">${esc(f.message)}</div><small>${esc(f.name)} · ${esc(f.created_at)}</small></div><div class="ops"><button class="btn btn-danger btn-sm" data-fdel>🗑 ${esc(w("del"))}</button></div></div>`).join("") || `<div class="empty glass">${esc(w("no_data"))}</div>`}</div>`;
    $$("[data-fid]", body).forEach((el) => { $("[data-fdel]", el).onclick = async () => { if (!confirm(w("confirm_del"))) return; await api(`/api/admin/feedback/${el.dataset.fid}`, { method: "DELETE" }); feedback(body); }; });
  }
  async function donors(body) {
    const list = await api("/api/admin/donors");
    const total = list.reduce((s, d) => s + Number(d.amount || 0), 0);
    body.innerHTML = `<div class="a-form glass" style="overflow:auto"><h3>${esc(w("donations"))}: ₹${total.toLocaleString("en-IN")} · ${list.length}</h3><table class="table"><thead><tr><th>${esc(w("name"))}</th><th>${esc(w("mobile"))}</th><th>${esc(w("amount"))}</th><th>${esc(w("note"))}</th><th>${esc(w("date"))}</th><th></th></tr></thead>
      <tbody>${list.map((d) => `<tr data-did="${d.id}"><td>${esc(d.name)}</td><td>${esc(d.mobile)}</td><td><b>₹${esc(d.amount)}</b></td><td>${esc(d.note)}</td><td>${esc(d.created_at)}</td><td><button class="btn btn-danger btn-sm" data-ddel>🗑</button></td></tr>`).join("") || `<tr><td colspan="6">${esc(w("no_data"))}</td></tr>`}</tbody></table></div>`;
    $$("tr[data-did]", body).forEach((tr) => { $("[data-ddel]", tr).onclick = async () => { if (!confirm(w("confirm_del"))) return; await api(`/api/admin/donors/${tr.dataset.did}`, { method: "DELETE" }); donors(body); }; });
  }

  window.Admin = { open, logout };
})();

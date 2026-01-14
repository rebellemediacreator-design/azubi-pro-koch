
// ---------------- Global Click Delegation (Buttons ALWAYS work) ----------------
const __tabMap = {
  "start":"start",
  "kalender":"kalender",
  "tag":"tag",
  "woche":"woche",
  "monat":"monat",
  "notizen":"notizen",
  "wissen":"wissen",
  "glossar":"glossar",
  "quiz":"quiz",
  "prüfung":"pruefung",
  "pruefung":"pruefung",
  "einträge":"eintraege",
  "eintraege":"eintraege",
  "info":"info"
};

function __normalizeTab(raw){
  const t = String(raw||"").trim().toLowerCase();
  return __tabMap[t] || t;
}

document.addEventListener("click", (e)=>{
  // Tabs (top navigation)
  const tabBtn = e.target.closest("button.tab, .tab button, button[data-tab], [data-tab].tab");
  if(tabBtn){
    const dt = tabBtn.getAttribute("data-tab") || tabBtn.dataset?.tab || tabBtn.textContent;
    const tab = __normalizeTab(dt);
    if(typeof setTab === "function"){
      e.preventDefault();
      setTab(tab);
      window.scrollTo({top:0, behavior:"smooth"});
      return;
    }
  }

  // Lehrjahr buttons
  const yBtn = e.target.closest("button.yearBtn, [data-year].yearBtn, button[data-year]");
  if(yBtn){
    const y = yBtn.getAttribute("data-year") || yBtn.dataset?.year || yBtn.textContent;
    if(typeof setYear === "function"){
      e.preventDefault();
      setYear(String(y).replace(/\D+/g,"") || "1");
      return;
    }
  }

  // "Zum Glossar" (fast access)
  const openG = e.target.closest("#btnOpenGlossar, [data-action='openGlossar']");
  if(openG){
    if(typeof setTab === "function"){
      e.preventDefault();
      setTab("glossar");
      window.scrollTo({top:0, behavior:"smooth"});
      return;
    }
  }

  // Glossary A–Z bar
  const az = e.target.closest(".azBtn");
  if(az){
    const L = az.textContent.trim();
    const target = document.querySelector(`[data-letter-anchor="${CSS.escape(L)}"]`);
    if(target){
      e.preventDefault();
      target.scrollIntoView({behavior:"smooth", block:"start"});
      return;
    }
  }

  // Glossary item click (delegated)
  const gBtn = e.target.closest(".glossarItemBtn");
  if(gBtn){
    const term = gBtn.getAttribute("data-term") || gBtn.textContent.trim();
    const all = (window.__GLOSSARY_VIEW__ || []);
    const item = all.find(it => (it.term||"") === term) || null;
    const side = document.getElementById("glossarySidebar");
    if(side) side.querySelectorAll(".glossarItemBtn.is-active").forEach(x=>x.classList.remove("is-active"));
    gBtn.classList.add("is-active");
    if(item && typeof showGlossaryItem === "function"){
      e.preventDefault();
      store.glossarSelected = item.term;
      if(typeof saveStore === "function") saveStore();
      showGlossaryItem(item);
      return;
    }
  }

  // Begriff → Glossar-Notizen
  const toNotes = e.target.closest("#btnToGlossarNotes");
  if(toNotes){
    e.preventDefault();
    const term = (store && store.glossarSelected) ? store.glossarSelected : "";
    if(!term) return;
    const def = (window.__GLOSSARY_VIEW__||[]).find(it => (it.term||"")===term);
    const insert = `• ${term} – ${def && def.definition ? def.definition : ""}\n  Mein Beispiel: `;
    const ta = document.querySelector(
      'textarea[name="glossarNotes"], textarea#glossarNotes, textarea[data-field="glossarNotes"], textarea[placeholder*="Begriff("], textarea[placeholder*="Begriff(e)"]'
    );
    if(ta){
      if(!ta.value.includes(term)) ta.value = (ta.value ? ta.value.trimEnd()+"\n\n" : "") + insert;
      ta.focus();
      try{ store.glossarNotes = ta.value; if(typeof saveStore === "function") saveStore(); }catch(_){}
      if(typeof setTab === "function") setTab("start");
    }else{
      navigator.clipboard?.writeText(insert).catch(()=>{});
      alert("Notizfeld nicht gefunden. Text wurde in die Zwischenablage kopiert.");
    }
    return;
  }

}, true);
// -----------------------------------------------------------------------------


/* app.js – Azubi Tagebuch Küche
   Fix: komplette UI-Verkabelung (Tabs, Lehrjahr, Storage, Export/Import)
   + Glossar Render + Quiz/Prüfung auf Basis Glossar-Pool (window.AZUBI_GLOSSARY_PRO)
*/
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));


  // Header shrink on scroll (only height/spacing, no redesign)
  const __applyHeaderShrink = () => {
    const topbar = document.querySelector(".topbar");
    const __syncTopbarH = () => {
      if(!topbar) return;
      const h = topbar.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--topbarH', h + 'px');
    };
    const __setTopbarH = () => {
      const h = topbar.getBoundingClientRect().height || 0;
      document.documentElement.style.setProperty('--topbarH', h + 'px');
    };
    if(!topbar) return;
    // Ensure CSS exists even if inline fallback is active
    if(!document.getElementById("hdrShrinkStyles")){
      const st = document.createElement("style");
      st.id = "hdrShrinkStyles";
      st.textContent = ".topbar.is-scrolled .brand{padding:8px 16px 6px;}\n" +
                     ".topbar.is-scrolled .topbar__row{padding:0 16px 8px;}\n" +
                     ".topbar.is-scrolled .topbar__actions{padding:0 16px 10px;}";
      document.head.appendChild(st);
    }
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      topbar.classList.toggle("is-scrolled", y > 8);
      __setTopbarH();
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    window.addEventListener("resize", __setTopbarH, {passive:true});
    onScroll();
    __syncTopbarH();
  };
  // Defer one tick to ensure DOM exists (defer scripts still run before styles sometimes)
  setTimeout(__applyHeaderShrink, 0);

const STORE_KEY = "azubi_tagebuch_v3";

  const safeJSON = {
    parse(txt, fallback=null){
      try { return JSON.parse(txt); } catch(e){ return fallback; }
    },
    stringify(obj){
      try { return JSON.stringify(obj, null, 2); } catch(e){ return "{}"; }
    }
  };

  const nowISO = () => new Date().toISOString();

  const defaultStore = () => ({
    version: 3,
    updatedAt: nowISO(),
    yearActive: "1",
    years: {
      "1": { quick:{}, day:{}, week:{}, month:{}, notebook:{} },
      "2": { quick:{}, day:{}, week:{}, month:{}, notebook:{} },
      "3": { quick:{}, day:{}, week:{}, month:{}, notebook:{} }
    }
  });

  const loadStore = () => {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = safeJSON.parse(raw, null);
    if (!parsed || !parsed.years) return defaultStore();
    // minimal migration safety
    const base = defaultStore();
    const merged = { ...base, ...parsed };
    merged.years = { ...base.years, ...(parsed.years || {}) };
    for (const y of ["1","2","3"]) {
      merged.years[y] = { ...base.years[y], ...(merged.years[y] || {}) };
      merged.years[y].quick = { ...(merged.years[y].quick || {}) };
      merged.years[y].day = { ...(merged.years[y].day || {}) };
      merged.years[y].week = { ...(merged.years[y].week || {}) };
      merged.years[y].month = { ...(merged.years[y].month || {}) };
      merged.years[y].notebook = { ...(merged.years[y].notebook || {}) };
    }
    return merged;
  };

  const saveStore = (s) => {
    s.updatedAt = nowISO();
    localStorage.setItem(STORE_KEY, safeJSON.stringify(s));
  };

  let store = loadStore();

  // ---------- Basics: Tabs ----------
  const tabsNav = $(".tabs");
  const panels = $$("section.panel");
  const setTab = (tabName) => {
    $$(".tab", tabsNav).forEach(b => b.classList.toggle("is-active", b.dataset.tab === tabName));
    panels.forEach(p => p.classList.toggle("is-active", p.id === `panel-${tabName}`));
    if(tabName === 'glossar'){ ensureGlossaryLayout(); renderGlossary(); }

    // optional: focus
    const activePanel = $(`#panel-${tabName}`);
    if (activePanel) activePanel.scrollTop = 0;
  };

// ---------------- Glossar (Sidebar + kumulativ nach Lehrjahr) ----------------
const getGlossaryItems = () => {
  const g = window.AZUBI_GLOSSARY_PRO;
  if(!g || !Array.isArray(g.items)) return [];
  return g.items.map(it => ({
    term: it.term || it.title || "",
    definition: it.definition || "",
    praxis: it.praxis || "",
    merksatz: it.merksatz || "",
    fehler: it.fehler || "",
    years: Array.isArray(it.years) ? it.years.map(Number) : []
  }));
};

const allowedYearsUpTo = (year) => {
  const y = Number(year || 1);
  return [1,2,3].filter(n => n <= y);
};

const renderAZBar = (letters) => {
  const az = document.getElementById('glossaryAZ');
  if(!az) return;
  az.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(const L of letters){
    const b = document.createElement('button');
    b.type='button';
    b.className='azBtn';
    b.textContent=L;
    b.addEventListener('click', (e)=>{
      e.preventDefault();
      const target = document.querySelector(`[data-letter-anchor="${CSS.escape(L)}"]`);
      if(target){
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
    frag.appendChild(b);
  }
  az.appendChild(frag);
};



const escapeHtml = (s) => String(s ?? "")
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;").replaceAll("'","&#039;");

const showGlossaryItem = (item) => {
  const detail = document.getElementById("glossaryDetail");
  if(!detail) return;
  if(!item){
    detail.innerHTML = '<div class="glossarEmpty">Wähle links einen Begriff.</div>';
    return;
  }
  const years = (item.years||[]).map(String).join(", ");
  const blocks = [
    item.definition ? `<div class="glossarBlock"><div class="glossarBlockTitle">Definition</div><div class="glossarDef">${escapeHtml(item.definition)}</div></div>` : "",
    item.praxis ? `<div class="glossarBlock"><div class="glossarBlockTitle">Praxis</div><div class="glossarDef">${escapeHtml(item.praxis)}</div></div>` : "",
    item.merksatz ? `<div class="glossarBlock"><div class="glossarBlockTitle">Merksatz</div><div class="glossarDef">${escapeHtml(item.merksatz)}</div></div>` : "",
    item.fehler ? `<div class="glossarBlock"><div class="glossarBlockTitle">Typische Fehler</div><div class="glossarDef">${escapeHtml(item.fehler)}</div></div>` : "",
  ].join("");
  detail.innerHTML = `
    <h3 class="glossarTerm">${escapeHtml(item.term)}</h3>
    <p class="glossarMeta">Lehrjahr: ${escapeHtml(years || "—")}</p>
    ${blocks || '<div class="glossarEmpty">Keine Details hinterlegt.</div>'}
  `;
};

const renderGlossary = () => {
  const side = document.getElementById("glossarySidebar");
  const search = document.getElementById("glossarySearch");
  const year = (store && store.year) ? store.year : 1;

  const all = getGlossaryItems();
  const allowed = allowedYearsUpTo(year);

  let view = all.filter(it => (it.years||[]).some(y => allowed.includes(Number(y))));
  // Suche
  const q = (search?.value || "").trim().toLowerCase();
  if(q){
    view = view.filter(it =>
      (it.term||"").toLowerCase().includes(q) ||
      (it.definition||"").toLowerCase().includes(q)
    );
  }
  // Sort
  view.sort((a,b)=> (a.term||"").localeCompare((b.term||""), "de", {sensitivity:"base"}));

  window.__GLOSSARY_VIEW__ = view;

  if(!side) return;

  // groups A-Z
  const groups = new Map();
  for(const it of view){
    const t=(it.term||"").trim();
    const L=(t[0]||"#").toUpperCase();
    if(!groups.has(L)) groups.set(L, []);
    groups.get(L).push(it);
  }
  const letters = Array.from(groups.keys()).sort((a,b)=>a.localeCompare(b,"de"));
  side.innerHTML = "";
  try{ renderAZBar(letters); }catch(e){}

  let firstItem = null;
  for(const L of letters){
    const wrap = document.createElement("div");
    wrap.className = "glossarAGroup";
    wrap.innerHTML = `<div class="glossarALetter" data-letter-anchor="${L}">${L}</div>`;
    for(const it of groups.get(L)){
      if(!firstItem) firstItem = it;
      const btn = document.createElement("button");
      btn.type="button";
      btn.className="glossarItemBtn";
      btn.textContent = it.term;
      btn.setAttribute('data-term', it.term);
      btn.addEventListener("click", ()=>{
        side.querySelectorAll(".glossarItemBtn.is-active").forEach(x=>x.classList.remove("is-active"));
        btn.classList.add("is-active");
        store.glossarSelected = it.term;
        saveStore();
        showGlossaryItem(it);
      });
      wrap.appendChild(btn);
    }
    side.appendChild(wrap);
  }

  // Auto-select previous or first
  const sel = store.glossarSelected;
  const found = sel ? view.find(it => it.term === sel) : null;
  const pick = found || firstItem || null;
  showGlossaryItem(pick);

  if(pick){
    // mark active in list
    const btns = side.querySelectorAll(".glossarItemBtn");
    for(const b of btns){
      if(b.textContent === pick.term){ b.classList.add("is-active"); break; }
    }
  }else{
    showGlossaryItem(null);
  }
};

// Ensure glossary sidebar markup exists (failsafe)
const ensureGlossaryLayout = () => {
  const panel = document.getElementById("panel-glossar");
  if(!panel) return;
  if(panel.querySelector("#glossarySidebar") && panel.querySelector("#glossaryDetail")) return;

  const host = document.createElement("div");
  host.className = "glossarLayout";
  host.innerHTML = `
    <aside class="glossarSide" aria-label="Glossar Inhaltsverzeichnis">
      <div class="glossarSideTop">
        <div class="glossarSideTitle">Glossar</div>
        <div class="glossarSideHint">A–Z · kumulativ nach Lehrjahr</div>
        <div id="glossaryAZ" class="glossarAZ"></div>
      </div>
      <div class="glossarSearchWrap">
        <input id="glossarySearch" class="input" placeholder="Begriff suchen…" />
        <button id="btnGlossarySearch" class="btn" type="button">Suchen</button>
      </div>
      <div id="glossarySidebar" class="glossarSideList"></div>
    </aside>
    <div class="glossarMain" aria-label="Begriff">
      <div id="glossaryDetail" class="glossarDetail">
        <div class="glossarEmpty">Wähle links einen Begriff.</div>
      </div>
      <div class="glossarDetailActions">
        <button id="btnToGlossarNotes" class="btn" type="button">Begriff → Glossar-Notizen</button>
      </div>
    </div>
  `;
  // clear panel body (keep header if exists)
  const header = panel.querySelector(".panel__header");
  panel.innerHTML = "";
  if(header) panel.appendChild(header);
  panel.appendChild(host);
};

// Wire "Zum Glossar" button robustly (even if something stops propagation)
const wireOpenGlossar = () => {
  const btn = document.getElementById("btnOpenGlossar");
  if(!btn) return;
  btn.addEventListener("click", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    if(typeof setTab === "function") setTab("glossar");
    window.scrollTo({top:0, behavior:"smooth"});
  }, true);
};
// --------------------------------------------------------------------------



  if (tabsNav) {
    tabsNav.addEventListener("click", (e) => {
      const btn = e.target.closest("button.tab");
      if (!btn) return;
      setTab(btn.dataset.tab);
    });
  }

  // ---------- Lehrjahr ----------
  const header = $(".topbar");
  const yearBtns = header ? $$(".yearBtn", header) : [];
  const setYear = (y) => {
    store.yearActive = String(y);
    saveStore(store);
    yearBtns.forEach(b => b.classList.toggle("is-active", b.dataset.year === String(y)));
    // sync filters
    const gf = $("#glossarYearFilter");
    if (gf) gf.value = String(y);
    // stats
    updateStats();
    // refresh forms
    hydrateQuick();
    hydrateNotebook();
    hydrateDayFromDate();
    hydrateWeek();
    hydrateMonth();
    renderGlossar();
    quiz.reset(false);
    exam.reset(false);
  };

  if (yearBtns.length) {
    yearBtns.forEach(b => b.addEventListener("click", () => setYear(b.dataset.year)));
  }
  // apply stored year
  setYear(store.yearActive || "1");

  // ---------- Stats ----------
  const statDays = $("#statDays");
  const statWeeks = $("#statWeeks");
  const statMonths = $("#statMonths");

  const updateStats = () => {
    const y = store.yearActive;
    const yd = store.years[y] || {};
    const d = Object.keys(yd.day || {}).length;
    const w = Object.keys(yd.week || {}).length;
    const m = Object.keys(yd.month || {}).length;
    if (statDays) statDays.textContent = String(d);
    if (statWeeks) statWeeks.textContent = String(w);
    if (statMonths) statMonths.textContent = String(m);
  };

  // ---------- Helpers: form bind ----------
  const val = (el) => {
    if (!el) return "";
    if (el.type === "checkbox") return !!el.checked;
    return el.value ?? "";
  };
  const setVal = (el, v) => {
    if (!el) return;
    if (el.type === "checkbox") el.checked = !!v;
    else el.value = (v ?? "");
  };

  const yData = () => store.years[store.yearActive];

  // ---------- Quick (Start Panel) ----------
  const quick = {
    date: $("#quickDate"),
    notes: $("#quickNotes"),
    terms: $("#quickTerms"),
    gnotes: $("#quickGlossaryNotes"),
    btnSave: $("#btnSaveQuick"),
    btnToGlossar: $("#btnOpenGlossar"),
    btnReport: $("#btnExportReport"),
  };

  const hydrateQuick = () => {
    const q = yData().quick || {};
    setVal(quick.date, q.date || "");
    setVal(quick.notes, q.notes || "");
    setVal(quick.terms, q.terms || "");
    setVal(quick.gnotes, q.gnotes || "");
  };

  const saveQuick = () => {
    yData().quick = {
      date: val(quick.date),
      notes: val(quick.notes),
      terms: val(quick.terms),
      gnotes: val(quick.gnotes),
      savedAt: nowISO()
    };
    saveStore(store);
    updateStats();
    toast("Gespeichert.");
  };

  if (quick.btnSave) quick.btnSave.addEventListener("click", saveQuick);
  if (quick.btnToGlossar) quick.btnToGlossar.addEventListener("click", () => setTab("glossar"));
  if (quick.btnReport) quick.btnReport.addEventListener("click", () => {
    // Minimal: Export JSON als "Berichtsheft", echte PDF-Generierung kann später kommen.
    exportJSON("berichtsheft-export.json");
  });

  // ---------- Export / Import ----------
  const btnExport = $("#btnExport");
  const fileImport = $("#fileImport");

  const exportJSON = (filename="azubi-tagebuch-export.json") => {
    const blob = new Blob([safeJSON.stringify(store)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 600);
  };

  if (btnExport) btnExport.addEventListener("click", () => exportJSON());

  if (fileImport) {
    fileImport.addEventListener("change", async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const txt = await f.text();
      const imported = safeJSON.parse(txt, null);
      if (!imported || !imported.years) {
        toast("Import fehlgeschlagen: Datei ist kein gültiger Export.");
        return;
      }
      store = imported;
      // ensure basics exist
      const base = defaultStore();
      store = { ...base, ...store, years: { ...base.years, ...(store.years||{}) } };
      saveStore(store);
      setYear(store.yearActive || "1");
      toast("Import ok.");
      fileImport.value = "";
    });
  }

  // ---------- Day ----------
  const day = {
    date: $("#dayDate"),
    shift: $("#dayShift"),
    station: $("#dayStation"),
    task: $("#dayTask"),
    learningGoal: $("#dayLearningGoal"),
    learned: $("#dayLearned"),
    standard: $("#dayStandard"),
    stress: $("#dayStress"),
    wentWell: $("#dayWentWell"),
    toImprove: $("#dayToImprove"),
    free: $("#dayFreeNotes"),
    btnSave: $("#btnSaveDay"),
    btnClear: $("#btnClearDay"),
  };

  const dayKey = () => val(day.date) || "";

  const hydrateDayFromDate = () => {
    const k = dayKey();
    if (!k) return;
    const rec = (yData().day || {})[k] || {};
    setVal(day.shift, rec.shift || "");
    setVal(day.station, rec.station || "");
    setVal(day.task, rec.task || "");
    setVal(day.learningGoal, rec.learningGoal || "");
    setVal(day.learned, rec.learned || "");
    setVal(day.standard, rec.standard || "");
    setVal(day.stress, rec.stress ?? "0");
    setVal(day.wentWell, rec.wentWell || "");
    setVal(day.toImprove, rec.toImprove || "");
    setVal(day.free, rec.free || "");
  };

  const saveDay = () => {
    const k = dayKey();
    if (!k) { toast("Bitte Datum wählen."); return; }
    yData().day[k] = {
      date: k,
      shift: val(day.shift),
      station: val(day.station),
      task: val(day.task),
      learningGoal: val(day.learningGoal),
      learned: val(day.learned),
      standard: val(day.standard),
      stress: val(day.stress),
      wentWell: val(day.wentWell),
      toImprove: val(day.toImprove),
      free: val(day.free),
      savedAt: nowISO(),
    };
    saveStore(store);
    updateStats();
    toast("Tages-Eintrag gespeichert.");
  };

  const clearDay = () => {
    const k = dayKey();
    if (!k) return;
    if (!confirm("Tages-Eintrag wirklich leeren?")) return;
    delete yData().day[k];
    saveStore(store);
    hydrateDayFromDate();
    updateStats();
    toast("Gelöscht.");
  };

  if (day.date) day.date.addEventListener("change", hydrateDayFromDate);
  if (day.btnSave) day.btnSave.addEventListener("click", saveDay);
  if (day.btnClear) day.btnClear.addEventListener("click", clearDay);

  // ---------- Week ----------
  const week = {
    number: $("#weekNumber"),
    year: $("#weekYear"),
    skills: $("#weekSkills"),
    mistake: $("#weekMistake"),
    focus: $("#weekFocus"),
    notes: $("#weekNotes"),
    btnSave: $("#btnSaveWeek"),
    btnClear: $("#btnClearWeek"),
  };
  const weekKey = () => {
    const y = val(week.year);
    const n = val(week.number);
    if (!y || !n) return "";
    return `${y}-KW${String(n).padStart(2,"0")}`;
  };
  const hydrateWeek = () => {
    const k = weekKey();
    if (!k) return;
    const rec = (yData().week||{})[k] || {};
    setVal(week.skills, rec.skills || "");
    setVal(week.mistake, rec.mistake || "");
    setVal(week.focus, rec.focus || "");
    setVal(week.notes, rec.notes || "");
  };
  const saveWeek = () => {
    const k = weekKey();
    if (!k) { toast("Bitte Woche + Jahr setzen."); return; }
    yData().week[k] = {
      key: k,
      weekNumber: val(week.number),
      year: val(week.year),
      skills: val(week.skills),
      mistake: val(week.mistake),
      focus: val(week.focus),
      notes: val(week.notes),
      savedAt: nowISO(),
    };
    saveStore(store); updateStats(); toast("Wochencheck gespeichert.");
  };
  const clearWeek = () => {
    const k = weekKey(); if (!k) return;
    if (!confirm("Wochen-Eintrag wirklich leeren?")) return;
    delete yData().week[k]; saveStore(store); hydrateWeek(); updateStats(); toast("Gelöscht.");
  };
  [week.number, week.year].forEach(el => el && el.addEventListener("change", hydrateWeek));
  if (week.btnSave) week.btnSave.addEventListener("click", saveWeek);
  if (week.btnClear) week.btnClear.addEventListener("click", clearWeek);

  // ---------- Month ----------
  const month = {
    name: $("#monthName"),
    year: $("#monthYear"),
    progress: $("#monthProgress"),
    gap: $("#monthGap"),
    school: $("#monthSchool"),
    notes: $("#monthNotes"),
    btnSave: $("#btnSaveMonth"),
    btnClear: $("#btnClearMonth"),
  };
  const monthKey = () => {
    const y = val(month.year);
    const n = val(month.name);
    if (!y || !n) return "";
    return `${y}-${n}`;
  };
  const hydrateMonth = () => {
    const k = monthKey();
    if (!k) return;
    const rec = (yData().month||{})[k] || {};
    setVal(month.progress, rec.progress || "");
    setVal(month.gap, rec.gap || "");
    setVal(month.school, rec.school || "");
    setVal(month.notes, rec.notes || "");
  };
  const saveMonth = () => {
    const k = monthKey();
    if (!k) { toast("Bitte Monat + Jahr setzen."); return; }
    yData().month[k] = {
      key:k,
      month: val(month.name),
      year: val(month.year),
      progress: val(month.progress),
      gap: val(month.gap),
      school: val(month.school),
      notes: val(month.notes),
      savedAt: nowISO(),
    };
    saveStore(store); updateStats(); toast("Monatscheck gespeichert.");
  };
  const clearMonth = () => {
    const k = monthKey(); if (!k) return;
    if (!confirm("Monats-Eintrag wirklich leeren?")) return;
    delete yData().month[k]; saveStore(store); hydrateMonth(); updateStats(); toast("Gelöscht.");
  };
  [month.name, month.year].forEach(el => el && el.addEventListener("change", hydrateMonth));
  if (month.btnSave) month.btnSave.addEventListener("click", saveMonth);
  if (month.btnClear) month.btnClear.addEventListener("click", clearMonth);

  // ---------- Notebook ----------
  const nbFields = [
    "nbGoals","nbMeat","nbFish","nbVeg","nbSauces","nbBakery","nbHygiene","nbKnife",
    "nbStations","nbPlating","nbRecipes","nbServiceLessons"
  ];
  const hydrateNotebook = () => {
    const rec = yData().notebook || {};
    nbFields.forEach(id => setVal($("#"+id), rec[id] || ""));
  };
  const saveNotebook = () => {
    const rec = {};
    nbFields.forEach(id => rec[id] = val($("#"+id)));
    yData().notebook = { ...rec, savedAt: nowISO() };
    saveStore(store);
    toast("Notizbuch gespeichert.");
  };
  const btnSaveNotebook = $("#btnSaveNotebook");
  if (btnSaveNotebook) btnSaveNotebook.addEventListener("click", saveNotebook);

  // ---------- Glossar render ----------
  const glossar = {
    search: $("#glossarSearch"),
    yearFilter: $("#glossarYearFilter"),
    toc: $("#glossarToc"),
    list: $("#glossarList"),
    count: $("#glossarCount"),
    btnReset: $("#glossarReset"),
    btnPDF: $("#btnGlossarPDF"),
    btnCards: $("#btnFlashcardsPDF"),
  };

  const getGlossaryPool = () => {
    const g = window.AZUBI_GLOSSARY_PRO?.items || [];
    return g;
  };

  const renderGlossar = () => {
    if (!glossar.list || !glossar.toc) return;
    const q = (val(glossar.search)||"").trim().toLowerCase();
    const y = val(glossar.yearFilter) || store.yearActive || "1";
    const pool = getGlossaryPool();

    const filtered = pool.filter(it => {
      const years = it.years || [];
      const yearOK = (y === "all") ? true : years.includes(Number(y));
      if (!yearOK) return false;
      if (!q) return true;
      const hay = `${it.term} ${it.definition} ${it.category||""} ${it.merksatz||""} ${it.praxis||""}`.toLowerCase();
      return hay.includes(q);
    });

    if (glossar.count) glossar.count.textContent = `${filtered.length} Begriffe`;

    // TOC by first letter
    const groups = {};
    filtered.forEach(it => {
      const letter = (it.term || "?").trim().charAt(0).toUpperCase();
      (groups[letter] ||= []).push(it);
    });

    glossar.toc.innerHTML = Object.keys(groups).sort().map(L => (
      `<button type="button" class="chip" data-jump="${L}">${L}</button>`
    )).join("");

    glossar.list.innerHTML = Object.keys(groups).sort().map(L => {
      const items = groups[L].sort((a,b)=> (a.term||"").localeCompare(b.term||"", "de"));
      const rows = items.map(it => `
        <article class="card" data-term="${escapeHTML(it.term||"")}">
          <div class="card__top">
            <div class="card__title">${escapeHTML(it.term||"")}</div>
            <div class="pill">${escapeHTML((it.category||"").toString())}</div>
          </div>
          <div class="card__body">
            <div class="def">${escapeHTML(it.definition||"")}</div>
            ${it.merksatz ? `<div class="hint"><b>Merksatz:</b> ${escapeHTML(it.merksatz)}</div>` : ""}
            ${it.praxis ? `<div class="hint"><b>Praxis:</b> ${escapeHTML(it.praxis)}</div>` : ""}
            ${it.fehler ? `<div class="hint"><b>Fehler:</b> ${escapeHTML(it.fehler)}</div>` : ""}
          </div>
        </article>
      `).join("");
      return `<section class="group" id="G${L}">
        <h3 class="group__title">${L}</h3>
        <div class="group__grid">${rows}</div>
      </section>`;
    }).join("");

    // toc jump
    glossar.toc.onclick = (e) => {
      const b = e.target.closest("button[data-jump]");
      if (!b) return;
      const t = $("#G"+b.dataset.jump);
      if (t) t.scrollIntoView({behavior:"smooth", block:"start"});
    };
  };

  const escapeHTML = (s) => String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

  if (glossar.search) glossar.search.addEventListener("input", renderGlossar);

  // --- Glossar: optionaler "Suchen"-Button + Enter-Handling ---
  if (glossar.search && !document.getElementById("glossarSearchBtn")) {
    const wrap = glossar.search.closest(".field");
    if (wrap) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.id = "glossarSearchBtn";
      btn.textContent = "Suchen";
      btn.style.marginTop = "8px";
      wrap.appendChild(btn);
      }
    glossar.search.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); renderGlossar(); } });
  }

  if (glossar.yearFilter) glossar.yearFilter.addEventListener("change", () => { saveYearFilter(); renderGlossar(); });
  const saveYearFilter = () => {
    // User darf "Alle" wählen; wir merken das extra.
    const y = val(glossar.yearFilter);
    if (y) {
      store.glossarYearFilter = String(y);
      saveStore(store);
    }
    // Wenn nicht "Alle", koppeln wir Lehrjahr aktiv.
    if (y && y !== "all") setYear(y);
  };
  if (glossar.btnReset) glossar.btnReset.addEventListener("click", () => {
    if (glossar.search) glossar.search.value = "";
    if (glossar.yearFilter) glossar.yearFilter.value = store.yearActive;
    renderGlossar();
  });
  if (glossar.btnPDF) glossar.btnPDF.addEventListener("click", () => toast("PDF-Export kommt als nächster Schritt."));
  if (glossar.btnCards) glossar.btnCards.addEventListener("click", () => toast("Flashcards-PDF kommt als nächster Schritt."));


  // --- Glossar: Default an aktives Lehrjahr koppeln (statt "Alle") ---
  if (glossar.yearFilter) {
    const saved = store?.glossarYearFilter;
    if (saved) {
      glossar.yearFilter.value = saved;
    } else if (glossar.yearFilter.value === "all" && store?.yearActive) {
      glossar.yearFilter.value = String(store.yearActive);
    }
  }

  // initial render
  renderGlossar();

  // ---------- Quiz ----------
  const quiz = (() => {
    const els = {
      status: $("#quizStatusPill"),
      reset: $("#quizReset"),
      home: $("#quizHome"),
      year: $("#quizYear"),
      count: $("#quizCount"),
      start: $("#quizStart"),
      onlyWrong: $("#quizOnlyWrong"),
      run: $("#quizRun"),
      name: $("#quizName"),
      progress: $("#quizProgress"),
      score: $("#quizScore"),
      abort: $("#quizAbort"),
      meta: $("#quizQMeta"),
      text: $("#quizQText"),
      choices: $("#quizChoices"),
      feedback: $("#quizFeedback"),
      next: $("#quizNext"),
    };

    let pool = [];
    let deck = [];
    let i = 0;
    let score = 0;
    let wrong = [];

    const buildPool = (ySel) => {
      const g = getGlossaryPool();
      if (ySel === "all") return g.slice();
      const y = Number(ySel);
      return g.filter(it => (it.years||[]).includes(y));
    };

    const makeQuestion = (item) => {
      const correct = item.definition || "";
      const distract = pool
        .filter(x => x.term !== item.term && x.definition && x.definition !== correct)
        .sort(()=>Math.random()-0.5)
        .slice(0,3)
        .map(x => x.definition);

      const choices = [correct, ...distract].sort(()=>Math.random()-0.5);
      return { term: item.term, correct, choices };
    };

    const render = () => {
      const q = deck[i];
      if (!q) return finish();
      els.run?.classList.add("is-on");
      if (els.name) els.name.textContent = "Quiz";
      if (els.progress) els.progress.textContent = `${i+1}/${deck.length}`;
      if (els.score) els.score.textContent = `${score}`;
      if (els.meta) els.meta.textContent = "";
      if (els.text) els.text.textContent = q.term;
      if (els.feedback) els.feedback.textContent = "";
      if (els.choices) {
        els.choices.innerHTML = q.choices.map((c,idx)=>(
          `<button type="button" class="choice" data-ans="${escapeHTML(c)}">${escapeHTML(c)}</button>`
        )).join("");
      }
    };

    const answer = (ans) => {
      const q = deck[i];
      if (!q) return;
      const ok = ans === q.correct;
      if (ok) score += 1; else wrong.push(q);
      if (els.feedback) els.feedback.textContent = ok ? "✅ Richtig." : `❌ Falsch. Richtig: ${q.correct}`;
      // disable choices
      $$(".choice", els.choices).forEach(b => b.disabled = true);
    };

    const next = () => {
      i += 1;
      render();
    };

    const finish = () => {
      if (els.text) els.text.textContent = "Fertig.";
      if (els.choices) els.choices.innerHTML = "";
      if (els.feedback) els.feedback.textContent = `Score: ${score}/${deck.length}`;
      if (els.progress) els.progress.textContent = `${deck.length}/${deck.length}`;
    };

    const start = (onlyWrong=false) => {
      const ySel = val(els.year) || store.yearActive;
      pool = buildPool(ySel);
      const n = Number(val(els.count) || 20);

      const base = onlyWrong ? wrong : pool;
      wrong = [];

      deck = base
        .sort(()=>Math.random()-0.5)
        .slice(0, Math.min(n, base.length))
        .map(makeQuestion);

      i = 0; score = 0;
      render();
      if (els.status) els.status.textContent = "Läuft";
    };

    const reset = (toastIt=true) => {
      pool = []; deck = []; i = 0; score = 0; wrong = [];
      if (els.run) els.run.classList.remove("is-on");
      if (els.status) els.status.textContent = "Bereit";
      if (toastIt) toast("Quiz zurückgesetzt.");
    };

    if (els.start) els.start.addEventListener("click", () => start(false));
    if (els.onlyWrong) els.onlyWrong.addEventListener("click", () => start(true));
    if (els.next) els.next.addEventListener("click", next);
    if (els.abort) els.abort.addEventListener("click", reset);
    if (els.reset) els.reset.addEventListener("click", reset);
    if (els.home) els.home.addEventListener("click", () => { reset(false); setTab("start"); });

    if (els.choices) {
      els.choices.addEventListener("click", (e) => {
        const b = e.target.closest("button.choice");
        if (!b || b.disabled) return;
        answer(b.dataset.ans);
      });
    }

    return { start, reset };
  
// --- Emergency delegated wiring (works even if some handlers are missing) ---
document.addEventListener("click", (e)=>{
  const tabBtn = e.target.closest(".tab[data-tab]");
  if(tabBtn){
    e.preventDefault();
    try { setTab(tabBtn.dataset.tab); } catch(err){ console.error(err); }
  }
  const yearBtn = e.target.closest(".yearBtn[data-year]");
  if(yearBtn){
    e.preventDefault();
    try { setYear(yearBtn.dataset.year); } catch(err){ console.error(err); }
  }
}, true);
// --- END emergency ---

})();

  // ---------- Prüfung (Exam) ----------
  const exam = (() => {
    const els = {
      status: $("#examStatusPill"),
      reset: $("#examReset"),
      home: $("#examHome"),
      start1: $("#examStart1"),
      start2: $("#examStart2"),
      start3: $("#examStart3"),
      run: $("#examRun"),
      name: $("#examName"),
      progress: $("#examProgress"),
      timer: $("#examTimer"),
      abort: $("#examAbort"),
      meta: $("#examQMeta"),
      text: $("#examQText"),
      choices: $("#examChoices"),
      next: $("#examNext"),
      result: $("#examResult"),
      resultTitle: $("#examResultTitle"),
      resultMeta: $("#examResultMeta"),
      retryWrong: $("#examRetryWrong"),
      backHome: $("#examBackHome"),
      wrongList: $("#examWrongList"),
    };

    let pool = [];
    let deck = [];
    let i = 0;
    let score = 0;
    let wrong = [];
    let t0 = 0;
    let timerInt = null;

    const buildPool = (y) => getGlossaryPool().filter(it => (it.years||[]).includes(Number(y)));

    const makeQuestion = (item) => {
      const correct = item.definition || "";
      const distract = pool
        .filter(x => x.term !== item.term && x.definition && x.definition !== correct)
        .sort(()=>Math.random()-0.5)
        .slice(0,3)
        .map(x => x.definition);
      const choices = [correct, ...distract].sort(()=>Math.random()-0.5);
      return { term: item.term, correct, choices };
    };

    const tick = () => {
      const s = Math.max(0, Math.floor((Date.now()-t0)/1000));
      if (els.timer) els.timer.textContent = `${s}s`;
    };

    const render = () => {
      const q = deck[i];
      if (!q) return finish();
      if (els.run) els.run.classList.add("is-on");
      if (els.result) els.result.classList.remove("is-on");
      if (els.name) els.name.textContent = "Prüfung";
      if (els.progress) els.progress.textContent = `${i+1}/${deck.length}`;
      if (els.meta) els.meta.textContent = "";
      if (els.text) els.text.textContent = q.term;
      if (els.choices) {
        els.choices.innerHTML = q.choices.map(c => (
          `<button type="button" class="choice" data-ans="${escapeHTML(c)}">${escapeHTML(c)}</button>`
        )).join("");
      }
    };

    const answer = (ans) => {
      const q = deck[i]; if (!q) return;
      const ok = ans === q.correct;
      if (ok) score += 1; else wrong.push(q);
      // disable
      $$(".choice", els.choices).forEach(b => b.disabled = true);
    };

    const next = () => { i += 1; render(); };

    const finish = () => {
      clearInterval(timerInt); timerInt = null;
      if (els.run) els.run.classList.remove("is-on");
      if (els.result) els.result.classList.add("is-on");
      if (els.resultTitle) els.resultTitle.textContent = `Ergebnis: ${score}/${deck.length}`;
      if (els.resultMeta) els.resultMeta.textContent = `Fehler: ${wrong.length} · Zeit: ${els.timer?.textContent || "-"}`;
      if (els.wrongList) {
        els.wrongList.innerHTML = wrong.slice(0, 50).map(w => `<li><b>${escapeHTML(w.term)}</b> – ${escapeHTML(w.correct)}</li>`).join("");
      }
      if (els.status) els.status.textContent = "Fertig";
    };

    const start = (year, onlyWrong=false) => {
      pool = buildPool(year);
      const base = onlyWrong ? wrong : pool;
      if (!onlyWrong) wrong = [];
      deck = base.sort(()=>Math.random()-0.5).slice(0, Math.min(25, base.length)).map(makeQuestion);
      i = 0; score = 0;
      t0 = Date.now();
      clearInterval(timerInt);
      timerInt = setInterval(tick, 500);
      tick();
      render();
      if (els.status) els.status.textContent = "Läuft";
    };

    const reset = (toastIt=true) => {
      clearInterval(timerInt); timerInt = null;
      pool=[]; deck=[]; i=0; score=0; wrong=[];
      if (els.run) els.run.classList.remove("is-on");
      if (els.result) els.result.classList.remove("is-on");
      if (els.timer) els.timer.textContent = "0s";
      if (els.status) els.status.textContent = "Bereit";
      if (toastIt) toast("Prüfung zurückgesetzt.");
    };

    if (els.start1) els.start1.addEventListener("click", ()=> start(1,false));
    if (els.start2) els.start2.addEventListener("click", ()=> start(2,false));
    if (els.start3) els.start3.addEventListener("click", ()=> start(3,false));
    if (els.next) els.next.addEventListener("click", next);
    if (els.abort) els.abort.addEventListener("click", reset);
    if (els.reset) els.reset.addEventListener("click", reset);
    if (els.home) els.home.addEventListener("click", ()=> { reset(false); setTab("start"); });
    if (els.retryWrong) els.retryWrong.addEventListener("click", ()=> {
      if (!wrong.length) return toast("Keine Fehler vorhanden.");
      start(store.yearActive, true);
    });
    if (els.backHome) els.backHome.addEventListener("click", ()=> setTab("start"));

    if (els.choices) {
      els.choices.addEventListener("click", (e)=> {
        const b = e.target.closest("button.choice");
        if (!b || b.disabled) return;
        answer(b.dataset.ans);
      });
    }

    return { start, reset };
  
// --- Emergency delegated wiring (works even if some handlers are missing) ---
document.addEventListener("click", (e)=>{
  const tabBtn = e.target.closest(".tab[data-tab]");
  if(tabBtn){
    e.preventDefault();
    try { setTab(tabBtn.dataset.tab); } catch(err){ console.error(err); }
  }
  const yearBtn = e.target.closest(".yearBtn[data-year]");
  if(yearBtn){
    e.preventDefault();
    try { setYear(yearBtn.dataset.year); } catch(err){ console.error(err); }
  }
}, true);
// --- END emergency ---

})();

  // ---------- Delete buttons ----------
  const btnDeleteYear = $("#btnDeleteYear");
  const btnDeleteAll = $("#btnDeleteAll");
  if (btnDeleteYear) btnDeleteYear.addEventListener("click", () => {
    if (!confirm("Dieses Lehrjahr wirklich löschen?")) return;
    store.years[store.yearActive] = defaultStore().years[store.yearActive];
    saveStore(store);
    setYear(store.yearActive);
    toast("Lehrjahr gelöscht.");
  });
  if (btnDeleteAll) btnDeleteAll.addEventListener("click", () => {
    if (!confirm("ALLES wirklich löschen?")) return;
    store = defaultStore();
    saveStore(store);
    setYear("1");
    toast("Alles gelöscht.");
  });

  // ---------- Tiny toast ----------
  function toast(msg){
    let t = $("#__toast");
    if (!t){
      t = document.createElement("div");
      t.id="__toast";
      t.style.cssText="position:fixed;left:12px;bottom:12px;z-index:9999;padding:10px 12px;border-radius:12px;background:rgba(20,22,27,.92);color:#fff;font:14px/1.25 system-ui, -apple-system, Segoe UI, Roboto, Arial;box-shadow:0 10px 30px rgba(0,0,0,.2);max-width:min(520px, calc(100vw - 24px));";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity="1";
    clearTimeout(window.__toastTimer);
    window.__toastTimer=setTimeout(()=>{ t.style.opacity="0"; }, 1600);
  }

  // initial hydrations
  hydrateQuick();
  hydrateNotebook();
  if (day.date && !val(day.date)) {
    // set today by default for day entry
    const d = new Date(); 
    const iso = d.toISOString().slice(0,10);
    day.date.value = iso;
  }
  hydrateDayFromDate();
  hydrateWeek();
  hydrateMonth();
  updateStats();

// --- Emergency delegated wiring (works even if some handlers are missing) ---
document.addEventListener("click", (e)=>{
  const tabBtn = e.target.closest(".tab[data-tab]");
  if(tabBtn){
    e.preventDefault();
    try { setTab(tabBtn.dataset.tab); } catch(err){ console.error(err); }
  }
  const yearBtn = e.target.closest(".yearBtn[data-year]");
  if(yearBtn){
    e.preventDefault();
    try { setYear(yearBtn.dataset.year); } catch(err){ console.error(err); }
  }
}, true);
// --- END emergency ---

})();

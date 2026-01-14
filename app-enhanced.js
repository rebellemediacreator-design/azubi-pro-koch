// ============================================================================
// ENHANCED AZUBI APP - Alle Features implementiert
// ============================================================================

// ============================================================================
// 1. HEADER HIDE ON SCROLL DOWN, SHOW ON SCROLL UP
// ============================================================================
(() => {
  let lastScrollY = 0;
  let isHeaderVisible = true;
  let scrollTimeout = null;

  const header = document.querySelector(".topbar");
  const tabs = document.querySelector(".tabs");

  if (header) {
    window.addEventListener("scroll", () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      
      // Scroll nach unten -> Header verstecken
      if (currentScrollY > lastScrollY + 10) {
        if (isHeaderVisible) {
          header.classList.add("is-hidden");
          if (tabs) tabs.classList.add("is-hidden");
          isHeaderVisible = false;
        }
      }
      // Scroll nach oben -> Header zeigen
      else if (currentScrollY < lastScrollY - 10) {
        if (!isHeaderVisible) {
          header.classList.remove("is-hidden");
          if (tabs) tabs.classList.remove("is-hidden");
          isHeaderVisible = true;
        }
      }

      lastScrollY = currentScrollY;

      // Reset bei Scroll-Ende
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (currentScrollY === 0) {
          header.classList.remove("is-hidden");
          if (tabs) tabs.classList.remove("is-hidden");
          isHeaderVisible = true;
        }
      }, 150);
    }, { passive: true });
  }
})();

// ============================================================================
// 2. GLOBAL CLICK DELEGATION (Buttons ALWAYS work)
// ============================================================================
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

// ============================================================================
// 3. MAIN APP INITIALIZATION
// ============================================================================
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

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
  window.store = store;
  window.saveStore = saveStore;

  // ========================================================================
  // TABS & YEAR MANAGEMENT
  // ========================================================================
  const tabsNav = $(".tabs");
  const panels = $$("section.panel");
  
  const setTab = (tabName) => {
    $$(".tab", tabsNav).forEach(b => b.classList.toggle("is-active", b.dataset.tab === tabName));
    panels.forEach(p => p.classList.toggle("is-active", p.id === `panel-${tabName}`));
    
    if(tabName === 'glossar'){ 
      ensureGlossaryLayout(); 
      renderGlossary(); 
    }

    const activePanel = $(`#panel-${tabName}`);
    if (activePanel) activePanel.scrollTop = 0;
  };

  const setYear = (year) => {
    const y = String(year || "1").replace(/\D+/g, "") || "1";
    store.yearActive = y;
    saveStore(store);
    
    $$(".yearBtn").forEach(b => b.classList.toggle("is-active", b.dataset.year === y));
    
    // Update active tab content
    const activePanel = $(".panel.is-active");
    if(activePanel?.id === "panel-glossar") renderGlossary();
  };

  window.setTab = setTab;
  window.setYear = setYear;

  // ========================================================================
  // GLOSSAR - ENHANCED VERSION
  // ========================================================================
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

  const escapeHtml = (s) => String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

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
      frag.appendChild(b);
    }
    az.appendChild(frag);
  };

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
    const year = (store && store.yearActive) ? store.yearActive : "1";

    const all = getGlossaryItems();
    const allowed = allowedYearsUpTo(year);

    let view = all.filter(it => (it.years||[]).some(y => allowed.includes(Number(y))));
    
    // Suche
    const q = (search?.value || "").trim().toLowerCase();
    if(q){
      view = view.filter(it =>
        (it.term||"").toLowerCase().includes(q) ||
        (it.definition||"").toLowerCase().includes(q) ||
        (it.praxis||"").toLowerCase().includes(q) ||
        (it.merksatz||"").toLowerCase().includes(q)
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
          saveStore(store);
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
      const btns = side.querySelectorAll(".glossarItemBtn");
      for(const b of btns){
        if(b.textContent === pick.term){ b.classList.add("is-active"); break; }
      }
    }else{
      showGlossaryItem(null);
    }
  };

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
    
    const header = panel.querySelector(".panel__header");
    if(header && header.nextElementSibling){
      header.nextElementSibling.remove();
    }
    panel.appendChild(host);

    // Event listeners
    const search = document.getElementById("glossarySearch");
    if(search) search.addEventListener("input", renderGlossary);
    
    const searchBtn = document.getElementById("btnGlossarySearch");
    if(searchBtn) searchBtn.addEventListener("click", renderGlossary);
  };

  // ========================================================================
  // QUIZ - ENHANCED
  // ========================================================================
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

    const getGlossaryPool = () => {
      const g = window.AZUBI_GLOSSARY_PRO?.items || [];
      return g;
    };

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
      
      if (els.home) els.home.style.display = "none";
      if (els.run) els.run.style.display = "block";
      if (els.name) els.name.textContent = "Quiz";
      if (els.progress) els.progress.textContent = `${i+1}/${deck.length}`;
      if (els.score) els.score.textContent = `${Math.round(score*100/(i+1))}%`;
      if (els.meta) els.meta.textContent = "";
      if (els.text) els.text.textContent = q.term;
      if (els.feedback) {
        els.feedback.style.display = "none";
        els.feedback.textContent = "";
      }
      if (els.choices) {
        els.choices.innerHTML = q.choices.map((c,idx)=>(
          `<button type="button" class="choice" data-ans="${escapeHtml(c)}">${escapeHtml(c)}</button>`
        )).join("");
      }
      if (els.next) els.next.disabled = true;
    };

    const answer = (ans) => {
      const q = deck[i];
      if (!q) return;
      const ok = ans === q.correct;
      if (ok) score += 1; else wrong.push(q);
      if (els.feedback) {
        els.feedback.style.display = "block";
        els.feedback.textContent = ok ? "✅ Richtig." : `❌ Falsch. Richtig: ${q.correct}`;
      }
      $$(".choice", els.choices).forEach(b => b.disabled = true);
      if (els.next) els.next.disabled = false;
    };

    const next = () => {
      i += 1;
      render();
    };

    const finish = () => {
      if (els.text) els.text.textContent = "Fertig.";
      if (els.choices) els.choices.innerHTML = "";
      if (els.feedback) {
        els.feedback.style.display = "block";
        els.feedback.textContent = `Score: ${score}/${deck.length} (${Math.round(score*100/deck.length)}%)`;
      }
      if (els.progress) els.progress.textContent = `${deck.length}/${deck.length}`;
      if (els.next) els.next.disabled = true;
      
      // API-Integration: Quiz-Ergebnis an Ausbilder-App senden
      if (window.AzubiAPI) {
        const yearSelect = els.year?.value || 'all';
        const trainingYear = yearSelect === 'all' ? 1 : parseInt(yearSelect);
        
        window.AzubiAPI.sendQuizResult({
          trainingYear: trainingYear,
          questionCount: deck.length,
          correctAnswers: score,
          score: Math.round(score * 100 / deck.length),
          passed: score >= Math.ceil(deck.length * 0.7),
          duration: null,
        }).then(result => {
          if (result.success) {
            console.log('[Quiz] ✅ Ergebnis erfolgreich gesendet');
            // Toast wird bereits von api-client.js angezeigt
          } else {
            console.log('[Quiz] 💾 Ergebnis wird später synchronisiert');
            // Toast wird bereits von api-client.js angezeigt
          }
        }).catch(error => {
          console.error('[Quiz] ❌ Fehler beim Senden:', error);
        });
      }
    };

    const start = (onlyWrong=false) => {
      const ySel = (els.year?.value) || store.yearActive;
      pool = buildPool(ySel);
      const n = Number((els.count?.value) || 20);

      const base = onlyWrong ? wrong : pool;
      if(!onlyWrong) wrong = [];

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
      if (els.run) els.run.style.display = "none";
      if (els.home) els.home.style.display = "block";
      if (els.status) els.status.textContent = "Bereit";
      if (toastIt) toast("Quiz zurückgesetzt.");
    };

    if (els.start) els.start.addEventListener("click", () => start(false));
    if (els.onlyWrong) els.onlyWrong.addEventListener("click", () => {
      if(wrong.length === 0) { toast("Keine Fehler vorhanden."); return; }
      start(true);
    });
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
  })();

  // ========================================================================
  // PRÜFUNG (EXAM) - Handled by exam-complete.js
  // ========================================================================
  // Prüfungs-Logik wurde nach exam-complete.js ausgelagert
  // um Konflikte zu vermeiden und die neue Button-Struktur zu unterstützen

  // ========================================================================
  // TOAST NOTIFICATIONS
  // ========================================================================
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

  window.toast = toast;

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  // Set initial tab
  const firstTab = $(".tab.is-active");
  if(firstTab) setTab(firstTab.dataset.tab || "start");

  // Set initial year
  const activeYearBtn = $(".yearBtn.is-active");
  if(activeYearBtn) setYear(activeYearBtn.dataset.year || "1");

})();

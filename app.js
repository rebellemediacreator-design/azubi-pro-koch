(() => {
  const APP_VERSION = 3;
  const APP_KEY = "azubi_kueche_complete_v3";
  const SETTINGS_KEY = "azubi_kueche_complete_settings_v3";

  const CONTENT = window.AZUBI_CONTENT;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const toastEl = $("#toast");
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-show"), 1600);
  }

  function safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function uid() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function currentYear() {
    return new Date().getFullYear();
  }

  function weekNumberISO(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { week: weekNo, year: d.getUTCFullYear() };
  }

  function parseISO(s) {
    const [y,m,d] = String(s).split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function toISO(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  function startOfISOWeek(d){
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // Mon=0
    x.setDate(x.getDate() - day);
    x.setHours(0,0,0,0);
    return x;
  }
  function endOfISOWeek(d){
    const s = startOfISOWeek(d);
    const e = new Date(s);
    e.setDate(e.getDate()+6);
    e.setHours(23,59,59,999);
    return e;
  }
  function diffDays(a,b){
    const aa = new Date(a); aa.setHours(0,0,0,0);
    const bb = new Date(b); bb.setHours(0,0,0,0);
    return Math.floor((bb-aa)/86400000);
  }
  function trainingContextFor(dateISO){
    const startISO = settings.startDate || "";
    if (!startISO) return { year: activeYear, dayInTraining: null, weekInTraining: null, rangeStartISO: null, rangeEndISO: null };
    const start = parseISO(startISO);
    const d = parseISO(dateISO);
    const dayIdx = diffDays(start, d) + 1;
    const year = dayIdx <= 365 ? 1 : (dayIdx <= 730 ? 2 : 3);
    const weekInTraining = Math.max(1, Math.ceil(dayIdx / 7));
    const ws = startOfISOWeek(d);
    const we = endOfISOWeek(d);
    return { year, dayInTraining: dayIdx, weekInTraining, rangeStartISO: toISO(ws), rangeEndISO: toISO(we) };
  }


  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function humanShift(v) {
    if (v === "frueh") return "Früh";
    if (v === "spaet") return "Spät";
    if (v === "split") return "Split";
    if (v === "frei") return "Frei";
    return v || "";
  }

  function monthLabel(n) {
    const m = ["", "Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
    return m[n] || String(n);
  }

  function defaultState() {
    return {
      version: APP_VERSION,
      entries: {
        1: { dayEntries: [], weekEntries: [], monthEntries: [] },
        2: { dayEntries: [], weekEntries: [], monthEntries: [] },
        3: { dayEntries: [], weekEntries: [], monthEntries: [] }
      },
      notebook: {
        questions: "",
        vocabulary: "",
        recipes: "",
        serviceLessons: ""
      }
    };
  }

  function normalizeState(s) {
    if (!s || typeof s !== "object") return defaultState();
    const out = defaultState();

    if (s.entries && typeof s.entries === "object") {
      for (const y of [1,2,3]) {
        const src = s.entries[y] || {};
        out.entries[y].dayEntries = Array.isArray(src.dayEntries) ? src.dayEntries : [];
        out.entries[y].weekEntries = Array.isArray(src.weekEntries) ? src.weekEntries : [];
        out.entries[y].monthEntries = Array.isArray(src.monthEntries) ? src.monthEntries : [];
      }
    }

    if (s.notebook && typeof s.notebook === "object") {
      out.notebook.questions = String(s.notebook.questions ?? "");
      out.notebook.vocabulary = String(s.notebook.vocabulary ?? "");
      out.notebook.recipes = String(s.notebook.recipes ?? "");
      out.notebook.serviceLessons = String(s.notebook.serviceLessons ?? "");
    }

    out.version = APP_VERSION;
    return out;
  }

  function loadState() {
    const raw = localStorage.getItem(APP_KEY);
    return normalizeState(safeJsonParse(raw, null));
  }

  function saveState(state) {
    localStorage.setItem(APP_KEY, JSON.stringify(state));
  }

  function loadSettings() {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const s = safeJsonParse(raw, null);
    const okYear = s && [1,2,3].includes(Number(s.activeYear)) ? Number(s.activeYear) : 1;
    const okCal = s && typeof s.calMonth === "number" ? s.calMonth : new Date().getMonth();
    const okCalY = s && typeof s.calYear === "number" ? s.calYear : new Date().getFullYear();
    const okWissenModule = s && typeof s.activeWissenModule === "string" ? s.activeWissenModule : "";
    return { 
      activeYear: okYear, 
      calMonth: okCal, 
      calYear: okCalY, 
      activeWissenModule: okWissenModule,
      startDate: (s && typeof s.startDate === "string") ? s.startDate : "",
      azubiName: (s && typeof s.azubiName === "string") ? s.azubiName : "",
      jobTitle: (s && typeof s.jobTitle === "string") ? s.jobTitle : "Koch/Köchin",
      company: (s && typeof s.company === "string") ? s.company : "",
      trainer: (s && typeof s.trainer === "string") ? s.trainer : "",
      reportMode: (s && (s.reportMode === "daily" || s.reportMode === "weekly")) ? s.reportMode : "weekly",
      autoYear: (s && typeof s.autoYear === "boolean") ? s.autoYear : true
    };
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  let state = loadState();
  let settings = loadSettings();
  let activeYear = settings.activeYear;

  // === PRO: Onboarding + Auto-Lehrjahr ===
  const onboardingEl = document.getElementById("onboarding");
  const obName = document.getElementById("obName");
  const obJob = document.getElementById("obJob");
  const obCompany = document.getElementById("obCompany");
  const obTrainer = document.getElementById("obTrainer");
  const obStart = document.getElementById("obStart");
  const obMode = document.getElementById("obMode");
  const obSave = document.getElementById("obSave");

  function showOnboarding(){
    if (!onboardingEl) return;
    onboardingEl.classList.add("is-show");
    onboardingEl.setAttribute("aria-hidden","false");
    obName.value = settings.azubiName || "";
    obJob.value = settings.jobTitle || "Koch/Köchin";
    obCompany.value = settings.company || "";
    obTrainer.value = settings.trainer || "";
    obStart.value = settings.startDate || todayISO();
    obMode.value = settings.reportMode || "weekly";
  }
  function hideOnboarding(){
    if (!onboardingEl) return;
    onboardingEl.classList.remove("is-show");
    onboardingEl.setAttribute("aria-hidden","true");
  }

  if (!settings.startDate){
    settings.startDate = "";
    saveSettings(settings);
    setActiveTab("start");
    setTimeout(showOnboarding, 50);
  }

  if (obSave){
    obSave.addEventListener("click", () => {
      const s = (obStart.value || "").trim();
      if (!s){ toast("Bitte Ausbildungsstart setzen."); return; }
      settings.azubiName = (obName.value || "").trim();
      settings.jobTitle = (obJob.value || "Koch/Köchin").trim();
      settings.company = (obCompany.value || "").trim();
      settings.trainer = (obTrainer.value || "").trim();
      settings.startDate = s;
      settings.reportMode = obMode.value === "daily" ? "daily" : "weekly";
      settings.autoYear = true;
      saveSettings(settings);
      hideOnboarding();
      const ctx = trainingContextFor(todayISO());
      setActiveYear(ctx.year);
      toast("Setup gespeichert");
      updateStartScreen();
    });
  }

  // Start screen elements
  const trainingPill = document.getElementById("trainingPill");
  const trainingMeta = document.getElementById("trainingMeta");
  const kvYear = document.getElementById("kvYear");
  const kvDay = document.getElementById("kvDay");
  const kvWeek = document.getElementById("kvWeek");
  const kvRange = document.getElementById("kvRange");
  const quickDate = document.getElementById("quickDate");
  const quickNotes = document.getElementById("quickNotes");
  const quickGlossaryNotes = document.getElementById("quickGlossaryNotes");
  const quickTerms = document.getElementById("quickTerms");
  const btnSaveQuick = document.getElementById("btnSaveQuick");
  const btnExportReport = document.getElementById("btnExportReport");
  const btnOpenGlossar = document.getElementById("btnOpenGlossar");

  function updateStartScreen(){
    if (!quickDate) return;
    if (!quickDate.value) quickDate.value = todayISO();
    const ctx = trainingContextFor(quickDate.value);
    if (ctx.dayInTraining == null){
      if (trainingPill) trainingPill.textContent = "Setup fehlt";
      if (trainingMeta) trainingMeta.textContent = "Setze deinen Ausbildungsstart, damit Lehrjahre automatisch laufen.";
      if (kvYear) kvYear.textContent = "—";
      if (kvDay) kvDay.textContent = "—";
      if (kvWeek) kvWeek.textContent = "—";
      if (kvRange) kvRange.textContent = "—";
      return;
    }
    if (trainingPill) trainingPill.textContent = `Lehrjahr ${ctx.year}`;
    if (trainingMeta) trainingMeta.textContent = `Ausbildungsstart: ${settings.startDate} · Modus: ${settings.reportMode === "daily" ? "täglich" : "wöchentlich"}`;
    if (kvYear) kvYear.textContent = `Lehrjahr ${ctx.year}`;
    if (kvDay) kvDay.textContent = String(ctx.dayInTraining);
    if (kvWeek) kvWeek.textContent = String(ctx.weekInTraining);
    if (kvRange) kvRange.textContent = `${ctx.rangeStartISO} – ${ctx.rangeEndISO}`;

    if (settings.autoYear && ctx.year !== activeYear){
      setActiveYear(ctx.year);
    }
  }

  if (quickDate){
    quickDate.addEventListener("change", updateStartScreen);
    quickDate.value = todayISO();
  }
  if (btnOpenGlossar){
    btnOpenGlossar.addEventListener("click", () => setActiveTab("glossar"));
  }

  function saveQuick(){
    if (!quickDate || !quickNotes) return;
    const dateISO = quickDate.value || todayISO();
    const ctx = trainingContextFor(dateISO);
    if (ctx.dayInTraining == null){ showOnboarding(); return; }

    const p = {
      id: uid(),
      kind: "day",
      trainingYear: ctx.year,
      createdAt: Date.now(),
      date: dateISO,
      shift: "frueh",
      station: "",
      task: "",
      learningGoal: "",
      learned: "",
      standard: "",
      stress: 5,
      wentWell: "",
      toImprove: "",
      freeNotes: (quickNotes.value || "").trim(),
      glossaryNotes: (quickGlossaryNotes?.value || "").trim(),
      terms: (quickTerms?.value || "").split(",").map(x => x.trim()).filter(Boolean),
      basics: { water1:false, water2:false, water3:false, pause:false, food:false }
    };

    if (!p.freeNotes && !p.glossaryNotes && (!p.terms || p.terms.length===0)){
      toast("Bitte Notizen oder Glossar-Notizen oder Fachbegriffe eintragen.");
      return;
    }

    state.entries[ctx.year].dayEntries.push(p);
    saveState(state);
    updateStats();
    renderCalendar();
    renderEntries();
    toast("Gespeichert");
  }

  if (btnSaveQuick){ btnSaveQuick.addEventListener("click", saveQuick); }

  function buildReportForWeek(dateISO){
    const ctx = trainingContextFor(dateISO);
    if (ctx.dayInTraining == null) return null;
    const y = ctx.year;
    const ws = parseISO(ctx.rangeStartISO);
    const we = parseISO(ctx.rangeEndISO);
    const all = state.entries[y].dayEntries || [];
    const inRange = all.filter(e => e.date && parseISO(e.date) >= ws && parseISO(e.date) <= we)
                       .sort((a,b)=> (a.date||"").localeCompare(b.date||""));

    const combinedNotes = inRange.map(e => {
      const head = `${e.date}`;
      const body = (e.freeNotes || "").trim();
      return body ? `• ${head}:\n${body}` : `• ${head}`;
    }).join("\n\n");

    const combinedGloss = inRange.map(e => {
      const head = `${e.date}`;
      const body = (e.glossaryNotes || "").trim();
      return body ? `• ${head}:\n${body}` : "";
    }).filter(Boolean).join("\n\n");

    const terms = Array.from(new Set(inRange.flatMap(e => Array.isArray(e.terms)? e.terms : []).map(t=>String(t).trim()).filter(Boolean)));

    return {
      year: y,
      rangeStartISO: ctx.rangeStartISO,
      rangeEndISO: ctx.rangeEndISO,
      weekInTraining: ctx.weekInTraining,
      notes: combinedNotes || "",
      glossaryNotes: combinedGloss || "",
      terms
    };
  }

  function openReportPDF(){
    if (!quickDate) return;
    const dateISO = quickDate.value || todayISO();
    const rep = buildReportForWeek(dateISO);
    if (!rep){ showOnboarding(); return; }

    const name = escapeHtml(settings.azubiName || "");
    const job = escapeHtml(settings.jobTitle || "Koch/Köchin");
    const company = escapeHtml(settings.company || "");
    const trainer = escapeHtml(settings.trainer || "");

    const title = `Ausbildungsnachweis · ${rep.rangeStartISO} – ${rep.rangeEndISO}`;
    const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<link rel="stylesheet" href="styles.css"/>
</head>
<body>
  <div class="print-page">
    <div class="print-head">
      <div>
        <div class="print-title">Ausbildungsnachweis (Küche)</div>
        <div class="print-meta">
          <div><strong>Name:</strong> ${name}</div>
          <div><strong>Beruf:</strong> ${job}</div>
          <div><strong>Betrieb:</strong> ${company}</div>
          <div><strong>Ausbilder:in:</strong> ${trainer}</div>
        </div>
      </div>
      <div class="print-meta">
        <div><strong>Lehrjahr:</strong> ${rep.year}</div>
        <div><strong>Ausbildungswoche:</strong> ${rep.weekInTraining}</div>
        <div><strong>Zeitraum:</strong> ${rep.rangeStartISO} – ${rep.rangeEndISO}</div>
        <div><strong>Erstellt am:</strong> ${todayISO()}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="print-grid">
      <div class="print-box">
        <h3>Tätigkeiten / Inhalte (Betrieb)</h3>
        <p>${escapeHtml(rep.notes || "")}</p>
      </div>
      <div class="print-box">
        <h3>Fachbegriffe & Praxis-Notizen</h3>
        <p>${escapeHtml((rep.terms && rep.terms.length) ? rep.terms.join(", ") : "")}${rep.glossaryNotes ? "\n\n" + escapeHtml(rep.glossaryNotes) : ""}</p>
      </div>
      <div class="print-box">
        <h3>Unterweisungen / Hygiene / Sicherheit</h3>
        <p>${escapeHtml("")}</p>
      </div>
      <div class="print-box">
        <h3>Berufsschule (Themen / Lernfelder)</h3>
        <p>${escapeHtml("")}</p>
      </div>
    </div>

    <div class="sign">
      <div class="sigline">Unterschrift Azubi (Datum)</div>
      <div class="sigline">Unterschrift Ausbilder:in (Datum)</div>
    </div>

    <div class="help" style="margin-top:10px;">
      Hinweis: Speichere als PDF über „Drucken“ → „Als PDF speichern“. Einige Betriebe/Kammern haben eigene Vorgaben – dieses Layout ist berichtsheft-nah.
    </div>
  </div>

  <script>
    window.onload = () => { window.print(); };
  </script>
</body>
</html>`;
    const w = window.open("", "_blank");
    if (!w){ toast("Pop-up blockiert. Bitte Pop-ups erlauben."); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  if (btnExportReport){ btnExportReport.addEventListener("click", openReportPDF); }



  // Tabs
  function setActiveTab(tab) {
    $$(".tab").forEach(b => b.classList.toggle("is-active", b.dataset.tab === tab));
    $$(".panel").forEach(p => p.classList.toggle("is-active", p.id === `panel-${tab}`));

    if (tab === "calendar") renderCalendar();
    if (tab === "entries") renderEntries();
    if (tab === "wissen") renderWissen();
    if (tab === "glossar") renderGlossar();
  }
  $$(".tab").forEach(btn => btn.addEventListener("click", () => setActiveTab(btn.dataset.tab)));

  // Year switch
  function setActiveYear(year) {
    activeYear = year;
    $$(".yearBtn").forEach(b => b.classList.toggle("is-active", Number(b.dataset.year) === year));
    settings.activeYear = year;
    saveSettings(settings);
    updateStats();
    renderCalendar();
    renderEntries();
    renderWissen();
    renderGlossar();
    $("#wissenYearPill").textContent = `Lehrjahr ${activeYear}`;
    toast(`Lehrjahr ${year} aktiv`);
  }
  $$(".yearBtn").forEach(btn => btn.addEventListener("click", () => setActiveYear(Number(btn.dataset.year))));

  // Stats
  const statDays = $("#statDays");
  const statWeeks = $("#statWeeks");
  const statMonths = $("#statMonths");
  function bucket() {
    return state.entries[activeYear];
  }
  function updateStats() {
    const b = bucket();
    statDays.textContent = String(b.dayEntries.length);
    statWeeks.textContent = String(b.weekEntries.length);
    statMonths.textContent = String(b.monthEntries.length);
  }

  // Day form
  const dayDate = $("#dayDate");
  const dayShift = $("#dayShift");
  const dayStation = $("#dayStation");
  const dayTask = $("#dayTask");
  const dayLearningGoal = $("#dayLearningGoal");
  const dayLearned = $("#dayLearned");
  const dayStandard = $("#dayStandard");
  const dayStress = $("#dayStress");
  const stressPill = $("#stressPill");
  const dayWentWell = $("#dayWentWell");
  const dayToImprove = $("#dayToImprove");
  const dayFreeNotes = $("#dayFreeNotes");
  const dayWater1 = $("#dayWater1");
  const dayWater2 = $("#dayWater2");
  const dayWater3 = $("#dayWater3");
  const dayPause = $("#dayPause");
  const dayFood = $("#dayFood");

  dayStress.addEventListener("input", () => stressPill.textContent = String(dayStress.value));

  $("#btnSaveDay").addEventListener("click", saveDay);
  $("#btnClearDay").addEventListener("click", clearDay);

  function clearDay() {
    dayDate.value = todayISO();
    dayShift.value = "frueh";
    dayStation.value = "";
    dayTask.value = "";
    dayLearningGoal.value = "";
    dayLearned.value = "";
    dayStandard.value = "";
    dayStress.value = "5";
    stressPill.textContent = "5";
    dayWentWell.value = "";
    dayToImprove.value = "";
    dayFreeNotes.value = "";
    dayWater1.checked = false;
    dayWater2.checked = false;
    dayWater3.checked = false;
    dayPause.checked = false;
    dayFood.checked = false;
    toast("Tagesseite geleert");
  }

  function validateDay(p) {
    if (!p.date) return "Bitte Datum wählen.";
    if (!p.learningGoal.trim() && !p.learned.trim() && !p.freeNotes.trim()) return "Bitte mindestens Lernziel/Lerninhalt/Notizen eintragen.";
    return null;
  }

  function saveDay() {
    const p = {
      id: uid(),
      kind: "day",
      trainingYear: activeYear,
      createdAt: Date.now(),
      date: dayDate.value,
      shift: dayShift.value,
      station: dayStation.value.trim(),
      task: dayTask.value.trim(),
      learningGoal: dayLearningGoal.value.trim(),
      learned: dayLearned.value.trim(),
      standard: dayStandard.value.trim(),
      stress: Number(dayStress.value),
      wentWell: dayWentWell.value.trim(),
      toImprove: dayToImprove.value.trim(),
      freeNotes: dayFreeNotes.value.trim(),
      basics: {
        water1: !!dayWater1.checked,
        water2: !!dayWater2.checked,
        water3: !!dayWater3.checked,
        pause: !!dayPause.checked,
        food: !!dayFood.checked
      }
    };

    const err = validateDay(p);
    if (err) { toast(err); return; }

    bucket().dayEntries.push(p);
    saveState(state);
    updateStats();
    renderCalendar();
    renderEntries();
    toast("Tages-Eintrag gespeichert");
  }

  // Week form
  const weekNumber = $("#weekNumber");
  const weekYear = $("#weekYear");
  const weekSkills = $("#weekSkills");
  const weekMistake = $("#weekMistake");
  const weekFocus = $("#weekFocus");
  const weekNotes = $("#weekNotes");

  $("#btnSaveWeek").addEventListener("click", saveWeek);
  $("#btnClearWeek").addEventListener("click", clearWeek);

  function clearWeek() {
    const wn = weekNumberISO(new Date());
    weekNumber.value = wn.week;
    weekYear.value = wn.year;
    weekSkills.value = "";
    weekMistake.value = "";
    weekFocus.value = "";
    weekNotes.value = "";
    toast("Wochenseite geleert");
  }

  function validateWeek(p) {
    if (!p.week || p.week < 1 || p.week > 53) return "Bitte gültige Woche (1–53) eintragen.";
    if (!p.year) return "Bitte Jahr eintragen.";
    return null;
  }

  function saveWeek() {
    const p = {
      id: uid(),
      kind: "week",
      trainingYear: activeYear,
      createdAt: Date.now(),
      week: Number(weekNumber.value),
      year: Number(weekYear.value),
      skills: weekSkills.value.trim(),
      mistake: weekMistake.value.trim(),
      focus: weekFocus.value.trim(),
      notes: weekNotes.value.trim()
    };

    const err = validateWeek(p);
    if (err) { toast(err); return; }

    bucket().weekEntries.push(p);
    saveState(state);
    updateStats();
    renderEntries();
    toast("Wochen-Check gespeichert");
  }

  // Month form
  const monthName = $("#monthName");
  const monthYear = $("#monthYear");
  const monthProgress = $("#monthProgress");
  const monthGap = $("#monthGap");
  const monthSchool = $("#monthSchool");
  const monthNotes = $("#monthNotes");

  $("#btnSaveMonth").addEventListener("click", saveMonth);
  $("#btnClearMonth").addEventListener("click", clearMonth);

  function clearMonth() {
    monthName.value = String(new Date().getMonth() + 1);
    monthYear.value = currentYear();
    monthProgress.value = "";
    monthGap.value = "";
    monthSchool.value = "";
    monthNotes.value = "";
    toast("Monatsseite geleert");
  }

  function validateMonth(p) {
    if (!p.month || p.month < 1 || p.month > 12) return "Bitte Monat wählen.";
    if (!p.year) return "Bitte Jahr eintragen.";
    return null;
  }

  function saveMonth() {
    const p = {
      id: uid(),
      kind: "month",
      trainingYear: activeYear,
      createdAt: Date.now(),
      month: Number(monthName.value),
      year: Number(monthYear.value),
      progress: monthProgress.value.trim(),
      gap: monthGap.value.trim(),
      school: monthSchool.value.trim(),
      notes: monthNotes.value.trim()
    };

    const err = validateMonth(p);
    if (err) { toast(err); return; }

    bucket().monthEntries.push(p);
    saveState(state);
    updateStats();
    renderEntries();
    toast("Monats-Check gespeichert");
  }

  // Notebook
  const nbQuestions = $("#nbQuestions");
  const nbVocabulary = $("#nbVocabulary");
  const nbRecipes = $("#nbRecipes");
  const nbServiceLessons = $("#nbServiceLessons");
  $("#btnSaveNotebook").addEventListener("click", () => {
    state.notebook.questions = nbQuestions.value;
    state.notebook.vocabulary = nbVocabulary.value;
    state.notebook.recipes = nbRecipes.value;
    state.notebook.serviceLessons = nbServiceLessons.value;
    saveState(state);
    toast("Notizbuch gespeichert");
  });

  function loadNotebookIntoUI() {
    nbQuestions.value = state.notebook.questions || "";
    nbVocabulary.value = state.notebook.vocabulary || "";
    nbRecipes.value = state.notebook.recipes || "";
    nbServiceLessons.value = state.notebook.serviceLessons || "";
  }

  // Entries
  const entriesEl = $("#entries");
  const searchEl = $("#search");
  const sortByEl = $("#sortBy");
  const countInfo = $("#countInfo");

  searchEl.addEventListener("input", renderEntries);
  sortByEl.addEventListener("change", renderEntries);

  $("#btnDeleteYear").addEventListener("click", () => {
    if (!confirm(`Wirklich alle Einträge löschen für Lehrjahr ${activeYear}?`)) return;
    state.entries[activeYear] = { dayEntries: [], weekEntries: [], monthEntries: [] };
    saveState(state);
    updateStats();
    renderCalendar();
    renderEntries();
    toast("Lehrjahr gelöscht");
  });

  $("#btnDeleteAll").addEventListener("click", () => {
    if (!confirm("Wirklich ALLES löschen (Lehrjahr 1–3 + Notizbuch)?")) return;
    state = defaultState();
    saveState(state);
    updateStats();
    renderCalendar();
    renderEntries();
    loadNotebookIntoUI();
    toast("Alles gelöscht");
  });

  function allEntriesForCurrent() {
    const b = bucket();
    const day = b.dayEntries.map(e => ({...e, _sortDate: e.date ? parseISO(e.date).getTime() : e.createdAt}));
    const week = b.weekEntries.map(e => ({...e, _sortDate: e.createdAt}));
    const month = b.monthEntries.map(e => ({...e, _sortDate: e.createdAt}));
    return [...day, ...week, ...month];
  }

  function deleteEntryById(id) {
    const b = bucket();
    const before = b.dayEntries.length + b.weekEntries.length + b.monthEntries.length;

    b.dayEntries = b.dayEntries.filter(e => e.id !== id);
    b.weekEntries = b.weekEntries.filter(e => e.id !== id);
    b.monthEntries = b.monthEntries.filter(e => e.id !== id);

    const after = b.dayEntries.length + b.weekEntries.length + b.monthEntries.length;
    if (after === before) return;

    saveState(state);
    updateStats();
    renderCalendar();
    renderEntries();
    toast("Eintrag gelöscht");
  }

  function renderEntries() {
    let list = allEntriesForCurrent();
    const q = (searchEl.value || "").trim().toLowerCase();
    if (q) list = list.filter(e => JSON.stringify(e).toLowerCase().includes(q));

    const sortBy = sortByEl.value;
    list.sort((a,b) => sortBy === "oldest" ? (a._sortDate - b._sortDate) : (b._sortDate - a._sortDate));

    countInfo.textContent = `${list.length} Einträge · Lehrjahr ${activeYear}`;
    entriesEl.innerHTML = "";

    if (list.length === 0) {
      entriesEl.innerHTML = `<div class="muted">Noch keine Einträge in Lehrjahr ${activeYear}.</div>`;
      return;
    }

    for (const e of list) {
      const card = document.createElement("div");
      card.className = "entry";

      const title = e.kind === "day"
        ? `${e.date || "—"} · ${humanShift(e.shift)}`
        : e.kind === "week"
          ? `Woche ${e.week}/${e.year}`
          : `${monthLabel(e.month)} ${e.year}`;

      const meta = e.kind === "day"
        ? (e.station ? `Station: ${e.station}` : "Tages-Eintrag")
        : (e.kind === "week" ? "Wochen-Check" : "Monats-Check");

      const body = e.kind === "day"
        ? `<div class="entry__body">
             ${e.learningGoal ? `<div><strong>Lernziel:</strong> ${escapeHtml(e.learningGoal)}</div>` : ""}
             ${e.standard ? `<div style="margin-top:6px;"><strong>Standard:</strong> ${escapeHtml(e.standard)}</div>` : ""}
             ${e.freeNotes ? `<div style="margin-top:6px;"><strong>Notizen:</strong> ${escapeHtml(e.freeNotes).slice(0, 260)}${e.freeNotes.length>260?"…":""}</div>` : ""}
           </div>`
        : e.kind === "week"
          ? (e.focus ? `<div class="entry__body"><strong>Fokus:</strong> ${escapeHtml(e.focus)}</div>` : "")
          : (e.progress ? `<div class="entry__body"><strong>Fortschritt:</strong> ${escapeHtml(e.progress)}</div>` : "");

      card.innerHTML = `
        <div class="entry__top">
          <div>
            <div class="entry__title">${escapeHtml(title)}</div>
            <div class="entry__meta">${escapeHtml(meta)}</div>
          </div>
          <div class="entry__actions">
            <button class="iconbtn" type="button" title="Löschen" data-del="${e.id}">✕</button>
          </div>
        </div>
        ${body}
        <div class="kv">
          <div>Aufgabe</div><div><strong>${e.task ? escapeHtml(e.task) : "—"}</strong></div>
          <div>Verbessern</div><div><strong>${e.toImprove ? escapeHtml(e.toImprove) : (e.focus ? escapeHtml(e.focus) : "—")}</strong></div>
        </div>
      `;

      card.querySelector("[data-del]")?.addEventListener("click", () => deleteEntryById(e.id));
      entriesEl.appendChild(card);
    }
  }

  // Calendar
  const calendarGrid = $("#calendarGrid");
  const calLabel = $("#calLabel");
  $("#btnCalPrev").addEventListener("click", () => shiftCalendar(-1));
  $("#btnCalNext").addEventListener("click", () => shiftCalendar(1));
  $("#btnCalToday").addEventListener("click", () => {
    const d = new Date();
    settings.calMonth = d.getMonth();
    settings.calYear = d.getFullYear();
    saveSettings(settings);
    renderCalendar();
  });

  function shiftCalendar(deltaMonths) {
    let m = settings.calMonth + deltaMonths;
    let y = settings.calYear;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    settings.calMonth = m;
    settings.calYear = y;
    saveSettings(settings);
    renderCalendar();
  }

  function dayEntryMapForMonth(year, monthIndex) {
    const m = new Map();
    const b = bucket().dayEntries;
    for (const e of b) {
      if (!e.date) continue;
      const d = parseISO(e.date);
      if (d.getFullYear() === year && d.getMonth() === monthIndex) {
        m.set(e.date, true);
      }
    }
    return m;
  }

  function renderCalendar() {
    const year = settings.calYear;
    const monthIndex = settings.calMonth;
    calLabel.textContent = `${monthLabel(monthIndex + 1)} ${year}`;

    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    const daysInMonth = last.getDate();

    const jsDay = first.getDay();
    const mondayIndex = (jsDay + 6) % 7;

    const totalCells = Math.ceil((mondayIndex + daysInMonth) / 7) * 7;

    const today = new Date();
    const todayIso = toISO(today);
    const hasEntry = dayEntryMapForMonth(year, monthIndex);

    calendarGrid.innerHTML = "";

    for (let cell = 0; cell < totalCells; cell++) {
      const dayNum = cell - mondayIndex + 1;
      const isInMonth = dayNum >= 1 && dayNum <= daysInMonth;

      const cellEl = document.createElement("div");
      cellEl.className = "calCell";

      if (!isInMonth) {
        cellEl.classList.add("is-muted");
        cellEl.innerHTML = `<div class="calDayNum"> </div>`;
        calendarGrid.appendChild(cellEl);
        continue;
      }

      const d = new Date(year, monthIndex, dayNum);
      const iso = toISO(d);

      if (iso === todayIso) cellEl.classList.add("is-today");
      if (hasEntry.get(iso)) cellEl.classList.add("has-entry");

      cellEl.innerHTML = `
        <div class="calDayNum">${dayNum}</div>
        <div class="calSmall">${hasEntry.get(iso) ? "Eintrag vorhanden" : "—"}</div>
      `;

      cellEl.addEventListener("click", () => {
        dayDate.value = iso;
        setActiveTab("day");
        toast(`Datum gesetzt: ${iso}`);
      });

      calendarGrid.appendChild(cellEl);
    }
  }

  // Wissen
  const wissenSearch = $("#wissenSearch");
  const wissenNavItems = $("#wissenNavItems");
  const wissenContent = $("#wissenContent");
  const wissenYearPill = $("#wissenYearPill");

  $("#btnWissenTop").addEventListener("click", () => {
    const panel = $("#panel-wissen");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  wissenSearch.addEventListener("input", () => renderWissen());

  function getYearWissen() {
    return CONTENT?.wissen?.years?.[activeYear] || null;
  }

  function renderWissen() {
    const y = getYearWissen();
    if (!y) {
      wissenNavItems.innerHTML = `<div class="muted">Keine Inhalte gefunden.</div>`;
      wissenContent.innerHTML = `<div class="muted">Keine Inhalte gefunden.</div>`;
      return;
    }

    wissenYearPill.textContent = `Lehrjahr ${activeYear}`;

    const query = (wissenSearch.value || "").trim().toLowerCase();

    let modules = y.modules || [];
    if (query) {
      modules = modules.filter(m => {
        const blob = JSON.stringify(m).toLowerCase();
        return blob.includes(query);
      });
    }

    // Nav
    wissenNavItems.innerHTML = "";
    if (modules.length === 0) {
      wissenNavItems.innerHTML = `<div class="muted">Keine Treffer im Lehrjahr ${activeYear}.</div>`;
      wissenContent.innerHTML = `
        <div class="wiModule">
          <h2>${escapeHtml(y.title)}</h2>
          <p class="lead">${escapeHtml(y.intro)}</p>
          <div class="wiCallout"><strong>Keine Treffer</strong>Suchbegriff anpassen oder Suche leeren.</div>
        </div>
      `;
      return;
    }

    const activeId = settings.activeWissenModule && modules.some(m => m.id === settings.activeWissenModule)
      ? settings.activeWissenModule
      : modules[0].id;

    for (const m of modules) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wissenNav__btn" + (m.id === activeId ? " is-active" : "");
      btn.textContent = m.title;
      btn.addEventListener("click", () => {
        settings.activeWissenModule = m.id;
        saveSettings(settings);
        renderWissen();
      });
      wissenNavItems.appendChild(btn);
    }

    const mod = modules.find(m => m.id === activeId) || modules[0];
    wissenContent.innerHTML = renderModuleHTML(y, mod);
  }

  function renderModuleHTML(yearObj, mod) {
    const sections = (mod.sections || []).map(sec => {
      const pHtml = (sec.p || []).map(t => `<p>${escapeHtml(t)}</p>`).join("");
      const ulHtml = (sec.ul || []).length
        ? `<ul class="wiList">${sec.ul.map(li => `<li>${escapeHtml(li)}</li>`).join("")}</ul>`
        : "";
      return `
        <div class="wiSection">
          <h3>${escapeHtml(sec.h || "")}</h3>
          ${pHtml}
          ${ulHtml}
        </div>
      `;
    }).join("");

    const callout = mod.callout
      ? `<div class="wiCallout"><strong>${escapeHtml(mod.callout.title)}</strong>${escapeHtml(mod.callout.text)}</div>`
      : "";

    return `
      <div class="wiModule">
        <h2>${escapeHtml(mod.title)}</h2>
        <p class="lead">${escapeHtml(mod.lead || "")}</p>
        ${sections}
        ${callout}
        <div class="divider"></div>
        <p class="lead"><strong>${escapeHtml(yearObj.title)}:</strong> ${escapeHtml(yearObj.intro)}</p>
      </div>
    `;
  }

  // Glossar
  
  // Glossar
  const glossarSearch = $("#glossarSearch");
  const glossarYearFilter = $("#glossarYearFilter");
  const glossarLetterFilter = $("#glossarLetterFilter");
  const glossarReset = $("#glossarReset");
  const glossarList = $("#glossarList");
  const glossarCount = $("#glossarCount");

  // re-render on interactions
  glossarSearch?.addEventListener("input", renderGlossar);
  glossarYearFilter?.addEventListener("change", renderGlossar);
  glossarLetterFilter?.addEventListener("change", renderGlossar);

  glossarReset?.addEventListener("click", () => {
    if (glossarSearch) glossarSearch.value = "";
    if (glossarYearFilter) glossarYearFilter.value = "all";
    if (glossarLetterFilter) glossarLetterFilter.value = "all";
    renderGlossar();
    glossarSearch?.focus();
  });

  function renderGlossar() {
    const pack = window.AZUBI_GLOSSARY_PRO || window.AZUBI_GLOSSARY || null;
    const items = pack && Array.isArray(pack.items) ? pack.items : (Array.isArray(pack) ? pack : []);

    const q = (glossarSearch?.value || "").trim().toLowerCase();
    const yearSel = (glossarYearFilter?.value || "all").trim().toLowerCase();
    const letterSel = (glossarLetterFilter?.value || "all").trim().toUpperCase();

    let list = items.slice();

    // Lehrjahr-Filter (Dropdown)
    if (yearSel === "1" || yearSel === "2" || yearSel === "3") {
      const y = Number(yearSel);
      list = list.filter(x => Array.isArray(x.years) ? x.years.includes(y) : true);
    } else if (yearSel === "allgemein") {
      list = list.filter(x => String(x.category || "").toLowerCase() === "allgemein");
    } // "all" => keine Einschränkung

    // Buchstaben-Filter
    if (letterSel !== "ALL") {
      list = list.filter(x => String(x.term || "").trim().toUpperCase().startsWith(letterSel));
    }

    // Suche
    if (q) {
      list = list.filter(x => JSON.stringify(x).toLowerCase().includes(q));
    }

    list.sort((a,b) => String(a.term||"").localeCompare(String(b.term||""), "de"));

    // Counter (Pill)
    if (glossarCount) {
      glossarCount.textContent = `${list.length} Begriffe`;
    }

    if (!glossarList) return;

    if (list.length === 0) {
      glossarList.innerHTML = `<div class="muted">Keine Treffer.</div>`;
      return;
    }

    glossarList.innerHTML = list.map(x => {
      const term = escapeHtml(x.term || "");
      const def = escapeHtml(x.definition || "");
      const praxis = escapeHtml(x.praxis || "");
      const fehler = escapeHtml(x.fehler || "");
      const merksatz = escapeHtml(x.merksatz || "");
      const cat = escapeHtml(x.category || "");
      const years = Array.isArray(x.years) ? x.years.join(", ") : "";
      return `
        <div class="entry">
          <div class="entry__top">
            <div>
              <div class="entry__title">${term}</div>
              <div class="entry__meta">Kategorie: ${cat || "—"} · Lehrjahr: ${years || "—"}</div>
            </div>
          </div>
          <div class="entry__body">
            <div class="kv">
              <div><strong>Definition</strong></div><div>${def}</div>
              <div><strong>Praxis</strong></div><div>${praxis}</div>
              <div><strong>Typischer Fehler</strong></div><div>${fehler}</div>
              <div><strong>Merksatz</strong></div><div>${merksatz}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // initial render
  renderGlossar();
function exportJSON() {
    const bundle = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: state,
      settings: settings
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "azubi-kueche-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Export erstellt");
  }

  function importJSON(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imported = safeJsonParse(String(reader.result || ""), null);
      if (!imported || typeof imported !== "object") {
        toast("Import fehlgeschlagen (JSON ungültig)");
        ev.target.value = "";
        return;
      }

      const next = imported.data ? imported.data : imported;
      state = normalizeState(next);
      saveState(state);

      if (imported.settings && typeof imported.settings === "object") {
        settings = {
          activeYear: [1,2,3].includes(Number(imported.settings.activeYear)) ? Number(imported.settings.activeYear) : settings.activeYear,
          calMonth: typeof imported.settings.calMonth === "number" ? imported.settings.calMonth : settings.calMonth,
          calYear: typeof imported.settings.calYear === "number" ? imported.settings.calYear : settings.calYear,
          activeWissenModule: typeof imported.settings.activeWissenModule === "string" ? imported.settings.activeWissenModule : settings.activeWissenModule
        };
        saveSettings(settings);
      }

      activeYear = settings.activeYear;
      $$(".yearBtn").forEach(b => b.classList.toggle("is-active", Number(b.dataset.year) === activeYear));

      updateStats();
      renderCalendar();
      renderEntries();
      renderWissen();
      renderGlossar();
      loadNotebookIntoUI();
      toast("Import abgeschlossen");
      ev.target.value = "";
    };
    reader.readAsText(file);
  }

  // Boot defaults
  function initDefaults() {
    dayDate.value = todayISO();
    dayStress.value = "5";
    stressPill.textContent = "5";

    const wn = weekNumberISO(new Date());
    weekNumber.value = wn.week;
    weekYear.value = wn.year;

    monthYear.value = currentYear();
    monthName.value = String(new Date().getMonth() + 1);
  }

  function boot() {
    initDefaults();
    loadNotebookIntoUI();
    setActiveYear(activeYear);
    setActiveTab("start");
    updateStats();
    renderCalendar();
    renderEntries();
    renderWissen();
    renderGlossar();
  }

  boot();
})();

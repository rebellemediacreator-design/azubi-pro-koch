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

  // Glossar (Verzeichnis + Quiz)
  const glossarSearch = $("#glossarSearch");
  const glossarYearFilter = $("#glossarYearFilter");
  const glossarIndex = $("#glossarIndex");
  const glossarQuiz = $("#glossarQuiz");
  const glossarCount = $("#glossarCount");

  const btnGlossarReset = $("#btnGlossarReset");
  const btnGlossarFlashcards = $("#btnGlossarFlashcards");
  const btnGlossarExport = $("#btnGlossarExport");
  const btnGlossarStartQuiz = $("#btnGlossarStartQuiz");

  const glossarModeIndex = $("#glossarModeIndex");
  const glossarModeQuiz = $("#glossarModeQuiz");

  const quizStats = $("#quizStats");
  const quizQIndex = $("#quizQIndex");
  const quizQYear = $("#quizQYear");
  const quizQCat = $("#quizQCat");
  const quizQuestion = $("#quizQuestion");
  const quizChoices = $("#quizChoices");
  const quizFeedback = $("#quizFeedback");
  const btnQuizNext = $("#btnQuizNext");
  const btnQuizBackToIndex = $("#btnQuizBackToIndex");

  // default: follow activeYear
  if (glossarYearFilter && glossarYearFilter.value === "all") {
    glossarYearFilter.value = String(activeYear || 1);
  }

  let glossarMode = "index"; // index | quiz
  let quizState = { items: [], idx: 0, correct: 0, total: 0, locked: false };

  glossarSearch.addEventListener("input", () => renderGlossar());
  glossarYearFilter.addEventListener("change", () => renderGlossar());

  glossarModeIndex.addEventListener("click", () => setGlossarMode("index"));
  glossarModeQuiz.addEventListener("click", () => setGlossarMode("quiz"));

  btnGlossarReset.addEventListener("click", () => {
    glossarSearch.value = "";
    glossarYearFilter.value = String(activeYear || 1);
    setGlossarMode("index");
    renderGlossar();
  });

  btnGlossarExport.addEventListener("click", exportGlossarPDF);
  btnGlossarFlashcards.addEventListener("click", exportFlashcardsPDF);
  btnGlossarStartQuiz.addEventListener("click", startGlossarQuiz);

  btnQuizBackToIndex.addEventListener("click", () => setGlossarMode("index"));
  btnQuizNext.addEventListener("click", nextQuizQuestion);

  function setGlossarMode(mode) {
    glossarMode = mode;
    glossarModeIndex.classList.toggle("is-active", mode === "index");
    glossarModeQuiz.classList.toggle("is-active", mode === "quiz");
    glossarIndex.style.display = mode === "index" ? "" : "none";
    glossarQuiz.style.display = mode === "quiz" ? "" : "none";
    if (mode === "quiz" && quizState.items.length === 0) {
      startGlossarQuiz();
    }
  }


function renderGlossar() {
    const pack = window.AZUBI_GLOSSARY_PRO || window.AZUBI_GLOSSARY || null;
    const items = pack && Array.isArray(pack.items) ? pack.items : (pack && Array.isArray(pack) ? pack : []);
    const q = (glossarSearch.value || "").trim().toLowerCase();
    const yearSel = String(glossarYearFilter.value || "all");

    // filter base
    let list = items.slice();
    if (yearSel !== "all") {
      const y = parseInt(yearSel, 10);
      list = list.filter(x => Array.isArray(x.years) ? x.years.includes(y) : true);
    }
    if (q) {
      list = list.filter(x => {
        const hay = `${x.term||""} ${x.definition||""} ${x.category||""} ${x.merksatz||""} ${x.praxis||""} ${x.fehler||""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // sort alphabetisch
    list.sort((a,b) => String(a.term||"").localeCompare(String(b.term||""), "de"));

    // count label
    const yearLabel = yearSel === "all" ? "Alle Lehrjahre" : `Lehrjahr ${yearSel}`;
    glossarCount.textContent = `${list.length} Begriffe · ${yearLabel}`;

    // render Inhaltsverzeichnis: Lehrjahr → Buchstabe → Begriffe (Details)
    if (list.length === 0) {
      glossarIndex.innerHTML = `<div class="muted">Keine Treffer.</div>`;
      return;
    }

    const yearBlocks = yearSel === "all" ? [1,2,3] : [parseInt(yearSel,10)];
    const byYear = new Map(yearBlocks.map(y => [y, []]));
    list.forEach(it => {
      const ys = Array.isArray(it.years) ? it.years : yearBlocks;
      // Wenn "all": ein Begriff kann in mehreren Jahren sein → in jedes passende Jahr einsortieren
      if (yearSel === "all") {
        [1,2,3].forEach(y => {
          if (!Array.isArray(it.years) || ys.includes(y)) byYear.get(y).push(it);
        });
      } else {
        byYear.get(yearBlocks[0]).push(it);
      }
    });

    const htmlYear = yearBlocks.map(y => {
      const yItems = (byYear.get(y) || []).slice().sort((a,b)=>String(a.term||"").localeCompare(String(b.term||""),"de"));
      if (!yItems.length) return ``;

      // group by first letter
      const groups = new Map();
      yItems.forEach(it => {
        const t = String(it.term||"").trim();
        const letter = (t[0] || "#").toUpperCase();
        const key = /[A-ZÄÖÜ]/.test(letter) ? letter : "#";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(it);
      });

      const letters = Array.from(groups.keys()).sort((a,b)=>a.localeCompare(b,"de"));
      const letterBlocks = letters.map(L => {
        const arr = groups.get(L).slice().sort((a,b)=>String(a.term||"").localeCompare(String(b.term||""),"de"));
        const itemsHtml = arr.map(it => {
          const term = escapeHtml(it.term || "");
          const def = escapeHtml(it.definition || "");
          const praxis = escapeHtml(it.praxis || "");
          const fehler = escapeHtml(it.fehler || "");
          const merksatz = escapeHtml(it.merksatz || "");
          const cat = escapeHtml(it.category || "");
          const years = Array.isArray(it.years) ? it.years.join(", ") : "";
          const tags = `
            ${cat ? `<span class="tag">${cat}</span>` : ``}
            ${years ? `<span class="tag">Lehrjahr: ${years}</span>` : ``}
          `.trim();

          return `
            <div class="termItem">
              <details>
                <summary>
                  <div>
                    <div class="termName">${term}</div>
                    <div class="termMeta">${cat ? `Kategorie: ${cat}` : `Kategorie: —`}</div>
                  </div>
                  <div class="pill">+</div>
                </summary>
                <div class="termBody">
                  <div>${tags}</div>
                  <div class="kv">
                    <div>
                      <div class="k">Definition</div>
                      <div class="v">${def || "—"}</div>
                    </div>
                    ${praxis ? `<div><div class="k">Praxis</div><div class="v">${praxis}</div></div>` : ``}
                    ${merksatz ? `<div><div class="k">Merksatz</div><div class="v">${merksatz}</div></div>` : ``}
                    ${fehler ? `<div><div class="k">Häufiger Fehler</div><div class="v">${fehler}</div></div>` : ``}
                  </div>
                </div>
              </details>
            </div>
          `;
        }).join("");

        return `
          <div class="letterBlock">
            <div class="letterHead">
              <div class="letter">${escapeHtml(L)}</div>
              <div class="count">${arr.length} Begriff${arr.length===1?"":"e"}</div>
            </div>
            <div class="termList">${itemsHtml}</div>
          </div>
        `;
      }).join("");

      return `
        <div class="glossarYearBlock">
          <div class="glossarYearTitle">
            <h2 class="h2">Lehrjahr ${y}</h2>
            <div class="pill">${yItems.length} Begriffe</div>
          </div>
          ${letterBlocks}
        </div>
      `;
    }).join("");

    glossarIndex.innerHTML = htmlYear || `<div class="muted">Keine Treffer.</div>`;
  }





  /* ===== Glossar Quiz (robust++) ===== */
  function startGlossarQuiz() {
    const pack = window.AZUBI_GLOSSARY_PRO || window.AZUBI_GLOSSARY || null;
    const items = pack && Array.isArray(pack.items) ? pack.items : (pack && Array.isArray(pack) ? pack : []);
    const q = (glossarSearch.value || "").trim().toLowerCase();
    const yearSel = String(glossarYearFilter.value || "all");

    let pool = items.slice();
    if (yearSel !== "all") {
      const y = parseInt(yearSel, 10);
      pool = pool.filter(x => Array.isArray(x.years) ? x.years.includes(y) : true);
    }
    if (q) {
      pool = pool.filter(x => {
        const hay = `${x.term||""} ${x.definition||""} ${x.category||""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    pool.sort((a,b)=>String(a.term||"").localeCompare(String(b.term||""),"de"));

    const take = Math.min(10, pool.length);
    const picked = pickRandom(pool, take);

    quizState = {
      items: picked.map(it => buildQuizQuestion(it, items, yearSel)),
      idx: 0,
      correct: 0,
      total: 0,
      locked: false,
    };

    setGlossarMode("quiz");
    renderQuizQuestion();
    updateQuizStats();
  }

  function buildQuizQuestion(it, allItems, yearSel) {
    // Frage: Definition → welcher Begriff?
    const correctTerm = String(it.term || "").trim();
    const def = String(it.definition || "").trim() || "—";
    const year = bestYearForItem(it, yearSel);
    const cat = String(it.category || "").trim();

    const distractors = pickDistractors(it, allItems, year, cat, 3)
      .map(x => String(x.term || "").trim())
      .filter(t => t && t !== correctTerm);

    // ensure 3 unique
    const unique = [];
    for (const t of distractors) if (!unique.includes(t)) unique.push(t);

    // fallback if still short
    if (unique.length < 3) {
      const extra = allItems
        .filter(x => x && String(x.term||"").trim() && String(x.term||"").trim() !== correctTerm)
        .map(x => String(x.term||"").trim());
      const add = pickRandom(extra, 20);
      for (const t of add) {
        if (unique.length >= 3) break;
        if (!unique.includes(t)) unique.push(t);
      }
    }

    const options = shuffle([correctTerm, ...unique.slice(0,3)]);

    return { it, year, cat, def, correctTerm, options };
  }

  function bestYearForItem(it, yearSel) {
    if (yearSel !== "all") return parseInt(yearSel, 10);
    const ys = Array.isArray(it.years) ? it.years : [];
    return ys.length ? ys[0] : (activeYear || 1);
  }

  function pickDistractors(it, allItems, year, cat, n) {
    const ys = (x) => Array.isArray(x.years) ? x.years : [];
    const sameCatSameYear = allItems.filter(x =>
      x !== it &&
      String(x.category||"").trim() &&
      String(x.category||"").trim() === String(cat||"").trim() &&
      ys(x).includes(year)
    );

    const sameCat = allItems.filter(x =>
      x !== it &&
      String(x.category||"").trim() &&
      String(x.category||"").trim() === String(cat||"").trim()
    );

    const sameYear = allItems.filter(x => x !== it && ys(x).includes(year));

    // priority: sameCat+sameYear → sameCat → sameYear → fallback
    const out = [];
    const pushFrom = (arr) => {
      const shuffled = pickRandom(arr, arr.length);
      for (const x of shuffled) {
        if (out.length >= n) break;
        if (!out.includes(x) && String(x.term||"").trim()) out.push(x);
      }
    };

    if (cat) pushFrom(sameCatSameYear);
    if (out.length < n && cat) pushFrom(sameCat);
    if (out.length < n) pushFrom(sameYear);
    if (out.length < n) pushFrom(allItems.filter(x => x !== it));

    return out.slice(0, n);
  }

  function renderQuizQuestion() {
    const total = quizState.items.length;
    if (!total) {
      quizQuestion.textContent = "Keine Quizfragen verfügbar (Filter zu eng?).";
      quizChoices.innerHTML = "";
      quizFeedback.style.display = "none";
      btnQuizNext.disabled = true;
      return;
    }

    const q = quizState.items[quizState.idx];
    quizState.locked = false;
    btnQuizNext.disabled = true;

    quizQIndex.textContent = `Frage ${quizState.idx + 1}/${total}`;
    quizQYear.textContent = `Lehrjahr ${q.year}`;
    quizQCat.textContent = q.cat ? `Kategorie ${q.cat}` : "Kategorie —";

    quizQuestion.textContent = `Welche Bezeichnung passt zu dieser Definition?\n${q.def}`;

    quizChoices.innerHTML = q.options.map(opt => `
      <button class="quizChoice" type="button" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</button>
    `).join("");

    quizFeedback.style.display = "none";
    quizFeedback.className = "quizFeedback";

    [...quizChoices.querySelectorAll(".quizChoice")].forEach(btn => {
      btn.addEventListener("click", () => chooseQuizAnswer(btn, q.correctTerm));
    });
  }

  function chooseQuizAnswer(btn, correctTerm) {
    if (quizState.locked) return;
    quizState.locked = true;

    const chosen = (btn.getAttribute("data-opt") || "").trim();
    const ok = chosen === correctTerm;

    quizState.total++;
    if (ok) quizState.correct++;

    [...quizChoices.querySelectorAll(".quizChoice")].forEach(b => {
      const opt = (b.getAttribute("data-opt") || "").trim();
      if (opt === correctTerm) b.classList.add("is-correct");
      if (b === btn && !ok) b.classList.add("is-wrong");
      b.disabled = true;
    });

    quizFeedback.style.display = "";
    quizFeedback.classList.add(ok ? "ok" : "no");
    quizFeedback.textContent = ok ? `Richtig. Begriff: ${correctTerm}` : `Falsch. Richtig ist: ${correctTerm}`;

    updateQuizStats();
    btnQuizNext.disabled = false;
  }

  function nextQuizQuestion() {
    const total = quizState.items.length;
    if (!total) return;

    if (quizState.idx >= total - 1) {
      quizQuestion.textContent = "Quiz abgeschlossen.";
      quizChoices.innerHTML = "";
      btnQuizNext.disabled = true;

      quizFeedback.style.display = "";
      quizFeedback.className = "quizFeedback ok";
      quizFeedback.textContent = `Ergebnis: ${quizState.correct}/${quizState.total} (${pct(quizState.correct, quizState.total)}%)`;
      updateQuizStats();
      return;
    }

    quizState.idx++;
    renderQuizQuestion();
  }

  function updateQuizStats() {
    quizStats.textContent = `${quizState.correct}/${quizState.total} · ${pct(quizState.correct, quizState.total)}%`;
  }

  /* ===== PDF Export (Zeilenumbruch) ===== */
  function exportGlossarPDF() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert("PDF Export nicht verfügbar (jsPDF fehlt).");
      return;
    }

    const pack = window.AZUBI_GLOSSARY_PRO || window.AZUBI_GLOSSARY || null;
    const items = pack && Array.isArray(pack.items) ? pack.items : (pack && Array.isArray(pack) ? pack : []);
    const q = (glossarSearch.value || "").trim().toLowerCase();
    const yearSel = String(glossarYearFilter.value || "all");

    let list = items.slice();
    if (yearSel !== "all") {
      const y = parseInt(yearSel, 10);
      list = list.filter(x => Array.isArray(x.years) ? x.years.includes(y) : true);
    }
    if (q) {
      list = list.filter(x => {
        const hay = `${x.term||""} ${x.definition||""} ${x.category||""} ${x.merksatz||""} ${x.praxis||""} ${x.fehler||""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    list.sort((a,b)=>String(a.term||"").localeCompare(String(b.term||""),"de"));

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 44;
    const top = 54;
    const maxW = 520;
    const lineH = 14;

    doc.setFont("helvetica","bold");
    doc.setFontSize(16);
    doc.text("Azubi Tagebuch Küche – Glossar", left, top);

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);
    doc.text(`Filter: ${yearSel === "all" ? "Alle" : "Lehrjahr " + yearSel} · Begriffe: ${list.length}`, left, top+18);

    let y = top + 44;

    list.forEach(it => {
      const term = String(it.term||"").trim();
      const years = Array.isArray(it.years) ? it.years.join(", ") : "—";
      const cat = String(it.category||"").trim() || "—";
      const def = String(it.definition||"").trim() || "—";
      const merksatz = String(it.merksatz||"").trim();
      const praxis = String(it.praxis||"").trim();
      const fehler = String(it.fehler||"").trim();

      const header = `${term} (Lehrjahr: ${years} · Kategorie: ${cat})`;

      doc.setFont("helvetica","bold");
      doc.setFontSize(11);
      doc.splitTextToSize(header, maxW).forEach(ln => {
        if (y > 780) { doc.addPage(); y = 60; }
        doc.text(ln, left, y); y += lineH;
      });

      doc.setFont("helvetica","normal");
      doc.setFontSize(11);
      doc.splitTextToSize(def, maxW).forEach(ln => {
        if (y > 780) { doc.addPage(); y = 60; }
        doc.text(ln, left, y); y += lineH;
      });

      const extraBlocks = [
        merksatz ? `Merksatz: ${merksatz}` : "",
        praxis ? `Praxis: ${praxis}` : "",
        fehler ? `Häufiger Fehler: ${fehler}` : ""
      ].filter(Boolean);

      extraBlocks.forEach(block => {
        doc.setFontSize(10);
        doc.splitTextToSize(block, maxW).forEach(ln => {
          if (y > 780) { doc.addPage(); y = 60; }
          doc.text(ln, left, y); y += lineH;
        });
      });

      y += 10;
    });

    doc.setFontSize(9);
    doc.text("🖤RE:BELLE™ Media · The Art of Feeling. Amplified. · newwomanintheshop.com · rebellemedia.de", left, 820);

    doc.save(`glossar-azubi-koch-${yearSel === "all" ? "alle" : "lj"+yearSel}.pdf`);
  }

  function exportFlashcardsPDF() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert("PDF Export nicht verfügbar (jsPDF fehlt).");
      return;
    }

    const pack = window.AZUBI_GLOSSARY_PRO || window.AZUBI_GLOSSARY || null;
    const items = pack && Array.isArray(pack.items) ? pack.items : (pack && Array.isArray(pack) ? pack : []);
    const q = (glossarSearch.value || "").trim().toLowerCase();
    const yearSel = String(glossarYearFilter.value || "all");

    let list = items.slice();
    if (yearSel !== "all") {
      const y = parseInt(yearSel, 10);
      list = list.filter(x => Array.isArray(x.years) ? x.years.includes(y) : true);
    }
    if (q) {
      list = list.filter(x => {
        const hay = `${x.term||""} ${x.definition||""} ${x.category||""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    list.sort((a,b)=>String(a.term||"").localeCompare(String(b.term||""),"de"));

    const pick = pickRandom(list, Math.min(24, list.length));

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const margin = 34;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFont("helvetica","bold");
    doc.setFontSize(14);
    doc.text("Flashcards – Glossar (Azubi Küche)", margin, 28);

    const cols = 3, rows = 2, gap = 14;
    const cardW = (pageW - margin*2 - gap*(cols-1)) / cols;
    const cardH = (pageH - margin*2 - gap*(rows-1)) / rows;

    let i = 0;
    while (i < pick.length) {
      for (let r=0; r<rows; r++) {
        for (let c=0; c<cols; c++) {
          if (i >= pick.length) break;
          const x = margin + c*(cardW+gap);
          const y = margin + r*(cardH+gap);

          const it = pick[i];
          const term = String(it.term||"").trim();
          const def = String(it.definition||"").trim() || "—";
          const years = Array.isArray(it.years) ? it.years.join(", ") : "—";
          const cat = String(it.category||"").trim() || "—";

          doc.setDrawColor(196,154,108);
          doc.setLineWidth(1);
          doc.roundedRect(x, y, cardW, cardH, 10, 10);

          doc.setFont("helvetica","bold");
          doc.setFontSize(13);
          doc.text(term, x+12, y+26, { maxWidth: cardW-24 });

          doc.setFont("helvetica","normal");
          doc.setFontSize(10);
          doc.text(`LJ: ${years} · ${cat}`, x+12, y+44, { maxWidth: cardW-24 });

          doc.setFontSize(11);
          const lines = doc.splitTextToSize(def, cardW-24);
          let yy = y + 66;
          lines.forEach(ln => {
            if (yy > y + cardH - 18) return;
            doc.text(ln, x+12, yy);
            yy += 14;
          });

          i++;
        }
      }
      if (i < pick.length) doc.addPage();
    }

    doc.save(`flashcards-azubi-koch-${yearSel === "all" ? "alle" : "lj"+yearSel}.pdf`);
  }

  function pickRandom(arr, n) {
    const a = arr.slice();
    for (let i=a.length-1; i>0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i=a.length-1; i>0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pct(a,b){ return b ? Math.round((a/b)*100) : 0; }



;

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

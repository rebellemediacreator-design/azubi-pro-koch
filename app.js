/* RE:BELLE™ Koch-Glossar Quiz EFZ (CH)
   ✅ fröhliches UI (CSS)
   ✅ Header hide-on-scroll
   ✅ Glossar Filter/Suche/Reset
   ✅ Quiz (MC) mit Feedback
   ✅ Prüfungen (Führerschein-Style): Timer, kein Zurück, kein Feedback
   ✅ Ergebnis: Prozent, Bestanden/Nicht, Fehlerliste, Nur Fehler wiederholen
   ✅ PDF Export (Wrap)
*/

/* ========= HEADER HIDE ON SCROLL ========= */
(() => {
  const header = document.getElementById("appHeader");
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const delta = y - lastY;
    if (Math.abs(delta) < 8) return;

    if (delta > 0 && y > 80) header.classList.add("is-hidden");
    else header.classList.remove("is-hidden");

    lastY = y;
  }

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScroll();
      ticking = false;
    });
  }, { passive: true });
})();

/* ========= DATA ========= */
const DATA =
  (typeof window !== "undefined" && (
    window.AZUBI_GLOSSARY ||
    window.GLOSSARY ||
    window.glossary ||
    window.AZUBI_GLOSSAR
  )) || null;

const glossary = Array.isArray(DATA) && DATA.length ? normalizeGlossary(DATA) : [
  { term: "Al dente", def: "Bissfest gegart; meist bei Pasta oder Gemüse.", jahr: "1" },
  { term: "Blanchieren", def: "Kurz in kochendem Wasser garen, dann eiskalt abschrecken.", jahr: "1" },
  { term: "Emulsion", def: "Stabile Verbindung zweier nicht mischbarer Flüssigkeiten.", jahr: "2" },
  { term: "Consommé", def: "Klare Brühe, durch Klären besonders rein.", jahr: "3" },
];

/* ========= DOM ========= */
const el = {
  lehrjahr: document.getElementById("lehrjahrFilter"),
  search: document.getElementById("searchInput"),
  mode: document.getElementById("modeSelect"),
  list: document.getElementById("glossaryList"),
  empty: document.getElementById("emptyState"),
  glossarView: document.getElementById("glossarView"),
  quizView: document.getElementById("quizView"),
  pruefungView: document.getElementById("pruefungView"),

  progressLabel: document.getElementById("progressLabel"),
  countLabel: document.getElementById("countLabel"),
  progressBar: document.getElementById("progressBar"),

  btnReset: document.getElementById("btnReset"),
  btnFlashcards: document.getElementById("btnFlashcards"),
  btnExport: document.getElementById("btnExport"),
  btnStartQuiz: document.getElementById("btnStartQuiz"),

  statCorrect: document.getElementById("statCorrect"),
  statTotal: document.getElementById("statTotal"),
  statPercent: document.getElementById("statPercent"),

  qIndex: document.getElementById("qIndex"),
  qJahr: document.getElementById("qJahr"),
  qText: document.getElementById("qText"),
  choices: document.getElementById("choices"),
  feedback: document.getElementById("feedback"),
  btnNext: document.getElementById("btnNext"),
  btnQuit: document.getElementById("btnQuit"),

  // Prüfungen
  examHome: document.getElementById("examHome"),
  examRun: document.getElementById("examRun"),
  examResult: document.getElementById("examResult"),

  btnExam1: document.getElementById("btnExam1"),
  btnExam2: document.getElementById("btnExam2"),
  btnExam3: document.getElementById("btnExam3"),

  examName: document.getElementById("examName"),
  examProgress: document.getElementById("examProgress"),
  examTimer: document.getElementById("examTimer"),
  btnExamAbort: document.getElementById("btnExamAbort"),

  examQIdx: document.getElementById("examQIdx"),
  examQJahr: document.getElementById("examQJahr"),
  examQText: document.getElementById("examQText"),
  examChoices: document.getElementById("examChoices"),
  btnExamNext: document.getElementById("btnExamNext"),

  resultTitle: document.getElementById("resultTitle"),
  resultMeta: document.getElementById("resultMeta"),
  wrongList: document.getElementById("wrongList"),
  btnRetryWrong: document.getElementById("btnRetryWrong"),
  btnBackExamHome: document.getElementById("btnBackExamHome"),
};

let filtered = [...glossary];

/* ========= QUIZ STATE ========= */
let quiz = { items: [], idx: 0, correct: 0, total: 0, locked: false };

/* ========= EXAM STATE ========= */
let exam = {
  active: false,
  name: "",
  year: "1",
  totalQ: 0,
  passPct: 70,
  secondsLeft: 0,
  timerId: null,
  idx: 0,
  items: [], // {q, options[], correctTerm, chosenTerm}
  wrongOnlyMode: false,
};

init();

function init() {
  el.lehrjahr.addEventListener("change", onFilterChange);
  el.search.addEventListener("input", onFilterChange);
  el.mode.addEventListener("change", onModeChange);

  el.btnReset.addEventListener("click", resetAll);
  el.btnFlashcards.addEventListener("click", exportFlashcardsPDF);
  el.btnExport.addEventListener("click", exportGlossaryPDF);
  el.btnStartQuiz.addEventListener("click", startQuiz);

  el.btnNext.addEventListener("click", nextQuestion);
  el.btnQuit.addEventListener("click", () => { el.mode.value = "glossar"; onModeChange(); });

  // Prüfungen
  el.btnExam1.addEventListener("click", () => startExam({ year: "1", totalQ: 30, minutes: 45, passPct: 70, name: "Lehrjahr 1 Prüfung" }));
  el.btnExam2.addEventListener("click", () => startExam({ year: "2", totalQ: 40, minutes: 60, passPct: 70, name: "Lehrjahr 2 Prüfung" }));
  el.btnExam3.addEventListener("click", () => startExam({ year: "3", totalQ: 50, minutes: 75, passPct: 70, name: "Lehrjahr 3 Prüfung" }));

  el.btnExamAbort.addEventListener("click", abortExam);
  el.btnExamNext.addEventListener("click", examNext);

  el.btnBackExamHome.addEventListener("click", () => showExamHome());
  el.btnRetryWrong.addEventListener("click", retryWrong);

  renderGlossary();
  updateCounts();
  updateProgress();
}

/* ========= MODE / FILTER ========= */
function onFilterChange() {
  applyFilters();
  renderGlossary();
  updateCounts();
  updateProgress();
}

function onModeChange() {
  const mode = el.mode.value;

  el.glossarView.style.display = mode === "glossar" ? "block" : "none";
  el.quizView.style.display = mode === "quiz" ? "block" : "none";
  el.pruefungView.style.display = mode === "pruefung" ? "block" : "none";

  if (mode === "pruefung" && !exam.active) {
    showExamHome();
  }

  updateProgress();
}

function resetAll() {
  el.lehrjahr.value = "all";
  el.search.value = "";
  el.mode.value = "glossar";

  quiz = { items: [], idx: 0, correct: 0, total: 0, locked: false };
  el.feedback.style.display = "none";
  el.btnNext.disabled = true;

  stopExamTimer();
  exam = {
    active: false, name: "", year: "1", totalQ: 0, passPct: 70,
    secondsLeft: 0, timerId: null, idx: 0, items: [], wrongOnlyMode: false
  };

  applyFilters();
  renderGlossary();
  updateCounts();
  updateStats();
  onModeChange();
}

function applyFilters() {
  const year = el.lehrjahr.value;
  const q = (el.search.value || "").trim().toLowerCase();

  filtered = glossary.filter((it) => {
    const y = String(it.jahr || "");
    const yearOk = (year === "all") || (y === year);
    if (!yearOk) return false;
    if (!q) return true;
    return String(it.term).toLowerCase().includes(q) || String(it.def).toLowerCase().includes(q);
  });
}

/* ========= GLOSSARY ========= */
function renderGlossary() {
  applyFilters();

  if (filtered.length === 0) {
    el.list.innerHTML = "";
    el.empty.style.display = "block";
    return;
  }
  el.empty.style.display = "none";

  const html = filtered
    .slice()
    .sort((a, b) => (String(a.jahr).localeCompare(String(b.jahr)) || String(a.term).localeCompare(String(b.term))))
    .map((it) => `
      <div class="item">
        <button class="itemBtn" type="button" data-term="${escapeHtml(it.term)}">
          <div class="itemTop">
            <div class="term">${escapeHtml(it.term)}</div>
            <div class="pill">Lehrjahr ${escapeHtml(String(it.jahr))}</div>
          </div>
          <div class="def">${escapeHtml(it.def)}</div>
        </button>
      </div>
    `).join("");

  el.list.innerHTML = html;

  el.list.querySelectorAll(".itemBtn").forEach((btn) => {
    btn.addEventListener("click", () => toast(`Gemerkter Begriff: ${btn.dataset.term}`));
  });
}

function updateCounts() {
  applyFilters();
  el.countLabel.textContent = `${filtered.length} Begriffe`;
}

function updateProgress() {
  const glossarPart = glossary.length ? Math.round((filtered.length / glossary.length) * 50) : 0;
  const quizPart = quiz.total ? Math.round((quiz.correct / quiz.total) * 25) : 0;

  // Prüfungsanteil: letzte Prüfung, falls vorhanden
  const examPart = examLastPercent() ? Math.round((examLastPercent() / 100) * 25) : 0;

  const p = clamp(glossarPart + quizPart + examPart, 0, 100);
  el.progressBar.style.width = `${p}%`;
  el.progressLabel.textContent = `Fortschritt: ${p}%`;
}

let lastExamPercentValue = 0;
function examLastPercent() { return lastExamPercentValue || 0; }

/* ========= QUIZ (mit Feedback) ========= */
function startQuiz() {
  applyFilters();
  const pool = filtered.length ? filtered : glossary;

  const picked = pickRandom(pool, Math.min(10, pool.length));
  quiz.items = picked.map((q) => ({
    q,
    options: buildOptionsDefinitionToTerm(q, glossary, 4),
    answer: q.term,
  }));

  quiz.idx = 0;
  quiz.correct = 0;
  quiz.total = 0;
  quiz.locked = false;

  el.mode.value = "quiz";
  onModeChange();
  updateStats();
  showQuestion();
}

function showQuestion() {
  const total = quiz.items.length;
  if (!total) {
    el.qText.textContent = "Keine Daten fürs Quiz. Filter lockern.";
    el.choices.innerHTML = "";
    el.btnNext.disabled = true;
    return;
  }

  quiz.locked = false;
  el.btnNext.disabled = true;

  el.feedback.style.display = "none";
  el.feedback.className = "feedback";

  const item = quiz.items[quiz.idx];
  el.qIndex.textContent = `Frage ${quiz.idx + 1}/${total}`;
  el.qJahr.textContent = `Lehrjahr ${item.q.jahr}`;
  el.qText.textContent = `Welcher Begriff passt zu: „${item.q.def}“?`;

  el.choices.innerHTML = item.options
    .map((opt) => `<button class="choice" type="button" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`)
    .join("");

  el.choices.querySelectorAll(".choice").forEach((b) => {
    b.addEventListener("click", () => chooseAnswer(b, item.answer));
  });
}

function chooseAnswer(btn, correctTerm) {
  if (quiz.locked) return;
  quiz.locked = true;

  const chosen = (btn.getAttribute("data-opt") || "").trim();
  const isCorrect = chosen === correctTerm;

  el.choices.querySelectorAll(".choice").forEach((b) => {
    const opt = (b.getAttribute("data-opt") || "").trim();
    if (opt === correctTerm) b.classList.add("correct");
    if (b === btn && !isCorrect) b.classList.add("wrong");
    b.disabled = true;
  });

  quiz.total++;
  if (isCorrect) quiz.correct++;

  el.feedback.style.display = "block";
  el.feedback.classList.add(isCorrect ? "ok" : "no");
  el.feedback.textContent = isCorrect ? `Richtig. Begriff: ${correctTerm}` : `Falsch. Richtig ist: ${correctTerm}`;

  updateStats();
  el.btnNext.disabled = false;
  updateProgress();
}

function nextQuestion() {
  if (!quiz.items.length) return;

  if (quiz.idx >= quiz.items.length - 1) {
    el.qText.textContent = "Quiz abgeschlossen.";
    el.choices.innerHTML = "";
    el.btnNext.disabled = true;

    el.feedback.style.display = "block";
    el.feedback.className = "feedback ok";
    el.feedback.textContent = `Ergebnis: ${quiz.correct}/${quiz.total} (${percent(quiz.correct, quiz.total)}%)`;

    updateProgress();
    return;
  }

  quiz.idx++;
  showQuestion();
}

function updateStats() {
  el.statCorrect.textContent = String(quiz.correct);
  el.statTotal.textContent = String(quiz.total);
  el.statPercent.textContent = `${percent(quiz.correct, quiz.total)}%`;
}

/* ========= PRÜFUNGEN (ohne Feedback) ========= */
function showExamHome() {
  stopExamTimer();
  exam.active = false;

  el.examHome.style.display = "block";
  el.examRun.style.display = "none";
  el.examResult.style.display = "none";
}

function startExam(cfg) {
  const yearPool = glossary.filter(x => String(x.jahr) === String(cfg.year));
  if (yearPool.length < Math.min(cfg.totalQ, 10)) {
    toast("Zu wenige Begriffe für diese Prüfung. Mehr Daten im Glossar nötig.");
    return;
  }

  stopExamTimer();
  exam.active = true;
  exam.wrongOnlyMode = false;

  exam.name = cfg.name;
  exam.year = String(cfg.year);
  exam.totalQ = cfg.totalQ;
  exam.passPct = cfg.passPct;
  exam.secondsLeft = cfg.minutes * 60;
  exam.idx = 0;

  const picked = pickRandom(yearPool, Math.min(cfg.totalQ, yearPool.length));

  // Prüfung fragt wie Quiz: Definition -> Begriff (MC)
  exam.items = picked.map(q => ({
    q,
    options: buildOptionsDefinitionToTerm(q, glossary, 4),
    correctTerm: q.term,
    chosenTerm: "",
  }));

  // UI
  el.examName.textContent = exam.name;
  el.examHome.style.display = "none";
  el.examRun.style.display = "block";
  el.examResult.style.display = "none";

  renderExamQuestion();
  startExamTimer();
}

function renderExamQuestion() {
  const total = exam.items.length;
  const item = exam.items[exam.idx];

  el.examProgress.textContent = `${exam.idx + 1}/${total}`;
  el.examQIdx.textContent = `Frage ${exam.idx + 1}/${total}`;
  el.examQJahr.textContent = `Lehrjahr ${item.q.jahr}`;
  el.examQText.textContent = `Welcher Begriff passt zu: „${item.q.def}“?`;

  el.btnExamNext.disabled = true;

  el.examChoices.innerHTML = item.options
    .map(opt => `<button class="choice" type="button" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`)
    .join("");

  el.examChoices.querySelectorAll(".choice").forEach(btn => {
    btn.addEventListener("click", () => {
      // nur 1 Antwort, dann sperren
      el.examChoices.querySelectorAll(".choice").forEach(b => b.disabled = true);

      const chosen = (btn.getAttribute("data-opt") || "").trim();
      item.chosenTerm = chosen;

      // visuelles "selected" ohne Feedback (kein richtig/falsch)
      btn.style.outline = "3px solid rgba(124,77,255,.35)";
      btn.style.transform = "translateY(-1px)";

      el.btnExamNext.disabled = false;
    });
  });
}

function examNext() {
  const total = exam.items.length;

  if (exam.idx >= total - 1) {
    finishExam();
    return;
  }

  exam.idx++;
  renderExamQuestion();
}

function finishExam() {
  stopExamTimer();

  const total = exam.items.length;
  const correct = exam.items.filter(it => it.chosenTerm && it.chosenTerm === it.correctTerm).length;
  const pct = percent(correct, total);
  lastExamPercentValue = pct;

  const passed = pct >= exam.passPct;

  const wrong = exam.items.filter(it => it.chosenTerm !== it.correctTerm);

  el.resultTitle.textContent = passed ? "Bestanden" : "Nicht bestanden";
  el.resultMeta.textContent = `${exam.name} · ${correct}/${total} · ${pct}% · Bestehen ab ${exam.passPct}%`;

  el.wrongList.innerHTML = wrong.length
    ? wrong.map(it => `
        <div class="wrongItem">
          <div class="wTerm">${escapeHtml(it.correctTerm)}</div>
          <div class="wLine"><strong>Definition:</strong> ${escapeHtml(it.q.def)}</div>
          <div class="wLine"><strong>Deine Antwort:</strong> ${escapeHtml(it.chosenTerm || "—")}</div>
          <div class="wMuted">Richtig wäre: ${escapeHtml(it.correctTerm)}</div>
        </div>
      `).join("")
    : `<div class="wrongItem"><div class="wTerm">Keine Fehler.</div><div class="wLine">Sauber.</div></div>`;

  // “Nur Fehler wiederholen” nur aktiv, wenn es Fehler gibt
  el.btnRetryWrong.disabled = wrong.length === 0;

  // UI switch
  el.examHome.style.display = "none";
  el.examRun.style.display = "none";
  el.examResult.style.display = "block";

  updateProgress();
}

function retryWrong() {
  const wrong = exam.items.filter(it => it.chosenTerm !== it.correctTerm);
  if (!wrong.length) return;

  // neue Runde nur mit Fehlern
  exam.active = true;
  exam.wrongOnlyMode = true;
  exam.idx = 0;

  // Reset chosenTerm
  exam.items = wrong.map(it => ({
    q: it.q,
    options: buildOptionsDefinitionToTerm(it.q, glossary, 4),
    correctTerm: it.correctTerm,
    chosenTerm: "",
  }));

  // Timer kürzer: 1 Minute pro Frage, min 10 Minuten
  const minutes = Math.max(10, exam.items.length * 1);
  exam.secondsLeft = minutes * 60;

  el.examName.textContent = `${exam.name} · Fehlertraining`;
  el.examHome.style.display = "none";
  el.examRun.style.display = "block";
  el.examResult.style.display = "none";

  renderExamQuestion();
  startExamTimer();
}

function abortExam() {
  stopExamTimer();
  showExamHome();
}

function startExamTimer() {
  stopExamTimer();
  updateExamTimerLabel();

  exam.timerId = setInterval(() => {
    exam.secondsLeft--;
    updateExamTimerLabel();

    if (exam.secondsLeft <= 0) {
      exam.secondsLeft = 0;
      stopExamTimer();
      finishExam();
    }
  }, 1000);
}

function stopExamTimer() {
  if (exam.timerId) {
    clearInterval(exam.timerId);
    exam.timerId = null;
  }
}

function updateExamTimerLabel() {
  const m = Math.floor(exam.secondsLeft / 60);
  const s = exam.secondsLeft % 60;
  el.examTimer.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ========= PDF EXPORTS (Wrap) ========= */
function exportGlossaryPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const items = filtered.length ? filtered : glossary;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Koch-Glossar EFZ (CH) – RE:BELLE™", 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Export: ${new Date().toLocaleString("de-CH")}`, 40, 68);
  doc.text(`Begriffe: ${items.length}`, 40, 82);

  let y = 110;
  const lineH = 14;
  const maxW = 515;
  const left = 40;

  items
    .slice()
    .sort((a, b) => (String(a.jahr).localeCompare(String(b.jahr)) || String(a.term).localeCompare(String(b.term))))
    .forEach((it) => {
      const head = `${it.term} (Lehrjahr ${it.jahr})`;
      const body = it.def;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.splitTextToSize(head, maxW).forEach((ln) => {
        if (y > 800) { doc.addPage(); y = 50; }
        doc.text(ln, left, y);
        y += lineH;
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.splitTextToSize(body, maxW).forEach((ln) => {
        if (y > 800) { doc.addPage(); y = 50; }
        doc.text(ln, left, y);
        y += lineH;
      });

      y += 10;
    });

  doc.setFontSize(9);
  doc.text("🖤RE:BELLE™ Media · The Art of Feeling. Amplified. · newwomanintheshop.com · rebellemedia.de", 40, 830);

  doc.save("koch-glossar-efz-ch.pdf");
}

function exportFlashcardsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const items = (filtered.length ? filtered : glossary).slice();
  const cards = pickRandom(items, Math.min(24, items.length));

  const margin = 36;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const cols = 3;
  const rows = 2;
  const gap = 14;

  const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const cardH = (pageH - margin * 2 - gap * (rows - 1)) / rows;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Flashcards – Koch-Glossar EFZ (CH) – RE:BELLE™", margin, 28);

  let i = 0;
  while (i < cards.length) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (i >= cards.length) break;

        const x = margin + c * (cardW + gap);
        const y = margin + r * (cardH + gap);
        const it = cards[i];

        doc.setDrawColor(47, 210, 255);
        doc.setLineWidth(1);
        doc.roundedRect(x, y, cardW, cardH, 10, 10);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(String(it.term), x + 14, y + 28, { maxWidth: cardW - 28 });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Lehrjahr ${it.jahr}`, x + 14, y + 46);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const defLines = doc.splitTextToSize(String(it.def), cardW - 28);
        let yy = y + 68;

        defLines.forEach((ln) => {
          if (yy > y + cardH - 18) return;
          doc.text(ln, x + 14, yy);
          yy += 14;
        });

        i++;
      }
    }
    if (i < cards.length) doc.addPage();
  }

  doc.save("koch-flashcards-efz-ch.pdf");
}

/* ========= HELPERS ========= */
function normalizeGlossary(arr) {
  return arr
    .map((x) => {
      const term = x.term ?? x.title ?? x.begriff ?? "";
      const def  = x.def ?? x.definition ?? x.bedeutung ?? x.desc ?? "";
      const jahr = x.jahr ?? x.year ?? x.lehrjahr ?? "";
      return { term: String(term).trim(), def: String(def).trim(), jahr: String(jahr).trim() };
    })
    .filter((x) => x.term && x.def && x.jahr);
}

function pickRandom(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function buildOptionsDefinitionToTerm(questionItem, pool, n) {
  const correct = String(questionItem.term);
  const others = pool
    .filter((it) => String(it.term) !== correct)
    .map((it) => String(it.term));

  const picked = pickRandom(others, Math.max(0, n - 1));
  const opts = [correct, ...picked];

  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

function percent(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Mini Toast */
let toastTimer = null;
function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.position = "fixed";
    t.style.left = "50%";
    t.style.bottom = "18px";
    t.style.transform = "translateX(-50%)";
    t.style.padding = "10px 12px";
    t.style.borderRadius = "16px";
    t.style.background = "rgba(11,18,32,.92)";
    t.style.color = "#fff";
    t.style.fontWeight = "950";
    t.style.fontSize = "13px";
    t.style.zIndex = "9999";
    t.style.maxWidth = "92vw";
    t.style.textAlign = "center";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = "0"; }, 1100);
}

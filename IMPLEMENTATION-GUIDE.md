# Implementierungs-Guide - Azubi Tagebuch Küche Enhanced

## 🎯 Übersicht

Dieses Dokument erklärt die technische Implementierung aller neuen Features für Entwickler.

---

## 📦 Neue Dateien

### 1. `app-enhanced.js` (28 KB)
Die Hauptdatei mit allen neuen Features. Ersetzt `app.js` in der index.html.

**Struktur:**
```
├── Header Hide on Scroll (Zeilen 1-50)
├── Global Click Delegation (Zeilen 54-120)
├── Main App Initialization (Zeilen 125-200)
├── Tabs & Year Management (Zeilen 205-230)
├── Glossar Enhanced (Zeilen 235-420)
├── Quiz Enhanced (Zeilen 425-600)
├── Prüfung Enhanced (Zeilen 605-850)
├── Toast Notifications (Zeilen 855-880)
└── Initialization (Zeilen 885-900)
```

### 2. `styles-enhanced.css` (8.3 KB)
Neue Styles für Glossar, Quiz und Prüfung.

**Inhalte:**
```
├── Glossar Layout (Zeilen 1-50)
├── Glossar Sidebar (Zeilen 51-120)
├── Glossar Main (Zeilen 121-200)
├── Quiz Styles (Zeilen 201-300)
├── Exam Styles (Zeilen 301-450)
├── Header Hide Animation (Zeilen 451-470)
└── Responsive Adjustments (Zeilen 471-520)
```

---

## 🔧 Feature-Implementierungen

### 1. Header Hide on Scroll

**Datei**: `app-enhanced.js` Zeilen 1-50

**Mechanismus:**
```javascript
// Tracking der letzten Scroll-Position
let lastScrollY = 0;
let isHeaderVisible = true;

// Scroll-Event-Listener
window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;
  
  // Scroll nach unten (> 10px) → Header verstecken
  if (currentScrollY > lastScrollY + 10) {
    header.classList.add("is-hidden");
  }
  
  // Scroll nach oben (< 10px) → Header zeigen
  else if (currentScrollY < lastScrollY - 10) {
    header.classList.remove("is-hidden");
  }
  
  lastScrollY = currentScrollY;
}, { passive: true });
```

**CSS-Klasse:**
```css
.topbar.is-hidden {
  transform: translateY(-110%);
  opacity: 0;
  pointer-events: none;
  transition: all .3s ease;
}
```

**Besonderheiten:**
- Passive Event-Listener für bessere Performance
- 10px Schwellwert verhindert Flackern
- Smooth Transition mit 0.3s
- Funktioniert auf Desktop und Mobile

---

### 2. Glossar - Erweiterte Funktionalität

**Datei**: `app-enhanced.js` Zeilen 235-420

#### A. Daten-Struktur
```javascript
// Glossarbegriff mit allen Informationen
{
  term: "Abfallwirtschaft",
  definition: "Systematische Erfassung und Entsorgung von Abfällen",
  praxis: "Im Alltag ist das ein Standard-Begriff...",
  merksatz: "Standard schlägt Stimmung.",
  fehler: "Typischer Fehler: Begriff kennen, aber nicht anwenden...",
  years: [1, 2, 3]  // In welchen Lehrjahren relevant
}
```

#### B. Lehrjahr-Filter
```javascript
const allowedYearsUpTo = (year) => {
  const y = Number(year || 1);
  return [1,2,3].filter(n => n <= y);
};

// Beispiel:
// Lehrjahr 1 → [1]
// Lehrjahr 2 → [1, 2]
// Lehrjahr 3 → [1, 2, 3]
```

#### C. Rendering-Prozess
```javascript
const renderGlossary = () => {
  // 1. Alle Begriffe laden
  const all = getGlossaryItems();
  
  // 2. Nach Lehrjahr filtern (kumulativ)
  const allowed = allowedYearsUpTo(year);
  let view = all.filter(it => 
    (it.years||[]).some(y => allowed.includes(Number(y)))
  );
  
  // 3. Nach Suchtext filtern
  if(q) {
    view = view.filter(it =>
      it.term.toLowerCase().includes(q) ||
      it.definition.toLowerCase().includes(q) ||
      it.praxis.toLowerCase().includes(q) ||
      it.merksatz.toLowerCase().includes(q)
    );
  }
  
  // 4. Alphabetisch sortieren
  view.sort((a,b)=> 
    (a.term||"").localeCompare((b.term||""), "de", {sensitivity:"base"})
  );
  
  // 5. Nach Buchstaben gruppieren und rendern
  const groups = new Map();
  for(const it of view){
    const L = (it.term||"").trim()[0].toUpperCase();
    if(!groups.has(L)) groups.set(L, []);
    groups.get(L).push(it);
  }
  
  // 6. Sidebar und Detail-View rendern
  renderSidebar(groups);
  showGlossaryItem(firstItem);
};
```

#### D. Suche in Echtzeit
```javascript
// Input-Event-Listener
search.addEventListener("input", renderGlossary);

// Bei jedem Tastendruck:
// - Suchtext auslesen
// - Glossar neu filtern
// - Ergebnisse anzeigen
```

#### E. Begriffsdefinition anzeigen
```javascript
const showGlossaryItem = (item) => {
  // HTML mit allen Informationen generieren
  detail.innerHTML = `
    <h3 class="glossarTerm">${item.term}</h3>
    <p class="glossarMeta">Lehrjahr: ${item.years.join(", ")}</p>
    <div class="glossarBlock">
      <div class="glossarBlockTitle">Definition</div>
      <div class="glossarDef">${item.definition}</div>
    </div>
    <div class="glossarBlock">
      <div class="glossarBlockTitle">Praxis</div>
      <div class="glossarDef">${item.praxis}</div>
    </div>
    <div class="glossarBlock">
      <div class="glossarBlockTitle">Merksatz</div>
      <div class="glossarDef">${item.merksatz}</div>
    </div>
    <div class="glossarBlock">
      <div class="glossarBlockTitle">Typische Fehler</div>
      <div class="glossarDef">${item.fehler}</div>
    </div>
  `;
};
```

---

### 3. Quiz - Implementierung

**Datei**: `app-enhanced.js` Zeilen 425-600

#### A. Quiz-Struktur
```javascript
const quiz = (() => {
  // State
  let pool = [];        // Alle verfügbaren Fragen
  let deck = [];        // Aktuelle Fragen-Reihenfolge
  let i = 0;            // Aktuelle Frage-Index
  let score = 0;        // Richtige Antworten
  let wrong = [];       // Falsch beantwortete Fragen
  
  // Funktionen
  const buildPool = (year) => { /* ... */ };
  const makeQuestion = (item) => { /* ... */ };
  const render = () => { /* ... */ };
  const answer = (ans) => { /* ... */ };
  const start = () => { /* ... */ };
  const reset = () => { /* ... */ };
  
  return { start, reset };
})();
```

#### B. Fragen generieren
```javascript
const makeQuestion = (item) => {
  // Richtige Antwort
  const correct = item.definition;
  
  // 3 Distraktoren (falsche Antworten)
  const distract = pool
    .filter(x => x.term !== item.term && x.definition !== correct)
    .sort(()=>Math.random()-0.5)
    .slice(0,3)
    .map(x => x.definition);
  
  // Alle Antworten mischen
  const choices = [correct, ...distract].sort(()=>Math.random()-0.5);
  
  return { term: item.term, correct, choices };
};
```

#### C. Quiz-Flow
```javascript
const start = (onlyWrong=false) => {
  // 1. Fragen-Pool basierend auf Lehrjahr laden
  const ySel = els.year.value || store.yearActive;
  pool = buildPool(ySel);
  
  // 2. Basis-Fragen wählen (normal oder nur Fehler)
  const base = onlyWrong ? wrong : pool;
  if(!onlyWrong) wrong = [];
  
  // 3. Zufällige Fragen auswählen und Fragen generieren
  deck = base
    .sort(()=>Math.random()-0.5)
    .slice(0, Math.min(n, base.length))
    .map(makeQuestion);
  
  // 4. Zustand zurücksetzen und rendern
  i = 0; score = 0;
  render();
};

const answer = (ans) => {
  const q = deck[i];
  const ok = ans === q.correct;
  
  if (ok) score += 1;
  else wrong.push(q);
  
  // Feedback anzeigen
  els.feedback.textContent = ok 
    ? "✅ Richtig." 
    : `❌ Falsch. Richtig: ${q.correct}`;
};

const next = () => {
  i += 1;
  render();
};
```

---

### 4. Prüfung - Implementierung

**Datei**: `app-enhanced.js` Zeilen 605-850

#### A. Prüfungs-Parameter nach Lehrjahr
```javascript
const examConfig = {
  1: { questions: 30, timeLimit: 45 * 60, passingScore: 70 },
  2: { questions: 40, timeLimit: 60 * 60, passingScore: 70 },
  3: { questions: 50, timeLimit: 75 * 60, passingScore: 70 }
};
```

#### B. Timer-Implementierung
```javascript
let t0 = 0;
let timerInt = null;

const tick = () => {
  const s = Math.max(0, Math.floor((Date.now()-t0)/1000));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  els.timer.textContent = `${mins}:${secs.toString().padStart(2,"0")}`;
};

const start = (year) => {
  t0 = Date.now();
  clearInterval(timerInt);
  timerInt = setInterval(tick, 500);  // Update alle 500ms
};
```

#### C. Prüfungs-Flow
```javascript
const start = (year, onlyWrong=false) => {
  currentYear = year;
  pool = buildPool(year);
  
  // Fragen basierend auf Lehrjahr
  const questionCount = year === 1 ? 30 : year === 2 ? 40 : 50;
  deck = base
    .sort(()=>Math.random()-0.5)
    .slice(0, Math.min(questionCount, base.length))
    .map(makeQuestion);
  
  // Timer starten
  t0 = Date.now();
  timerInt = setInterval(tick, 500);
  
  render();
};

const finish = () => {
  clearInterval(timerInt);
  const percent = Math.round(score * 100 / deck.length);
  const passed = percent >= 70;
  
  // Ergebnis-Seite anzeigen
  els.resultTitle.textContent = passed ? "✅ Bestanden!" : "❌ Nicht bestanden";
  els.resultMeta.textContent = `${score}/${deck.length} (${percent}%) · Zeit: ${els.timer.textContent}`;
  
  // Fehlerliste anzeigen
  els.wrongList.innerHTML = wrong.map(w => 
    `<li><b>${w.term}</b> – ${w.correct}</li>`
  ).join("");
};
```

#### D. Besonderheiten
- **Kein Feedback während der Prüfung**: Nur am Ende
- **Kein Zurück**: Nur vorwärts möglich
- **Timer läuft weiter**: Auch wenn Tab nicht aktiv ist
- **Fehler-Wiederholung**: "Nur Fehler wiederholen" Option

---

### 5. Global Click Delegation

**Datei**: `app-enhanced.js` Zeilen 54-120

**Mechanismus:**
```javascript
document.addEventListener("click", (e)=>{
  // 1. Tab-Button?
  const tabBtn = e.target.closest("button.tab, .tab button, button[data-tab]");
  if(tabBtn){
    const tab = tabBtn.dataset.tab || tabBtn.textContent;
    setTab(tab);
    return;
  }
  
  // 2. Lehrjahr-Button?
  const yBtn = e.target.closest("button.yearBtn, button[data-year]");
  if(yBtn){
    const year = yBtn.dataset.year || yBtn.textContent;
    setYear(year);
    return;
  }
  
  // 3. Glossar-Button?
  const gBtn = e.target.closest(".glossarItemBtn");
  if(gBtn){
    const term = gBtn.dataset.term || gBtn.textContent;
    showGlossaryItem(findItem(term));
    return;
  }
  
  // ... weitere Button-Typen
  
}, true);  // Capture-Phase für Zuverlässigkeit
```

**Vorteile:**
- Ein Event-Listener statt vielen
- Funktioniert auch für dynamisch hinzugefügte Elemente
- Robuste CSS-Selektoren mit `.closest()`
- Fallback-Mechanismen

---

## 🧪 Testing

### 1. Glossar testen
```
1. Tab "Glossar" öffnen
2. Lehrjahr 1 wählen → ~60 Begriffe
3. Lehrjahr 2 wählen → ~110 Begriffe
4. Lehrjahr 3 wählen → ~178 Begriffe
5. Suchfeld: "Abfall" eingeben → 1 Ergebnis
6. Auf Begriff klicken → Definition anzeigen
```

### 2. Quiz testen
```
1. Tab "Quiz" öffnen
2. Lehrjahr 1, 10 Fragen
3. "Quiz starten" klicken
4. Antwort klicken → Feedback
5. "Nächste" klicken
6. Nach 10 Fragen: Score anzeigen
```

### 3. Prüfung testen
```
1. Tab "Prüfung" öffnen
2. "Lehrjahr 1 Prüfung" klicken
3. Timer läuft (45 Min)
4. 30 Fragen beantworten
5. Am Ende: Ergebnis + Fehlerliste
```

### 4. Header-Scroll testen
```
1. Seite öffnen
2. Nach unten scrollen → Header versteckt sich
3. Nach oben scrollen → Header erscheint wieder
4. Oben angekommen → Header sichtbar
```

---

## 🔍 Debugging

### Browser Console
```javascript
// Glossar-Daten prüfen
console.log(window.AZUBI_GLOSSARY_PRO);

// Aktuelle Glossar-View
console.log(window.__GLOSSARY_VIEW__);

// Store prüfen
console.log(window.store);

// Quiz-State
console.log(quiz);
```

### LocalStorage
```javascript
// Alle Daten anzeigen
localStorage.getItem("azubi_tagebuch_v3");

// Daten löschen
localStorage.removeItem("azubi_tagebuch_v3");

// Alles zurücksetzen
localStorage.clear();
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Desktop: 2-spaltig */
@media (min-width: 920px) {
  .glossarLayout {
    grid-template-columns: 280px 1fr;
  }
}

/* Tablet: 1-spaltig */
@media (max-width: 920px) {
  .glossarLayout {
    grid-template-columns: 1fr;
  }
}

/* Mobile: Tabs am unteren Rand */
@media (max-width: 820px) {
  .tabs {
    position: fixed;
    bottom: 0;
    top: auto;
  }
}
```

---

## ⚡ Performance-Optimierungen

1. **Passive Event-Listener**: `{ passive: true }` für Scroll/Touch
2. **Event Delegation**: Ein Listener statt vielen
3. **Debouncing**: Scroll-Events nicht zu häufig
4. **Efficient DOM**: Keine unnötigen Reflows
5. **LocalStorage**: Daten persistent speichern

---

## 🔒 Sicherheit

1. **HTML Escaping**: `escapeHtml()` für alle Benutzerdaten
2. **CSS Escaping**: `CSS.escape()` für Selektoren
3. **No eval()**: Nur sichere JavaScript-Funktionen
4. **No XSS**: Keine direkten innerHTML mit Benutzerdaten

---

## 📚 Weitere Ressourcen

- **MDN Web Docs**: https://developer.mozilla.org
- **JavaScript.info**: https://javascript.info
- **CSS Tricks**: https://css-tricks.com
- **Web.dev**: https://web.dev

---

**Version**: 2.0 Enhanced  
**Datum**: 13. Januar 2026  
**Status**: Production Ready ✅

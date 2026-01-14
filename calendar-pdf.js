// ============================================================================
// KALENDER & PDF-EXPORT FUNKTIONALITÄT
// ============================================================================
// Erweitert die Kalender-Funktion mit:
// 1. Lehrjahrbeginn-Berechnung
// 2. PDF-Export pro Tag (sendbar und druckbar)

(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ========================================================================
  // LEHRJAHR-BEGINN BERECHNUNG
  // ========================================================================
  const getTrainingStartDate = (year) => {
    // Standardmäßig: 1. August des Jahres
    // (Typischer Ausbildungsbeginn in Deutschland)
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Wenn wir vor August sind, ist das Ausbildungsjahr des Vorjahres
    const trainingYear = now.getMonth() < 7 ? currentYear - 1 : currentYear;
    
    // Berechne das Startdatum basierend auf Lehrjahr
    const startDate = new Date(trainingYear, 7, 1); // 1. August
    
    // Für Lehrjahr 2 und 3: +12 Monate, +24 Monate
    const yearsToAdd = year - 1;
    startDate.setFullYear(startDate.getFullYear() + yearsToAdd);
    
    return startDate;
  };

  // ========================================================================
  // KALENDER-INITIALISIERUNG MIT LEHRJAHRBEGINN
  // ========================================================================
  const initCalendar = () => {
    // Hole aktuelles Lehrjahr
    const yearEl = document.querySelector('[data-year]');
    const currentYear = yearEl ? Number(yearEl.dataset.year) || 1 : 1;
    
    // Berechne Lehrjahrbeginn
    const startDate = getTrainingStartDate(currentYear);
    
    // Speichere im localStorage
    const key = `azubi_training_start_year${currentYear}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, startDate.toISOString());
    }
    
    return startDate;
  };

  // ========================================================================
  // PDF-EXPORT FUNKTIONEN
  // ========================================================================
  const generateDayPDF = () => {
    // Sammle alle Tages-Daten
    const dayDate = $('#dayDate')?.value || new Date().toISOString().split('T')[0];
    const dayShift = $('#dayShift')?.value || '';
    const dayStation = $('#dayStation')?.value || '';
    const dayTask = $('#dayTask')?.value || '';
    const dayLearningGoal = $('#dayLearningGoal')?.value || '';
    const dayLearned = $('#dayLearned')?.value || '';
    const dayStandard = $('#dayStandard')?.value || '';
    const dayStress = $('#dayStress')?.value || '5';
    const dayWentWell = $('#dayWentWell')?.value || '';
    const dayToImprove = $('#dayToImprove')?.value || '';
    const dayFreeNotes = $('#dayFreeNotes')?.value || '';

    // Sammle Checkboxes
    const checks = {
      water1: $('#dayWater1')?.checked || false,
      water2: $('#dayWater2')?.checked || false,
      water3: $('#dayWater3')?.checked || false,
      pause: $('#dayPause')?.checked || false,
      hygiene: $('#dayHygiene')?.checked || false,
      safety: $('#daySafety')?.checked || false,
      teamwork: $('#dayTeamwork')?.checked || false,
      communication: $('#dayCommunication')?.checked || false
    };

    // Formatiere Datum
    const dateObj = new Date(dayDate + 'T00:00:00');
    const dateStr = dateObj.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Erstelle HTML für PDF
    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Azubi-Tagebuch: ${dateStr}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    .page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #8b6f47;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #2f241b;
    }
    .date {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
    .section {
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      background: #f0e6d2;
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
      color: #2f241b;
    }
    .section-content {
      padding: 0 10px;
      font-size: 12px;
      line-height: 1.5;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .field {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fafaf8;
    }
    .field-label {
      font-weight: bold;
      font-size: 11px;
      color: #555;
      margin-bottom: 4px;
    }
    .field-value {
      font-size: 12px;
      color: #333;
      word-wrap: break-word;
    }
    .checks {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }
    .check-item {
      font-size: 11px;
      padding: 4px;
      border: 1px solid #ddd;
      border-radius: 3px;
      background: #fafaf8;
    }
    .check-item.checked {
      background: #d2c2a8;
      font-weight: bold;
    }
    .stress-bar {
      display: inline-block;
      width: 100%;
      height: 16px;
      background: #eee;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 4px;
    }
    .stress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #ffc107, #f44336);
      width: var(--stress-percent);
    }
    .footer {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .page { width: 100%; height: 100%; margin: 0; padding: 15mm; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="title">🍳 Azubi-Tagebuch Küche</div>
      <div class="date">${dateStr}</div>
    </div>

    <!-- SCHICHT & STATION -->
    <div class="section">
      <div class="section-title">Schicht & Bereich</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Schicht</div>
          <div class="field-value">${dayShift ? dayShift.charAt(0).toUpperCase() + dayShift.slice(1) : '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">Station / Bereich</div>
          <div class="field-value">${dayStation || '—'}</div>
        </div>
      </div>
      <div class="field">
        <div class="field-label">Hauptaufgabe</div>
        <div class="field-value">${dayTask || '—'}</div>
      </div>
    </div>

    <!-- LERNZIEL -->
    <div class="section">
      <div class="section-title">Lernziel heute</div>
      <div class="field">
        <div class="field-value">${dayLearningGoal || '—'}</div>
      </div>
    </div>

    <!-- GELERNT -->
    <div class="section">
      <div class="section-title">Was habe ich gelernt / geübt?</div>
      <div class="section-content">${dayLearned ? dayLearned.replace(/\n/g, '<br>') : '—'}</div>
    </div>

    <!-- STANDARD -->
    <div class="section">
      <div class="section-title">Standard / Regel verstanden</div>
      <div class="section-content">${dayStandard ? dayStandard.replace(/\n/g, '<br>') : '—'}</div>
    </div>

    <!-- BELASTUNG -->
    <div class="section">
      <div class="section-title">Belastung heute</div>
      <div class="field">
        <div class="stress-bar">
          <div class="stress-fill" style="--stress-percent: ${(dayStress / 10) * 100}%"></div>
        </div>
        <div style="font-size: 12px; margin-top: 4px; text-align: center;">${dayStress} / 10</div>
      </div>
    </div>

    <!-- WAS LIEF GUT / ZU VERBESSERN -->
    <div class="grid">
      <div class="section">
        <div class="section-title">Was lief gut?</div>
        <div class="section-content" style="font-size: 11px;">${dayWentWell ? dayWentWell.replace(/\n/g, '<br>') : '—'}</div>
      </div>
      <div class="section">
        <div class="section-title">Zu verbessern</div>
        <div class="section-content" style="font-size: 11px;">${dayToImprove ? dayToImprove.replace(/\n/g, '<br>') : '—'}</div>
      </div>
    </div>

    <!-- BASICS CHECKS -->
    <div class="section">
      <div class="section-title">Basics</div>
      <div class="checks">
        <div class="check-item ${checks.water1 ? 'checked' : ''}">✓ Wasser 1 ${checks.water1 ? '✔' : ''}</div>
        <div class="check-item ${checks.water2 ? 'checked' : ''}">✓ Wasser 2 ${checks.water2 ? '✔' : ''}</div>
        <div class="check-item ${checks.water3 ? 'checked' : ''}">✓ Wasser 3 ${checks.water3 ? '✔' : ''}</div>
        <div class="check-item ${checks.pause ? 'checked' : ''}">✓ Pause ${checks.pause ? '✔' : ''}</div>
        <div class="check-item ${checks.hygiene ? 'checked' : ''}">✓ Hygiene ${checks.hygiene ? '✔' : ''}</div>
        <div class="check-item ${checks.safety ? 'checked' : ''}">✓ Safety ${checks.safety ? '✔' : ''}</div>
        <div class="check-item ${checks.teamwork ? 'checked' : ''}">✓ Teamwork ${checks.teamwork ? '✔' : ''}</div>
        <div class="check-item ${checks.communication ? 'checked' : ''}">✓ Kommunikation ${checks.communication ? '✔' : ''}</div>
      </div>
    </div>

    <!-- FREIE NOTIZEN -->
    ${dayFreeNotes ? `
    <div class="section">
      <div class="section-title">Freie Notizen</div>
      <div class="section-content">${dayFreeNotes.replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}

    <div class="footer">
      Azubi-Tagebuch Küche · ${dateStr} · Seite 1
    </div>
  </div>
</body>
</html>
    `;

    return html;
  };

  // ========================================================================
  // PDF DOWNLOAD
  // ========================================================================
  const downloadPDF = () => {
    const html = generateDayPDF();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const dayDate = $('#dayDate')?.value || new Date().toISOString().split('T')[0];
    const filename = `Azubi-Tagebuch_${dayDate}.html`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // ========================================================================
  // PDF PRINT
  // ========================================================================
  const printPDF = () => {
    const html = generateDayPDF();
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Warte bis Seite geladen ist, dann drucken
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  // ========================================================================
  // PDF SHARE (Email)
  // ========================================================================
  const sharePDFByEmail = () => {
    const dayDate = $('#dayDate')?.value || new Date().toISOString().split('T')[0];
    const subject = `Azubi-Tagebuch: ${dayDate}`;
    const body = `Mein Azubi-Tagebuch vom ${dayDate}.\n\nBitte öffne die angehängte HTML-Datei im Browser.`;
    
    // Öffne Email-Client
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================
  
  // PDF Download Button
  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'btn';
  downloadBtn.textContent = '📥 PDF Download';
  downloadBtn.addEventListener('click', downloadPDF);

  // PDF Print Button
  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.className = 'btn';
  printBtn.textContent = '🖨️ Drucken';
  printBtn.addEventListener('click', printPDF);

  // PDF Share Button
  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'btn';
  shareBtn.textContent = '📧 Senden';
  shareBtn.addEventListener('click', sharePDFByEmail);

  // Füge Buttons zum Panel hinzu
  const dayPanelMeta = document.querySelector('#panel-day .panel__meta');
  if (dayPanelMeta) {
    dayPanelMeta.appendChild(downloadBtn);
    dayPanelMeta.appendChild(printBtn);
    dayPanelMeta.appendChild(shareBtn);
  }

  // ========================================================================
  // INITIALISIERUNG
  // ========================================================================
  initCalendar();

  // Mache Funktionen global verfügbar
  window.calendarFunctions = {
    getTrainingStartDate,
    generateDayPDF,
    downloadPDF,
    printPDF,
    sharePDFByEmail
  };

})();

/**
 * wissen.js - Wissens-Modul für Lehrjahr-Inhalte
 * Lädt und zeigt strukturierte Lehrjahr-Daten aus JSON-Dateien
 */

(function() {
  'use strict';

  const WissenModule = {
    currentYear: 1,
    data: {},
    searchTerm: '',

    async init() {
      // Lade alle 3 Lehrjahre
      try {
        const [lj1, lj2, lj3] = await Promise.all([
          fetch('lehrjahr_1.json').then(r => r.json()),
          fetch('lehrjahr_2.json').then(r => r.json()),
          fetch('lehrjahr_3.json').then(r => r.json())
        ]);
        
        this.data = {
          1: lj1,
          2: lj2,
          3: lj3
        };

        this.render();
        this.attachEvents();
      } catch (error) {
        console.error('Fehler beim Laden der Lehrjahr-Daten:', error);
        document.getElementById('wissenContent').innerHTML = `
          <div class="card">
            <p style="color: #d32f2f; font-weight: 700;">
              ⚠️ Fehler beim Laden der Wissens-Inhalte. Bitte Seite neu laden.
            </p>
          </div>
        `;
      }
    },

    attachEvents() {
      // Lehrjahr-Wechsel über Year-Buttons
      const yearBtns = document.querySelectorAll('.yearBtn');
      yearBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const year = parseInt(btn.dataset.year);
          if (year !== this.currentYear) {
            this.currentYear = year;
            this.render();
            
            // Update year buttons
            yearBtns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
          }
        });
      });

      // Suche
      const searchInput = document.getElementById('wissenSearch');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchTerm = e.target.value.toLowerCase().trim();
          this.render();
        });
      }

      // Nach oben scrollen
      const btnTop = document.getElementById('btnWissenTop');
      if (btnTop) {
        btnTop.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    },

    render() {
      const yearData = this.data[this.currentYear];
      if (!yearData) return;

      // Update Pill
      const pill = document.getElementById('wissenYearPill');
      if (pill) {
        pill.textContent = `Lehrjahr ${this.currentYear}`;
      }

      const content = document.getElementById('wissenContent');
      if (!content) return;

      let html = `
        <div class="card wissenContent">
          <h2>${yearData.titel}</h2>
          <div class="kv">
            <div><strong>Dauer:</strong></div>
            <div>${yearData.dauer_monate} Monate</div>
          </div>
          <div class="kv">
            <div><strong>Schulische Stunden:</strong></div>
            <div>${yearData.schulische_stunden} Stunden</div>
          </div>
          <div class="kv">
            <div><strong>Fokus:</strong></div>
            <div>${yearData.fokus}</div>
          </div>
      `;

      // Filter Lernfelder nach Suchbegriff
      let lernfelder = yearData.lernfelder || [];
      if (this.searchTerm) {
        lernfelder = lernfelder.filter(lf => {
          const searchable = [
            lf.titel,
            ...(lf.kernziele || []),
            ...(lf.praktische_fertigkeiten || []),
            ...(lf.theoretische_inhalte || [])
          ].join(' ').toLowerCase();
          return searchable.includes(this.searchTerm);
        });

        if (lernfelder.length === 0) {
          html += `
            <div class="divider"></div>
            <p style="color: #d32f2f; font-weight: 700;">
              Keine Ergebnisse für "${this.searchTerm}" gefunden.
            </p>
          `;
        }
      }

      // Lernfelder rendern
      if (lernfelder.length > 0) {
        html += `<div class="divider"></div><h3>Lernfelder (${lernfelder.length})</h3>`;

        lernfelder.forEach(lf => {
          html += `
            <div class="entry">
              <div class="entry__title">LF ${lf.lf_nummer}: ${lf.titel}</div>
              <div class="entry__meta">${lf.stunden} Stunden</div>
              <div class="entry__body">
          `;

          // Kernziele
          if (lf.kernziele && lf.kernziele.length > 0) {
            html += `
              <p style="margin-top: 12px;"><strong>Kernziele:</strong></p>
              <ul class="ul">
                ${lf.kernziele.map(k => `<li>${k}</li>`).join('')}
              </ul>
            `;
          }

          // Praktische Fertigkeiten
          if (lf.praktische_fertigkeiten && lf.praktische_fertigkeiten.length > 0) {
            html += `
              <p style="margin-top: 12px;"><strong>Praktische Fertigkeiten:</strong></p>
              <ul class="ul">
                ${lf.praktische_fertigkeiten.map(p => `<li>${p}</li>`).join('')}
              </ul>
            `;
          }

          // Theoretische Inhalte (nur Lehrjahr 2+3)
          if (lf.theoretische_inhalte && lf.theoretische_inhalte.length > 0) {
            html += `
              <p style="margin-top: 12px;"><strong>Theoretische Inhalte:</strong></p>
              <ul class="ul">
                ${lf.theoretische_inhalte.map(t => `<li>${t}</li>`).join('')}
              </ul>
            `;
          }

          html += `
              </div>
            </div>
          `;
        });
      }

      html += `</div>`;
      content.innerHTML = html;
    }
  };

  // Auto-Init wenn DOM bereit
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WissenModule.init());
  } else {
    WissenModule.init();
  }

  // Global verfügbar machen
  window.WissenModule = WissenModule;
})();

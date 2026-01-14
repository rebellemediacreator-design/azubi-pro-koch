/**
 * Toast-Benachrichtigungssystem für Azubi-App
 * Zeigt Erfolgs-, Fehler-, Warn- und Info-Meldungen an
 */

(function() {
  'use strict';

  // Toast-Container erstellen (wenn noch nicht vorhanden)
  function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Toast anzeigen
   * @param {Object} options - Toast-Optionen
   * @param {string} options.type - Toast-Typ: 'success', 'error', 'warning', 'info'
   * @param {string} options.title - Toast-Titel
   * @param {string} options.message - Toast-Nachricht (optional)
   * @param {number} options.duration - Anzeigedauer in ms (Standard: 5000, 0 = kein Auto-Dismiss)
   * @param {boolean} options.closable - Schließen-Button anzeigen (Standard: true)
   */
  function showToast(options) {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = 5000,
      closable = true
    } = options;

    // Validierung
    if (!title && !message) {
      console.warn('Toast: Titel oder Nachricht erforderlich');
      return;
    }

    const container = ensureToastContainer();

    // Toast-Element erstellen
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    // Icon je nach Typ
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    // Toast-HTML
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
        ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
      </div>
      ${closable ? '<button class="toast-close" aria-label="Schließen">&times;</button>' : ''}
      ${duration > 0 ? '<div class="toast-progress"><div class="toast-progress-bar"></div></div>' : ''}
    `;

    // Schließen-Button Event
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => {
        removeToast(toast);
      });
    }

    // Toast zum Container hinzufügen
    container.appendChild(toast);

    // Auto-Dismiss nach duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(toast);
      }, duration);
    }

    // Toast-Objekt zurückgeben (für manuelle Kontrolle)
    return {
      element: toast,
      close: () => removeToast(toast)
    };
  }

  /**
   * Toast entfernen mit Animation
   */
  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;

    toast.classList.add('removing');
    
    // Nach Animation entfernen
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * HTML escapen (XSS-Schutz)
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Alle Toasts entfernen
   */
  function clearAllToasts() {
    const container = document.getElementById('toast-container');
    if (container) {
      const toasts = container.querySelectorAll('.toast');
      toasts.forEach(toast => removeToast(toast));
    }
  }

  // Helper-Funktionen für häufige Fälle
  window.Toast = {
    show: showToast,
    clear: clearAllToasts,

    success: (title, message, duration) => {
      return showToast({ type: 'success', title, message, duration });
    },

    error: (title, message, duration) => {
      return showToast({ type: 'error', title, message, duration });
    },

    warning: (title, message, duration) => {
      return showToast({ type: 'warning', title, message, duration });
    },

    info: (title, message, duration) => {
      return showToast({ type: 'info', title, message, duration });
    }
  };

  // Globale Fehlerbehandlung (optional)
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Nur kritische Fehler als Toast anzeigen
    if (event.error && event.error.critical) {
      showToast({
        type: 'error',
        title: 'Ein Fehler ist aufgetreten',
        message: 'Bitte laden Sie die Seite neu.',
        duration: 0,
        closable: true
      });
    }
  });

  // Unhandled Promise Rejections (optional)
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Nur kritische Fehler als Toast anzeigen
    if (event.reason && event.reason.critical) {
      showToast({
        type: 'error',
        title: 'Ein Fehler ist aufgetreten',
        message: 'Bitte versuchen Sie es erneut.',
        duration: 0,
        closable: true
      });
    }
  });

  console.log('✅ Toast-System initialisiert');
})();

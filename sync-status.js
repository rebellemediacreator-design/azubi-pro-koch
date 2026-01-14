/**
 * Sync-Status UI für Azubi-App
 * Zeigt Sync-Queue und ermöglicht manuelle Synchronisation
 */

(function() {
  'use strict';

  /**
   * Sync-Status-Modal öffnen
   */
  function openSyncModal() {
    // Prüfe ob Modal bereits existiert
    if (document.getElementById('sync-modal-overlay')) {
      return;
    }

    // Lade aktuelle Queue-Daten
    const status = window.AzubiAPI ? window.AzubiAPI.getSyncQueueStatus() : {
      total: 0,
      pending: 0,
      failed: 0,
      success: 0,
      items: []
    };

    // Modal-HTML erstellen
    const overlay = document.createElement('div');
    overlay.className = 'sync-modal-overlay';
    overlay.id = 'sync-modal-overlay';
    overlay.innerHTML = `
      <div class="sync-modal" role="dialog" aria-labelledby="sync-modal-title">
        <div class="sync-modal-header">
          <h2 class="sync-modal-title" id="sync-modal-title">
            <span>🔄</span>
            Synchronisierungs-Status
          </h2>
          <button class="sync-modal-close" aria-label="Schließen" onclick="window.SyncStatus.close()">&times;</button>
        </div>
        
        <div class="sync-modal-body">
          <!-- Statistik-Karten -->
          <div class="sync-stats">
            <div class="sync-stat-card">
              <div class="sync-stat-value">${status.total}</div>
              <div class="sync-stat-label">Gesamt</div>
            </div>
            <div class="sync-stat-card pending">
              <div class="sync-stat-value">${status.pending}</div>
              <div class="sync-stat-label">Ausstehend</div>
            </div>
            <div class="sync-stat-card success">
              <div class="sync-stat-value">${status.success}</div>
              <div class="sync-stat-label">Erfolgreich</div>
            </div>
            <div class="sync-stat-card failed">
              <div class="sync-stat-value">${status.failed}</div>
              <div class="sync-stat-label">Fehlgeschlagen</div>
            </div>
          </div>

          <!-- Queue-Liste -->
          <div class="sync-queue-list" id="sync-queue-list">
            ${renderQueueItems(status.items)}
          </div>
        </div>

        <div class="sync-modal-footer">
          <button class="sync-modal-btn secondary" onclick="window.SyncStatus.close()">
            Schließen
          </button>
          ${status.pending > 0 ? `
            <button class="sync-modal-btn primary" onclick="window.SyncStatus.syncNow()" id="sync-now-btn">
              <span>🔄</span>
              Jetzt synchronisieren
            </button>
          ` : ''}
          ${status.total > 0 ? `
            <button class="sync-modal-btn danger" onclick="window.SyncStatus.clearAll()">
              <span>🗑️</span>
              Alle löschen
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Modal zum DOM hinzufügen
    document.body.appendChild(overlay);

    // Schließen bei Klick auf Overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeSyncModal();
      }
    });

    // ESC-Taste zum Schließen
    document.addEventListener('keydown', handleEscKey);
  }

  /**
   * Queue-Items rendern
   */
  function renderQueueItems(items) {
    if (items.length === 0) {
      return `
        <div class="sync-queue-empty">
          <div class="sync-queue-empty-icon">📭</div>
          <div>Keine Einträge in der Synchronisierungs-Queue</div>
        </div>
      `;
    }

    // Sortiere nach Timestamp (neueste zuerst)
    const sortedItems = [...items].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    return sortedItems.map(item => {
      const typeLabel = item.type === 'quiz' ? 'Quiz' : 'Prüfung';
      const statusLabel = {
        'pending': 'Ausstehend',
        'success': 'Erfolgreich',
        'failed': 'Fehlgeschlagen'
      }[item.status] || item.status;

      const icon = item.type === 'quiz' ? '📝' : '📋';
      
      const timestamp = new Date(item.timestamp).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const details = [];
      if (item.data.trainingYear) {
        details.push(`Lehrjahr ${item.data.trainingYear}`);
      }
      if (item.data.score !== undefined && item.data.questionCount) {
        details.push(`${item.data.score}/${item.data.questionCount} Punkte`);
      }
      if (item.retries > 0) {
        details.push(`${item.retries} Wiederholungen`);
      }

      return `
        <div class="sync-queue-item ${item.status}" data-item-id="${item.id}">
          <div class="sync-queue-icon">${icon}</div>
          <div class="sync-queue-content">
            <div class="sync-queue-header">
              <div class="sync-queue-type">${typeLabel}</div>
              <div class="sync-queue-status">${statusLabel}</div>
            </div>
            ${details.length > 0 ? `<div class="sync-queue-details">${details.join(' · ')}</div>` : ''}
            <div class="sync-queue-timestamp">${timestamp}</div>
          </div>
          <div class="sync-queue-actions">
            ${item.status === 'pending' ? `
              <button class="sync-queue-action-btn retry" 
                      onclick="window.SyncStatus.retryItem('${item.id}')" 
                      title="Erneut versuchen">
                🔄
              </button>
            ` : ''}
            <button class="sync-queue-action-btn delete" 
                    onclick="window.SyncStatus.deleteItem('${item.id}')" 
                    title="Löschen">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Sync-Status-Modal schließen
   */
  function closeSyncModal() {
    const overlay = document.getElementById('sync-modal-overlay');
    if (overlay) {
      overlay.remove();
    }
    document.removeEventListener('keydown', handleEscKey);
  }

  /**
   * ESC-Taste Handler
   */
  function handleEscKey(e) {
    if (e.key === 'Escape') {
      closeSyncModal();
    }
  }

  /**
   * Jetzt synchronisieren
   */
  async function syncNow() {
    if (!window.AzubiAPI) {
      console.error('AzubiAPI nicht verfügbar');
      return;
    }

    // Button deaktivieren und Loading anzeigen
    const btn = document.getElementById('sync-now-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="sync-loading"></span> Synchronisiere...';
    }

    try {
      // Synchronisation starten
      const result = await window.AzubiAPI.syncPendingResults();
      
      // Modal aktualisieren
      refreshModal();
      
      console.log('Synchronisation abgeschlossen:', result);
    } catch (error) {
      console.error('Fehler bei Synchronisation:', error);
      
      if (window.Toast) {
        window.Toast.error('Synchronisierung fehlgeschlagen', error.message, 5000);
      }
    } finally {
      // Button wieder aktivieren
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🔄</span> Jetzt synchronisieren';
      }
    }
  }

  /**
   * Einzelnes Item erneut versuchen
   */
  async function retryItem(itemId) {
    if (!window.AzubiAPI) {
      console.error('AzubiAPI nicht verfügbar');
      return;
    }

    try {
      const status = window.AzubiAPI.getSyncQueueStatus();
      const item = status.items.find(i => i.id == itemId);
      
      if (!item) {
        console.error('Item nicht gefunden:', itemId);
        return;
      }

      // Sende Ergebnis
      const result = item.type === 'quiz'
        ? await window.AzubiAPI.sendQuizResult(item.data)
        : await window.AzubiAPI.sendExamResult(item.data);

      // Modal aktualisieren
      refreshModal();
      
      console.log('Retry abgeschlossen:', result);
    } catch (error) {
      console.error('Fehler bei Retry:', error);
    }
  }

  /**
   * Einzelnes Item löschen
   */
  function deleteItem(itemId) {
    try {
      const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
      const filtered = queue.filter(item => item.id != itemId);
      
      localStorage.setItem('syncQueue', JSON.stringify(filtered));
      
      // Modal aktualisieren
      refreshModal();
      
      // Badge aktualisieren
      if (window.AzubiAPI) {
        const status = window.AzubiAPI.getSyncQueueStatus();
        const badge = document.getElementById('sync-badge');
        if (badge) {
          const pending = status.pending;
          if (pending > 0) {
            badge.textContent = pending;
            badge.style.display = 'inline-flex';
          } else {
            badge.style.display = 'none';
          }
        }
      }
      
      if (window.Toast) {
        window.Toast.info('Gelöscht', 'Eintrag wurde entfernt.', 2000);
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  }

  /**
   * Alle Items löschen
   */
  function clearAll() {
    if (!confirm('Möchten Sie wirklich alle Einträge löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    if (window.AzubiAPI) {
      window.AzubiAPI.clearSyncQueue();
    }

    // Modal schließen
    closeSyncModal();
  }

  /**
   * Modal-Inhalt aktualisieren
   */
  function refreshModal() {
    const overlay = document.getElementById('sync-modal-overlay');
    if (!overlay) return;

    // Lade aktuelle Daten
    const status = window.AzubiAPI ? window.AzubiAPI.getSyncQueueStatus() : {
      total: 0,
      pending: 0,
      failed: 0,
      success: 0,
      items: []
    };

    // Aktualisiere Statistik-Karten
    const statCards = overlay.querySelectorAll('.sync-stat-value');
    if (statCards.length >= 4) {
      statCards[0].textContent = status.total;
      statCards[1].textContent = status.pending;
      statCards[2].textContent = status.success;
      statCards[3].textContent = status.failed;
    }

    // Aktualisiere Queue-Liste
    const queueList = overlay.querySelector('#sync-queue-list');
    if (queueList) {
      queueList.innerHTML = renderQueueItems(status.items);
    }

    // Aktualisiere Footer-Buttons
    const footer = overlay.querySelector('.sync-modal-footer');
    if (footer) {
      footer.innerHTML = `
        <button class="sync-modal-btn secondary" onclick="window.SyncStatus.close()">
          Schließen
        </button>
        ${status.pending > 0 ? `
          <button class="sync-modal-btn primary" onclick="window.SyncStatus.syncNow()" id="sync-now-btn">
            <span>🔄</span>
            Jetzt synchronisieren
          </button>
        ` : ''}
        ${status.total > 0 ? `
          <button class="sync-modal-btn danger" onclick="window.SyncStatus.clearAll()">
            <span>🗑️</span>
            Alle löschen
          </button>
        ` : ''}
      `;
    }
  }

  // Globales Objekt für Zugriff
  window.SyncStatus = {
    open: openSyncModal,
    close: closeSyncModal,
    syncNow: syncNow,
    retryItem: retryItem,
    deleteItem: deleteItem,
    clearAll: clearAll,
    refresh: refreshModal
  };

  console.log('✅ Sync-Status UI geladen');
})();

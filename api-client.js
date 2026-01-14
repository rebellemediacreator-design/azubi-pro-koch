/**
 * API-Client für Azubi-App mit erweiterter Fehlerbehandlung
 * Sendet Quiz- und Prüfungsergebnisse an die Ausbilder-App
 */

// Konfigurations-Objekt (wird aus branding.json geladen)
let API_CONFIG = {
  enabled: false,
  apiUrl: null,
  apiKey: null,
  apprenticeId: null,
};

// Fehler-Typen und Meldungen
const ERROR_TYPES = {
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    title: 'Netzwerkfehler',
    message: 'Keine Verbindung zum Server. Ergebnis wird später synchronisiert.',
    retryable: true
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    title: 'Authentifizierung fehlgeschlagen',
    message: 'API-Schlüssel ungültig. Bitte Administrator kontaktieren.',
    retryable: false
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    title: 'Zugriff verweigert',
    message: 'Keine Berechtigung für diese Aktion.',
    retryable: false
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    title: 'Server nicht gefunden',
    message: 'API-Endpunkt nicht erreichbar. Bitte Konfiguration prüfen.',
    retryable: false
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    title: 'Ungültige Daten',
    message: 'Die gesendeten Daten sind fehlerhaft.',
    retryable: false
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    title: 'Serverfehler',
    message: 'Ein Fehler ist auf dem Server aufgetreten. Bitte später versuchen.',
    retryable: true
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    title: 'Zeitüberschreitung',
    message: 'Der Server antwortet nicht. Bitte später versuchen.',
    retryable: true
  },
  UNKNOWN: {
    code: 'UNKNOWN',
    title: 'Unbekannter Fehler',
    message: 'Ein unerwarteter Fehler ist aufgetreten.',
    retryable: true
  }
};

/**
 * API-Konfiguration initialisieren
 * Wird beim Laden der App aufgerufen
 */
async function initApiClient() {
  try {
    // Lade branding.json
    const response = await fetch('../config/branding.json');
    const branding = await response.json();
    
    // API-Konfiguration extrahieren
    if (branding.api && branding.api.enabled) {
      API_CONFIG = {
        enabled: true,
        apiUrl: branding.api.url,
        apiKey: branding.api.key,
        apprenticeId: branding.api.apprenticeId,
      };
      
      console.log('[API-Client] ✅ Initialisiert:', API_CONFIG.apiUrl);
      
      // Health-Check durchführen
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('[API-Client] ✅ Server erreichbar');
        if (window.Toast) {
          window.Toast.success('Verbunden', 'Server erfolgreich verbunden', 3000);
        }
      } else {
        console.warn('[API-Client] ⚠️ Server nicht erreichbar');
        if (window.Toast) {
          window.Toast.warning('Offline-Modus', 'Server nicht erreichbar. Ergebnisse werden später synchronisiert.', 5000);
        }
      }
    } else {
      console.log('[API-Client] ℹ️ API-Integration deaktiviert');
    }
  } catch (error) {
    console.error('[API-Client] ❌ Fehler beim Laden der Konfiguration:', error);
    if (window.Toast) {
      window.Toast.error('Konfigurationsfehler', 'API-Konfiguration konnte nicht geladen werden.', 5000);
    }
  }
}

/**
 * HTTP-Fehler in Error-Type umwandeln
 */
function getErrorType(error, statusCode) {
  // Netzwerk-Fehler (offline, DNS-Fehler, etc.)
  if (!navigator.onLine || error.message.includes('Failed to fetch')) {
    return ERROR_TYPES.NETWORK_ERROR;
  }
  
  // HTTP-Status-Codes
  switch (statusCode) {
    case 400:
      return ERROR_TYPES.VALIDATION_ERROR;
    case 401:
      return ERROR_TYPES.UNAUTHORIZED;
    case 403:
      return ERROR_TYPES.FORBIDDEN;
    case 404:
      return ERROR_TYPES.NOT_FOUND;
    case 408:
      return ERROR_TYPES.TIMEOUT;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_TYPES.SERVER_ERROR;
    default:
      return ERROR_TYPES.UNKNOWN;
  }
}

/**
 * API-Request mit Timeout und Fehlerbehandlung
 */
async function apiRequest(url, options, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorType = getErrorType(new Error(`HTTP ${response.status}`), response.status);
      throw {
        type: errorType,
        statusCode: response.status,
        statusText: response.statusText
      };
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Timeout-Fehler
    if (error.name === 'AbortError') {
      throw {
        type: ERROR_TYPES.TIMEOUT,
        statusCode: 408,
        statusText: 'Request Timeout'
      };
    }
    
    // Bereits formatierter Fehler
    if (error.type) {
      throw error;
    }
    
    // Netzwerk-Fehler
    const errorType = getErrorType(error, null);
    throw {
      type: errorType,
      statusCode: null,
      statusText: error.message
    };
  }
}

/**
 * Quiz-Ergebnis an Ausbilder-App senden
 * @param {Object} result - Quiz-Ergebnis
 * @returns {Promise<Object>} - API-Response
 */
async function sendQuizResult(result) {
  if (!API_CONFIG.enabled) {
    console.log('[API-Client] ℹ️ API deaktiviert, Quiz-Ergebnis wird nicht gesendet');
    return { success: false, reason: 'api_disabled' };
  }

  console.log('[API-Client] 📤 Sende Quiz-Ergebnis...');

  try {
    const payload = {
      apprenticeId: API_CONFIG.apprenticeId,
      trainingYear: result.trainingYear,
      questionCount: result.questionCount,
      correctAnswers: result.correctAnswers,
      score: result.score,
      passed: result.passed,
      duration: result.duration,
      completedAt: new Date().toISOString(),
    };

    const data = await apiRequest(
      `${API_CONFIG.apiUrl}/api/trpc/public.quiz`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_CONFIG.apiKey,
        },
        body: JSON.stringify(payload),
      },
      10000 // 10 Sekunden Timeout
    );

    console.log('[API-Client] ✅ Quiz-Ergebnis erfolgreich gesendet:', data);
    
    // Toast-Benachrichtigung
    if (window.Toast) {
      window.Toast.success('Ergebnis gesendet', 'Quiz-Ergebnis wurde erfolgreich übertragen.', 3000);
    }
    
    // Erfolg in Statistik speichern
    logApiSuccess('quiz');
    
    return { success: true, data };
  } catch (error) {
    console.error('[API-Client] ❌ Fehler beim Senden des Quiz-Ergebnisses:', error);
    
    // Fehler-Details loggen
    logApiError('quiz', error);
    
    // Toast-Benachrichtigung
    if (window.Toast) {
      if (error.type.retryable) {
        window.Toast.warning(
          error.type.title,
          error.type.message,
          5000
        );
      } else {
        window.Toast.error(
          error.type.title,
          error.type.message,
          0 // Kein Auto-Dismiss
        );
      }
    }
    
    // In Offline-Queue speichern (nur wenn retryable)
    if (error.type.retryable) {
      saveToSyncQueue('quiz', result, 'pending', error.type.code);
      console.log('[API-Client] 💾 Quiz-Ergebnis in Offline-Queue gespeichert');
    }
    
    return { 
      success: false, 
      error: error.type,
      retryable: error.type.retryable
    };
  }
}

/**
 * Prüfungs-Ergebnis an Ausbilder-App senden
 * @param {Object} result - Prüfungs-Ergebnis
 * @returns {Promise<Object>} - API-Response
 */
async function sendExamResult(result) {
  if (!API_CONFIG.enabled) {
    console.log('[API-Client] ℹ️ API deaktiviert, Prüfungs-Ergebnis wird nicht gesendet');
    return { success: false, reason: 'api_disabled' };
  }

  console.log('[API-Client] 📤 Sende Prüfungs-Ergebnis...');

  try {
    const payload = {
      apprenticeId: API_CONFIG.apprenticeId,
      trainingYear: result.trainingYear,
      simulationNumber: result.simulationNumber,
      questionCount: result.questionCount,
      correctAnswers: result.correctAnswers,
      score: result.score,
      passed: result.passed,
      duration: result.duration,
      timeLimit: result.timeLimit,
      completedAt: new Date().toISOString(),
      wrongAnswers: result.wrongAnswers || [],
    };

    const data = await apiRequest(
      `${API_CONFIG.apiUrl}/api/trpc/public.exam`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_CONFIG.apiKey,
        },
        body: JSON.stringify(payload),
      },
      10000 // 10 Sekunden Timeout
    );

    console.log('[API-Client] ✅ Prüfungs-Ergebnis erfolgreich gesendet:', data);
    
    // Toast-Benachrichtigung
    if (window.Toast) {
      window.Toast.success('Ergebnis gesendet', 'Prüfungs-Ergebnis wurde erfolgreich übertragen.', 3000);
    }
    
    // Erfolg in Statistik speichern
    logApiSuccess('exam');
    
    return { success: true, data };
  } catch (error) {
    console.error('[API-Client] ❌ Fehler beim Senden des Prüfungs-Ergebnisses:', error);
    
    // Fehler-Details loggen
    logApiError('exam', error);
    
    // Toast-Benachrichtigung
    if (window.Toast) {
      if (error.type.retryable) {
        window.Toast.warning(
          error.type.title,
          error.type.message,
          5000
        );
      } else {
        window.Toast.error(
          error.type.title,
          error.type.message,
          0 // Kein Auto-Dismiss
        );
      }
    }
    
    // In Offline-Queue speichern (nur wenn retryable)
    if (error.type.retryable) {
      saveToSyncQueue('exam', result, 'pending', error.type.code);
      console.log('[API-Client] 💾 Prüfungs-Ergebnis in Offline-Queue gespeichert');
    }
    
    return { 
      success: false, 
      error: error.type,
      retryable: error.type.retryable
    };
  }
}

/**
 * Offline-Queue: Ergebnis speichern
 * @param {string} type - 'quiz' oder 'exam'
 * @param {Object} data - Ergebnis-Daten
 * @param {string} status - 'pending' oder 'success'
 * @param {string} errorCode - Fehler-Code (optional)
 */
function saveToSyncQueue(type, data, status, errorCode = null) {
  try {
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    
    // Prüfe ob bereits vorhanden (Duplikat-Vermeidung)
    const exists = queue.some(item => 
      item.type === type && 
      JSON.stringify(item.data) === JSON.stringify(data)
    );
    
    if (exists && status === 'pending') {
      console.log('[API-Client] ℹ️ Ergebnis bereits in Queue vorhanden');
      return;
    }
    
    queue.push({
      id: Date.now() + Math.random(), // Eindeutige ID
      type,
      data,
      status,
      errorCode,
      retries: 0,
      maxRetries: 3,
      timestamp: new Date().toISOString(),
    });
    
    localStorage.setItem('syncQueue', JSON.stringify(queue));
    
    // Aktualisiere Badge-Zähler
    updateSyncBadge();
    
    console.log(`[API-Client] 💾 ${type}-Ergebnis in Queue gespeichert (${queue.length} gesamt)`);
  } catch (error) {
    console.error('[API-Client] ❌ Fehler beim Speichern in Sync-Queue:', error);
  }
}

/**
 * Offline-Queue: Alle ausstehenden Ergebnisse senden mit Retry-Logik
 * @returns {Promise<Object>} - Sync-Ergebnis
 */
async function syncPendingResults() {
  if (!API_CONFIG.enabled) {
    return { success: false, reason: 'api_disabled' };
  }

  try {
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    const pending = queue.filter(item => 
      item.status === 'pending' && 
      item.retries < item.maxRetries
    );
    
    if (pending.length === 0) {
      console.log('[API-Client] ℹ️ Keine ausstehenden Ergebnisse zum Synchronisieren');
      return { success: true, synced: 0 };
    }

    console.log(`[API-Client] 🔄 Synchronisiere ${pending.length} ausstehende Ergebnisse...`);
    
    // Toast-Benachrichtigung
    if (window.Toast) {
      window.Toast.info('Synchronisierung', `Übertrage ${pending.length} ausstehende Ergebnisse...`, 3000);
    }
    
    let synced = 0;
    let failed = 0;
    
    for (const item of pending) {
      // Exponential Backoff: 1s, 2s, 4s
      const delay = Math.pow(2, item.retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const result = item.type === 'quiz' 
        ? await sendQuizResult(item.data)
        : await sendExamResult(item.data);
      
      // Finde Item in Queue und aktualisiere
      const queueIndex = queue.findIndex(q => q.id === item.id);
      if (queueIndex !== -1) {
        if (result.success) {
          queue[queueIndex].status = 'success';
          synced++;
        } else {
          queue[queueIndex].retries++;
          if (queue[queueIndex].retries >= queue[queueIndex].maxRetries) {
            queue[queueIndex].status = 'failed';
            failed++;
          }
        }
      }
    }
    
    // Speichere aktualisierte Queue
    localStorage.setItem('syncQueue', JSON.stringify(queue));
    
    // Aktualisiere Badge-Zähler
    updateSyncBadge();
    
    console.log(`[API-Client] ✅ Synchronisation abgeschlossen: ${synced} erfolgreich, ${failed} fehlgeschlagen`);
    
    // Toast-Benachrichtigung
    if (window.Toast) {
      if (synced > 0) {
        window.Toast.success('Synchronisiert', `${synced} Ergebnisse erfolgreich übertragen.`, 5000);
      }
      if (failed > 0) {
        window.Toast.error('Fehler', `${failed} Ergebnisse konnten nicht übertragen werden.`, 5000);
      }
    }
    
    return { success: true, synced, failed, total: pending.length };
  } catch (error) {
    console.error('[API-Client] ❌ Fehler bei der Synchronisation:', error);
    
    if (window.Toast) {
      window.Toast.error('Synchronisierung fehlgeschlagen', 'Bitte später erneut versuchen.', 5000);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Badge-Zähler für ausstehende Sync-Aufgaben aktualisieren
 */
function updateSyncBadge() {
  try {
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    const pending = queue.filter(item => item.status === 'pending').length;
    
    // Badge-Element finden und aktualisieren
    const badge = document.getElementById('sync-badge');
    if (badge) {
      if (pending > 0) {
        badge.textContent = pending;
        badge.style.display = 'inline-flex';
        badge.classList.add('pulse');
      } else {
        badge.style.display = 'none';
        badge.classList.remove('pulse');
      }
    }
  } catch (error) {
    console.error('[API-Client] ❌ Fehler beim Aktualisieren des Sync-Badges:', error);
  }
}

/**
 * Health-Check: API-Verbindung testen
 * @returns {Promise<boolean>} - true wenn API erreichbar
 */
async function checkApiHealth() {
  if (!API_CONFIG.enabled) {
    return false;
  }

  try {
    const response = await fetch(`${API_CONFIG.apiUrl}/api/trpc/public.health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 Sekunden Timeout
    });

    return response.ok;
  } catch (error) {
    console.error('[API-Client] ❌ API nicht erreichbar:', error);
    return false;
  }
}

/**
 * API-Erfolg in Statistik loggen
 */
function logApiSuccess(type) {
  try {
    const stats = JSON.parse(localStorage.getItem('apiStats') || '{"success": 0, "errors": {}}');
    stats.success = (stats.success || 0) + 1;
    stats.lastSuccess = new Date().toISOString();
    localStorage.setItem('apiStats', JSON.stringify(stats));
  } catch (error) {
    console.error('[API-Client] ❌ Fehler beim Loggen des Erfolgs:', error);
  }
}

/**
 * API-Fehler in Statistik loggen
 */
function logApiError(type, error) {
  try {
    const stats = JSON.parse(localStorage.getItem('apiStats') || '{"success": 0, "errors": {}}');
    const errorCode = error.type?.code || 'UNKNOWN';
    
    if (!stats.errors) stats.errors = {};
    stats.errors[errorCode] = (stats.errors[errorCode] || 0) + 1;
    stats.lastError = {
      code: errorCode,
      type: type,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('apiStats', JSON.stringify(stats));
  } catch (err) {
    console.error('[API-Client] ❌ Fehler beim Loggen des Fehlers:', err);
  }
}

/**
 * Sync-Queue zurücksetzen (alle Einträge löschen)
 */
function clearSyncQueue() {
  try {
    localStorage.removeItem('syncQueue');
    updateSyncBadge();
    console.log('[API-Client] 🗑️ Sync-Queue geleert');
    
    if (window.Toast) {
      window.Toast.info('Queue geleert', 'Alle ausstehenden Ergebnisse wurden entfernt.', 3000);
    }
  } catch (error) {
    console.error('[API-Client] ❌ Fehler beim Leeren der Queue:', error);
  }
}

/**
 * Sync-Queue Status abrufen
 */
function getSyncQueueStatus() {
  try {
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    const pending = queue.filter(item => item.status === 'pending');
    const failed = queue.filter(item => item.status === 'failed');
    const success = queue.filter(item => item.status === 'success');
    
    return {
      total: queue.length,
      pending: pending.length,
      failed: failed.length,
      success: success.length,
      items: queue
    };
  } catch (error) {
    console.error('[API-Client] ❌ Fehler beim Abrufen des Queue-Status:', error);
    return { total: 0, pending: 0, failed: 0, success: 0, items: [] };
  }
}

// Globales API-Objekt für einfachen Zugriff
window.AzubiAPI = {
  sendQuizResult,
  sendExamResult,
  syncPendingResults,
  checkApiHealth,
  clearSyncQueue,
  getSyncQueueStatus,
  getConfig: () => API_CONFIG
};

// Initialisiere API-Client beim Laden der Seite
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[API-Client] 🚀 Initialisiere...');
  
  await initApiClient();
  updateSyncBadge();
  
  // Versuche automatisch zu synchronisieren, wenn online
  if (navigator.onLine && API_CONFIG.enabled) {
    // Warte 2 Sekunden, damit die App vollständig geladen ist
    setTimeout(async () => {
      await syncPendingResults();
    }, 2000);
  }
});

// Event-Listener für Online-Status
window.addEventListener('online', async () => {
  console.log('[API-Client] 🌐 Netzwerk wieder verfügbar');
  
  if (window.Toast) {
    window.Toast.info('Online', 'Netzwerk wieder verfügbar. Synchronisiere...', 3000);
  }
  
  await syncPendingResults();
});

// Event-Listener für Offline-Status
window.addEventListener('offline', () => {
  console.log('[API-Client] 📴 Netzwerk nicht verfügbar');
  
  if (window.Toast) {
    window.Toast.warning('Offline', 'Keine Netzwerkverbindung. Ergebnisse werden später synchronisiert.', 5000);
  }
});

console.log('[API-Client] ✅ Modul geladen');

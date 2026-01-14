// ============================================================================
// PRÜFUNG (EXAM) - VOLLSTÄNDIG FUNKTIONIERENDE IMPLEMENTIERUNG
// ============================================================================
// Dieses Script ersetzt die Prüfungs-Logik in app-enhanced.js
// Es funktioniert mit der neuen HTML-Struktur mit 3 Simulationen pro Lehrjahr

(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ========================================================================
  // CONFIGURATION
  // ========================================================================
  const examConfig = {
    1: { questions: 30, timeLimit: 45 * 60, passingScore: 70 },
    2: { questions: 40, timeLimit: 60 * 60, passingScore: 70 },
    3: { questions: 50, timeLimit: 75 * 60, passingScore: 70 }
  };

  // ========================================================================
  // STATE
  // ========================================================================
  let examState = {
    year: null,
    pool: [],
    deck: [],
    currentIndex: 0,
    score: 0,
    wrong: [],
    startTime: null,
    timerInterval: null
  };

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================
  const escapeHtml = (s) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return String(s || "").replace(/[&<>"']/g, m => map[m]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGlossaryPool = () => {
    return window.AZUBI_GLOSSARY_PRO?.items || [];
  };

  // ========================================================================
  // BUILD EXAM POOL
  // ========================================================================
  const buildExamPool = (year) => {
    const pool = getGlossaryPool();
    return pool.filter(it => (it.years || []).includes(Number(year)));
  };

  // ========================================================================
  // GENERATE QUESTION
  // ========================================================================
  const generateQuestion = (item, pool) => {
    const correct = item.definition || "";
    
    const distractors = pool
      .filter(x => 
        x.term !== item.term && 
        x.definition && 
        x.definition !== correct
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.definition);

    const choices = [correct, ...distractors]
      .sort(() => Math.random() - 0.5);

    return {
      term: item.term,
      definition: correct,
      choices: choices,
      answered: false,
      selectedAnswer: null,
      isCorrect: false
    };
  };

  // ========================================================================
  // SCREEN MANAGEMENT
  // ========================================================================
  const showScreen = (screen) => {
    const home = $('#examHome');
    const run = $('#examRun');
    const result = $('#examResult');

    if (home) home.style.display = screen === 'home' ? 'block' : 'none';
    if (run) run.style.display = screen === 'run' ? 'block' : 'none';
    if (result) result.style.display = screen === 'result' ? 'block' : 'none';
  };

  // ========================================================================
  // TIMER
  // ========================================================================
  const startTimer = () => {
    examState.startTime = Date.now();
    
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - examState.startTime) / 1000);
      const config = examConfig[examState.year];
      const remaining = Math.max(0, config.timeLimit - elapsed);
      
      const timerEl = $('#examTimer');
      if (timerEl) {
        timerEl.textContent = formatTime(remaining);
      }
      
      if (remaining <= 0) {
        stopTimer();
        finishExam();
      }
    };
    
    updateTimer();
    examState.timerInterval = setInterval(updateTimer, 500);
  };

  const stopTimer = () => {
    if (examState.timerInterval) {
      clearInterval(examState.timerInterval);
      examState.timerInterval = null;
    }
  };

  // ========================================================================
  // RENDER QUESTION
  // ========================================================================
  const renderQuestion = () => {
    const q = examState.deck[examState.currentIndex];
    
    if (!q) {
      finishExam();
      return;
    }

    // Update progress
    const progress = examState.currentIndex + 1;
    const total = examState.deck.length;
    
    const progressEl = $('#examProgress');
    if (progressEl) {
      progressEl.textContent = `${progress}/${total}`;
    }

    const nameEl = $('#examName');
    if (nameEl) {
      nameEl.textContent = `Prüfung LJ${examState.year}`;
    }

    // Show question
    const metaEl = $('#examQMeta');
    if (metaEl) {
      metaEl.textContent = `Frage ${progress} von ${total}`;
    }

    const textEl = $('#examQText');
    if (textEl) {
      textEl.textContent = q.term;
    }

    // Render choices
    const choicesEl = $('#examChoices');
    if (choicesEl) {
      choicesEl.innerHTML = q.choices.map((choice, idx) => `
        <button 
          type="button" 
          class="choice" 
          data-choice-idx="${idx}"
          data-answer="${escapeHtml(choice)}"
        >
          ${escapeHtml(choice)}
        </button>
      `).join('');

      // Add click handlers
      $$('.choice', choicesEl).forEach(btn => {
        btn.addEventListener('click', () => selectAnswer(btn));
      });
    }

    // Disable next button
    const nextEl = $('#examNext');
    if (nextEl) {
      nextEl.disabled = true;
    }
  };

  // ========================================================================
  // SELECT ANSWER
  // ========================================================================
  const selectAnswer = (btn) => {
    if (btn.disabled) return;

    const q = examState.deck[examState.currentIndex];
    const selectedAnswer = btn.dataset.answer;

    q.answered = true;
    q.selectedAnswer = selectedAnswer;
    q.isCorrect = selectedAnswer === q.definition;

    if (q.isCorrect) {
      examState.score++;
    } else {
      examState.wrong.push(q);
    }

    // Disable all choices
    $$('.choice').forEach(b => {
      b.disabled = true;
    });

    // Enable next button
    const nextEl = $('#examNext');
    if (nextEl) {
      nextEl.disabled = false;
    }
  };

  // ========================================================================
  // NEXT QUESTION
  // ========================================================================
  const nextQuestion = () => {
    examState.currentIndex++;
    
    if (examState.currentIndex >= examState.deck.length) {
      finishExam();
    } else {
      renderQuestion();
    }
  };

  // ========================================================================
  // FINISH EXAM
  // ========================================================================
  const finishExam = () => {
    stopTimer();
    
    const total = examState.deck.length;
    const score = examState.score;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= examConfig[examState.year].passingScore;
    const timeUsed = formatTime(Math.floor((Date.now() - examState.startTime) / 1000));

    // Update result screen
    const resultTitleEl = $('#examResultTitle');
    if (resultTitleEl) {
      resultTitleEl.textContent = passed ? '✅ Bestanden!' : '❌ Nicht bestanden';
    }

    const resultMetaEl = $('#examResultMeta');
    if (resultMetaEl) {
      resultMetaEl.textContent = `Ergebnis: ${score}/${total} (${percent}%) · Zeit: ${timeUsed}`;
    }

    // Show wrong answers
    const wrongListEl = $('#examWrongList');
    if (wrongListEl) {
      if (examState.wrong.length > 0) {
        wrongListEl.innerHTML = examState.wrong.map(w => `
          <li>
            <b>${escapeHtml(w.term)}</b><br>
            Ihre Antwort: ${escapeHtml(w.selectedAnswer)}<br>
            Richtig: ${escapeHtml(w.definition)}
          </li>
        `).join('');
      } else {
        wrongListEl.innerHTML = '<li>Keine Fehler - Perfekt! 🎉</li>';
      }
    }

    // Update status
    const statusEl = $('#examStatusPill');
    if (statusEl) {
      statusEl.textContent = 'Fertig';
    }

    // Show result screen
    showScreen('result');
    
    // API-Integration: Prüfungs-Ergebnis an Ausbilder-App senden
    if (window.AzubiAPI) {
      const duration = Math.floor((Date.now() - examState.startTime) / 1000);
      const timeLimit = examConfig[examState.year].timeLimit * 60;
      
      window.AzubiAPI.sendExamResult({
        trainingYear: examState.year,
        simulationNumber: 1, // TODO: Simulation-Nummer aus UI holen
        questionCount: total,
        correctAnswers: score,
        score: percent,
        passed: passed,
        duration: duration,
        timeLimit: timeLimit,
        wrongAnswers: examState.wrong.map(w => ({
          questionNumber: w.index || 0,
          question: w.term,
          correctAnswer: w.definition,
          userAnswer: w.selectedAnswer,
        })),
      }).then(result => {
        if (result.success) {
          console.log('[Prüfung] ✅ Ergebnis erfolgreich gesendet');
          // Toast wird bereits von api-client.js angezeigt
        } else {
          console.log('[Prüfung] 💾 Ergebnis wird später synchronisiert');
          // Toast wird bereits von api-client.js angezeigt
        }
      }).catch(error => {
        console.error('[Prüfung] ❌ Fehler beim Senden:', error);
      });
    }
  };

  // ========================================================================
  // START EXAM
  // ========================================================================
  const startExam = (year, retryWrong = false) => {
    examState.year = year;
    examState.currentIndex = 0;
    examState.score = 0;

    // Build pool
    examState.pool = buildExamPool(year);
    
    if (examState.pool.length === 0) {
      alert(`Keine Fragen für Lehrjahr ${year} verfügbar!`);
      return;
    }

    // Build deck
    const config = examConfig[year];
    let baseDeck = retryWrong ? examState.wrong : examState.pool;
    
    if (!retryWrong) {
      examState.wrong = [];
    }

    examState.deck = baseDeck
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(config.questions, baseDeck.length))
      .map(item => generateQuestion(item, examState.pool));

    // Update status
    const statusEl = $('#examStatusPill');
    if (statusEl) {
      statusEl.textContent = 'Läuft';
    }

    // Show run screen
    showScreen('run');
    
    // Start timer
    startTimer();
    
    // Render first question
    renderQuestion();
  };

  // ========================================================================
  // RESET EXAM
  // ========================================================================
  const resetExam = () => {
    stopTimer();
    examState = {
      year: null,
      pool: [],
      deck: [],
      currentIndex: 0,
      score: 0,
      wrong: [],
      startTime: null,
      timerInterval: null
    };
    
    const statusEl = $('#examStatusPill');
    if (statusEl) {
      statusEl.textContent = 'Bereit';
    }

    const timerEl = $('#examTimer');
    if (timerEl) {
      timerEl.textContent = '0:00';
    }

    showScreen('home');
  };

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  // Start buttons (new style with data attributes)
  $$('.exam-start-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const year = btn.dataset.year;
      if (year) {
        startExam(Number(year), false);
      }
    });
  });

  // Next button
  const nextBtn = $('#examNext');
  if (nextBtn) {
    nextBtn.addEventListener('click', nextQuestion);
  }

  // Abort button
  const abortBtn = $('#examAbort');
  if (abortBtn) {
    abortBtn.addEventListener('click', () => {
      if (confirm('Prüfung wirklich abbrechen?')) {
        resetExam();
      }
    });
  }

  // Reset button
  const resetBtn = $('#examReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetExam();
      alert('Prüfung zurückgesetzt');
    });
  }

  // Retry wrong button
  const retryWrongBtn = $('#examRetryWrong');
  if (retryWrongBtn) {
    retryWrongBtn.addEventListener('click', () => {
      if (examState.wrong.length === 0) {
        alert('Keine Fehler zum Wiederholen!');
        return;
      }
      startExam(examState.year, true);
    });
  }

  // Back home button
  const backHomeBtn = $('#examBackHome');
  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      resetExam();
      if (typeof setTab === 'function') {
        setTab('start');
      }
    });
  }

  // ========================================================================
  // INITIALIZE
  // ========================================================================
  showScreen('home');

  // Make functions globally available for debugging
  window.examFunctions = {
    startExam,
    resetExam,
    nextQuestion,
    state: () => examState
  };

})();

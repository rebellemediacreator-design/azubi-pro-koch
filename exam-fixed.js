// ============================================================================
// EXAM (PRÜFUNG) - VOLLSTÄNDIG REPARIERTE IMPLEMENTIERUNG
// ============================================================================

(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ========================================================================
  // EXAM STATE & CONFIGURATION
  // ========================================================================
  const examConfig = {
    1: { questions: 30, timeLimit: 45 * 60, passingScore: 70 },
    2: { questions: 40, timeLimit: 60 * 60, passingScore: 70 },
    3: { questions: 50, timeLimit: 75 * 60, passingScore: 70 }
  };

  let currentExam = {
    year: null,
    pool: [],
    deck: [],
    currentIndex: 0,
    score: 0,
    wrong: [],
    startTime: null,
    timerInterval: null,
    answered: new Set()
  };

  // ========================================================================
  // DOM ELEMENTS
  // ========================================================================
  const examElements = {
    // Home screen
    homeScreen: $('#examHome'),
    startBtns: {
      1: $('#examStart1'),
      2: $('#examStart2'),
      3: $('#examStart3')
    },
    
    // Running exam
    runScreen: $('#examRun'),
    examName: $('#examName'),
    examProgress: $('#examProgress'),
    examTimer: $('#examTimer'),
    examAbort: $('#examAbort'),
    examQMeta: $('#examQMeta'),
    examQText: $('#examQText'),
    examChoices: $('#examChoices'),
    examNext: $('#examNext'),
    
    // Results
    resultScreen: $('#examResult'),
    resultTitle: $('#examResultTitle'),
    resultMeta: $('#examResultMeta'),
    retryWrong: $('#examRetryWrong'),
    backHome: $('#examBackHome'),
    wrongList: $('#examWrongList'),
    
    // Status
    statusPill: $('#examStatusPill'),
    resetBtn: $('#examReset')
  };

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================
  const escapeHtml = (s) => String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGlossaryPool = () => {
    const g = window.AZUBI_GLOSSARY_PRO?.items || [];
    return g;
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
    
    // Get 3 distractors (different terms, different definitions)
    const distractors = pool
      .filter(x => 
        x.term !== item.term && 
        x.definition && 
        x.definition !== correct
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.definition);

    // Mix correct answer with distractors
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
  // TIMER
  // ========================================================================
  const startTimer = () => {
    currentExam.startTime = Date.now();
    
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - currentExam.startTime) / 1000);
      const config = examConfig[currentExam.year];
      const remaining = Math.max(0, config.timeLimit - elapsed);
      
      examElements.examTimer.textContent = formatTime(remaining);
      
      if (remaining <= 0) {
        clearInterval(currentExam.timerInterval);
        finishExam();
      }
    };
    
    updateTimer(); // Initial update
    currentExam.timerInterval = setInterval(updateTimer, 500);
  };

  const stopTimer = () => {
    if (currentExam.timerInterval) {
      clearInterval(currentExam.timerInterval);
      currentExam.timerInterval = null;
    }
  };

  // ========================================================================
  // RENDER EXAM SCREEN
  // ========================================================================
  const showHomeScreen = () => {
    examElements.homeScreen.style.display = 'block';
    examElements.runScreen.style.display = 'none';
    examElements.resultScreen.style.display = 'none';
  };

  const showRunScreen = () => {
    examElements.homeScreen.style.display = 'none';
    examElements.runScreen.style.display = 'block';
    examElements.resultScreen.style.display = 'none';
  };

  const showResultScreen = () => {
    examElements.homeScreen.style.display = 'none';
    examElements.runScreen.style.display = 'none';
    examElements.resultScreen.style.display = 'block';
  };

  const renderQuestion = () => {
    const q = currentExam.deck[currentExam.currentIndex];
    
    if (!q) {
      finishExam();
      return;
    }

    // Update progress
    const progress = currentExam.currentIndex + 1;
    const total = currentExam.deck.length;
    examElements.examProgress.textContent = `${progress}/${total}`;
    examElements.examName.textContent = `Prüfung LJ${currentExam.year}`;

    // Show question
    examElements.examQMeta.textContent = `Frage ${progress} von ${total}`;
    examElements.examQText.textContent = q.term;

    // Render choices
    examElements.examChoices.innerHTML = q.choices.map((choice, idx) => `
      <button 
        type="button" 
        class="choice" 
        data-choice-idx="${idx}"
        data-answer="${escapeHtml(choice)}"
      >
        ${escapeHtml(choice)}
      </button>
    `).join('');

    // Disable next button until answered
    examElements.examNext.disabled = true;

    // Add click handlers to choices
    $$('.choice', examElements.examChoices).forEach(btn => {
      btn.addEventListener('click', () => selectAnswer(btn));
    });
  };

  // ========================================================================
  // SELECT ANSWER
  // ========================================================================
  const selectAnswer = (btn) => {
    if (btn.disabled) return;

    const q = currentExam.deck[currentExam.currentIndex];
    const selectedAnswer = btn.dataset.answer;

    // Mark as answered
    q.answered = true;
    q.selectedAnswer = selectedAnswer;
    q.isCorrect = selectedAnswer === q.definition;

    // Track score
    if (q.isCorrect) {
      currentExam.score++;
    } else {
      currentExam.wrong.push(q);
    }

    // Disable all choices
    $$('.choice', examElements.examChoices).forEach(b => {
      b.disabled = true;
    });

    // Enable next button
    examElements.examNext.disabled = false;
  };

  // ========================================================================
  // NEXT QUESTION
  // ========================================================================
  const nextQuestion = () => {
    currentExam.currentIndex++;
    
    if (currentExam.currentIndex >= currentExam.deck.length) {
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
    
    const total = currentExam.deck.length;
    const score = currentExam.score;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= examConfig[currentExam.year].passingScore;
    const timeUsed = formatTime(Math.floor((Date.now() - currentExam.startTime) / 1000));

    // Update result screen
    examElements.resultTitle.textContent = passed ? '✅ Bestanden!' : '❌ Nicht bestanden';
    examElements.resultMeta.textContent = `Ergebnis: ${score}/${total} (${percent}%) · Zeit: ${timeUsed}`;

    // Show wrong answers
    if (currentExam.wrong.length > 0) {
      examElements.wrongList.innerHTML = currentExam.wrong.map(w => `
        <li>
          <b>${escapeHtml(w.term)}</b><br>
          Ihre Antwort: ${escapeHtml(w.selectedAnswer)}<br>
          Richtig: ${escapeHtml(w.definition)}
        </li>
      `).join('');
    } else {
      examElements.wrongList.innerHTML = '<li>Keine Fehler - Perfekt!</li>';
    }

    // Update status
    examElements.statusPill.textContent = 'Fertig';

    // Show result screen
    showResultScreen();
  };

  // ========================================================================
  // START EXAM
  // ========================================================================
  const startExam = (year, retryWrong = false) => {
    currentExam.year = year;
    currentExam.currentIndex = 0;
    currentExam.score = 0;
    currentExam.answered = new Set();

    // Build pool
    currentExam.pool = buildExamPool(year);
    
    if (currentExam.pool.length === 0) {
      alert(`Keine Fragen für Lehrjahr ${year} verfügbar!`);
      return;
    }

    // Build deck
    const config = examConfig[year];
    let baseDeck = retryWrong ? currentExam.wrong : currentExam.pool;
    
    if (!retryWrong) {
      currentExam.wrong = [];
    }

    // Shuffle and select questions
    currentExam.deck = baseDeck
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(config.questions, baseDeck.length))
      .map(item => generateQuestion(item, currentExam.pool));

    // Start
    examElements.statusPill.textContent = 'Läuft';
    showRunScreen();
    startTimer();
    renderQuestion();
  };

  // ========================================================================
  // RESET EXAM
  // ========================================================================
  const resetExam = () => {
    stopTimer();
    currentExam = {
      year: null,
      pool: [],
      deck: [],
      currentIndex: 0,
      score: 0,
      wrong: [],
      startTime: null,
      timerInterval: null,
      answered: new Set()
    };
    examElements.statusPill.textContent = 'Bereit';
    examElements.examTimer.textContent = '0:00';
    showHomeScreen();
  };

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  // Start buttons (old style - for compatibility)
  if (examElements.startBtns[1]) {
    examElements.startBtns[1].addEventListener('click', () => startExam(1));
  }
  if (examElements.startBtns[2]) {
    examElements.startBtns[2].addEventListener('click', () => startExam(2));
  }
  if (examElements.startBtns[3]) {
    examElements.startBtns[3].addEventListener('click', () => startExam(3));
  }

  // Start buttons (new style - multiple simulations)
  $$('.exam-start-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const year = btn.dataset.year;
      if (year) {
        startExam(Number(year));
      }
    });
  });

  // Next button
  if (examElements.examNext) {
    examElements.examNext.addEventListener('click', nextQuestion);
  }

  // Abort button
  if (examElements.examAbort) {
    examElements.examAbort.addEventListener('click', () => {
      if (confirm('Prüfung wirklich abbrechen?')) {
        resetExam();
      }
    });
  }

  // Reset button
  if (examElements.resetBtn) {
    examElements.resetBtn.addEventListener('click', () => {
      resetExam();
      alert('Prüfung zurückgesetzt');
    });
  }

  // Retry wrong
  if (examElements.retryWrong) {
    examElements.retryWrong.addEventListener('click', () => {
      if (currentExam.wrong.length === 0) {
        alert('Keine Fehler zum Wiederholen!');
        return;
      }
      startExam(currentExam.year, true);
    });
  }

  // Back home
  if (examElements.backHome) {
    examElements.backHome.addEventListener('click', () => {
      resetExam();
      if (typeof setTab === 'function') {
        setTab('start');
      }
    });
  }

  // ========================================================================
  // INITIALIZE
  // ========================================================================
  showHomeScreen();

  // Make functions globally available
  window.examFunctions = {
    startExam,
    resetExam,
    nextQuestion
  };

})();

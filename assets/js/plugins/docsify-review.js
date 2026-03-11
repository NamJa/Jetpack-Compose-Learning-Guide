/**
 * Docsify Spaced Repetition Review Plugin
 * Manages review schedules based on forgetting curve intervals.
 */
(function() {
  'use strict';

  var INTERVALS = [1, 3, 7, 14, 30]; // days

  // Register review schedule when a phase is completed
  function registerReview(phaseKey) {
    if (!window.GameCore) return;
    var data = window.GameCore.load();
    if (!data.reviewSchedule) data.reviewSchedule = {};
    if (data.reviewSchedule['/' + phaseKey]) return; // already registered

    var today = window.GameCore.getToday();
    data.reviewSchedule['/' + phaseKey] = {
      completedAt: today,
      nextReview: addDays(today, INTERVALS[0]),
      interval: INTERVALS[0],
      reviewCount: 0,
      lastScore: 0
    };
    window.GameCore.save(data);
  }

  function addDays(dateStr, days) {
    var d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // Check for due reviews
  function getDueReviews() {
    if (!window.GameCore) return [];
    var data = window.GameCore.load();
    if (!data.reviewSchedule) return [];
    var today = window.GameCore.getToday();
    var due = [];

    Object.keys(data.reviewSchedule).forEach(function(key) {
      var r = data.reviewSchedule[key];
      if (r.nextReview && r.nextReview <= today) {
        var phaseKey = key.replace('/', '');
        var phaseInfo = window.GameCore.PHASE_MAP[phaseKey];
        if (phaseInfo) {
          due.push({ key: key, phaseKey: phaseKey, name: phaseInfo.name, schedule: r });
        }
      }
    });

    return due;
  }

  // Show review popup
  window.__showReviewPopup = function() {
    var due = getDueReviews();
    if (due.length === 0) return;

    // Remove existing popup
    var existing = document.querySelector('.review-popup-overlay');
    if (existing) existing.remove();

    var listHtml = due.map(function(item) {
      return '<div class="review-list-item" onclick="window.__startReview(\'' + item.phaseKey + '\')">' +
        '\uD83D\uDCDA ' + item.name + ' <span class="review-count">(\uBCF5\uC2B5 ' + (item.schedule.reviewCount + 1) + '\uD68C\uCC28)</span></div>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.className = 'review-popup-overlay';
    overlay.innerHTML = '<div class="review-popup">' +
      '<div class="review-icon">\uD83D\uDCDA</div>' +
      '<h3>\uBCF5\uC2B5 \uC2DC\uAC04\uC785\uB2C8\uB2E4!</h3>' +
      '<p>\uB9DD\uAC01\uACE1\uC120\uC5D0 \uB530\uB77C \uBCF5\uC2B5\uC774 \uC900\uBE44\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>' +
      '<div class="review-list">' + listHtml + '</div>' +
      '<div class="btn-row">' +
        '<button class="btn-later" onclick="this.closest(\'.review-popup-overlay\').remove()">\uB098\uC911\uC5D0</button>' +
      '</div>' +
    '</div>';

    document.body.appendChild(overlay);
  };

  // Start a review session
  window.__startReview = function(phaseKey) {
    // Remove popup
    var popup = document.querySelector('.review-popup-overlay');
    if (popup) popup.remove();

    var phaseInfo = window.GameCore.PHASE_MAP[phaseKey];
    if (!phaseInfo) return;

    // Collect quiz/exercise questions from the phase pages
    // In practice, we generate simple review questions from completed content
    var questions = generateReviewQuestions(phaseKey, phaseInfo);

    if (questions.length === 0) {
      alert('\uBCF5\uC2B5 \uBB38\uC81C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.');
      return;
    }

    // Shuffle and limit to 5-10
    questions.sort(function() { return Math.random() - 0.5; });
    questions = questions.slice(0, Math.min(10, Math.max(5, questions.length)));

    // Start review session in content area
    var content = document.querySelector('.markdown-section');
    if (!content) return;

    window._reviewState = {
      phaseKey: phaseKey,
      questions: questions,
      currentIdx: 0,
      correct: 0,
      total: questions.length
    };

    renderReviewQuestion(content);
  };

  function generateReviewQuestions(phaseKey, phaseInfo) {
    // Generate simple MCQ review questions from phase concepts
    var questions = [];

    // Phase-specific concept questions
    var conceptBank = {
      'phase-00-javascript-typescript': [
        { q: 'const\uC640 let\uC758 \uCC28\uC774\uC810\uC740?', opts: ['\uC7AC\uD560\uB2F9 \uAC00\uB2A5 \uC5EC\uBD80', '\uC131\uB2A5 \uCC28\uC774', '\uD0C0\uC785 \uCC28\uC774', '\uC2A4\uCF54\uD504 \uCC28\uC774'], answer: '\uC7AC\uD560\uB2F9 \uAC00\uB2A5 \uC5EC\uBD80' },
        { q: 'Promise\uC758 3\uAC00\uC9C0 \uC0C1\uD0DC\uAC00 \uC544\uB2CC \uAC83\uC740?', opts: ['pending', 'fulfilled', 'rejected', 'completed'], answer: 'completed' },
        { q: 'Arrow Function\uC758 \uD2B9\uC9D5\uC740?', opts: ['this \uBC14\uC778\uB529 \uC5C6\uC74C', '\uB354 \uBE60\uB978 \uC2E4\uD589', 'return \uD544\uC218', 'arguments \uAC1D\uCCB4 \uC0AC\uC6A9 \uAC00\uB2A5'], answer: 'this \uBC14\uC778\uB529 \uC5C6\uC74C' }
      ],
      'phase-01-react-basics': [
        { q: 'React\uC758 UI \uD328\uB7EC\uB2E4\uC784\uC740?', opts: ['\uC120\uC5B8\uD615(Declarative)', '\uBA85\uB839\uD615(Imperative)', '\uBC18\uC751\uD615(Reactive)', '\uD568\uC218\uD615(Functional)'], answer: '\uC120\uC5B8\uD615(Declarative)' },
        { q: 'useState\uC758 \uC5ED\uD560\uC740?', opts: ['\uCEF4\uD3EC\uB10C\uD2B8 \uC0C1\uD0DC \uAD00\uB9AC', '\uC0AC\uC774\uB4DC \uC774\uD399\uD2B8 \uCC98\uB9AC', '\uBA54\uBAA8\uC774\uC81C\uC774\uC158', 'API \uD638\uCD9C'], answer: '\uCEF4\uD3EC\uB10C\uD2B8 \uC0C1\uD0DC \uAD00\uB9AC' },
        { q: 'Props\uC758 \uD2B9\uC9D5\uC740?', opts: ['\uC77D\uAE30 \uC804\uC6A9', '\uC4F0\uAE30 \uC804\uC6A9', '\uC591\uBC29\uD5A5', '\uC120\uD0DD\uC801'], answer: '\uC77D\uAE30 \uC804\uC6A9' }
      ],
      'phase-03-core-components': [
        { q: 'FlatList\uC758 Android \uB300\uC751 \uCEF4\uD3EC\uB10C\uD2B8\uB294?', opts: ['RecyclerView', 'ListView', 'ScrollView', 'LinearLayout'], answer: 'RecyclerView' },
        { q: 'React Native\uC758 \uAE30\uBCF8 \uB808\uC774\uC544\uC6C3 \uC2DC\uC2A4\uD15C\uC740?', opts: ['Flexbox', 'ConstraintLayout', 'Grid', 'Absolute'], answer: 'Flexbox' },
        { q: 'flexDirection\uC758 \uAE30\uBCF8\uAC12\uC740?', opts: ['column', 'row', 'column-reverse', 'row-reverse'], answer: 'column' }
      ],
      'phase-05-state-and-networking': [
        { q: 'Zustand\uC758 Android \uB300\uC751 \uD328\uD134\uC740?', opts: ['ViewModel + StateFlow', 'Repository', 'Room DB', 'ContentProvider'], answer: 'ViewModel + StateFlow' },
        { q: 'TanStack Query\uC758 \uC8FC\uC694 \uAE30\uB2A5\uC740?', opts: ['\uC11C\uBC84 \uC0C1\uD0DC \uCE90\uC2F1/\uB3D9\uAE30\uD654', '\uB85C\uCEEC \uC0C1\uD0DC \uAD00\uB9AC', 'UI \uB80C\uB354\uB9C1', '\uB77C\uC6B0\uD305'], answer: '\uC11C\uBC84 \uC0C1\uD0DC \uCE90\uC2F1/\uB3D9\uAE30\uD654' }
      ],
      'phase-06-new-architecture': [
        { q: 'JSI\uC758 \uC5ED\uD560\uC740?', opts: ['JS-\uB124\uC774\uD2F0\uBE0C C++ \uC9C1\uC811 \uBC14\uC778\uB529', 'JSON \uC9C1\uB82C\uD654', 'UI \uB80C\uB354\uB9C1', '\uD0C0\uC785 \uCCB4\uD06C'], answer: 'JS-\uB124\uC774\uD2F0\uBE0C C++ \uC9C1\uC811 \uBC14\uC778\uB529' },
        { q: 'Fabric\uC740 \uBB34\uC5C7\uC744 \uB300\uCCB4\uD558\uB098\uC694?', opts: ['Legacy Renderer', 'Bridge', 'Metro', 'Hermes'], answer: 'Legacy Renderer' }
      ]
    };

    // Use conceptBank if available for the phase
    if (conceptBank[phaseKey]) {
      conceptBank[phaseKey].forEach(function(q) {
        questions.push({
          type: 'mcq',
          question: q.q,
          options: q.opts.slice().sort(function() { return Math.random() - 0.5; }),
          answer: q.answer
        });
      });
    }

    // Add generic questions for phases without a concept bank
    if (questions.length < 3) {
      questions.push({
        type: 'mcq',
        question: phaseInfo.name + '\uC758 \uD575\uC2EC \uAC1C\uB150\uC744 \uC5BC\uB9C8\uB098 \uAE30\uC5B5\uD558\uACE0 \uC788\uB098\uC694? (\uC790\uAE30 \uD3C9\uAC00)',
        options: ['\uC798 \uAE30\uC5B5\uD55C\uB2E4', '\uBCF4\uD1B5\uC774\uB2E4', '\uC798 \uAE30\uC5B5 \uBABB\uD55C\uB2E4', '\uB2E4\uC2DC \uBCF4\uACE0 \uC2F6\uB2E4'],
        answer: '\uC798 \uAE30\uC5B5\uD55C\uB2E4'
      });
    }

    return questions;
  }

  function renderReviewQuestion(content) {
    var state = window._reviewState;
    if (!state) return;

    var q = state.questions[state.currentIdx];
    if (!q) {
      renderReviewResult(content);
      return;
    }

    var optionsHtml = q.options.map(function(opt, i) {
      return '<button class="quiz-option" onclick="window.__reviewAnswer(\'' + encodeURIComponent(opt) + '\')">' +
        '<span class="quiz-option-text">' + opt + '</span></button>';
    }).join('');

    content.innerHTML = '<div class="review-session">' +
      '<div class="review-session-header">' +
        '<span class="review-session-title">\uD83D\uDCDA \uBCF5\uC2B5 \uBAA8\uB4DC</span>' +
        '<span class="review-session-progress">' + (state.currentIdx + 1) + ' / ' + state.total + '</span>' +
      '</div>' +
      '<div class="exercise-question">' + q.question + '</div>' +
      '<div class="quiz-options">' + optionsHtml + '</div>' +
    '</div>';
  }

  window.__reviewAnswer = function(encodedAnswer) {
    var state = window._reviewState;
    if (!state) return;

    var answer = decodeURIComponent(encodedAnswer);
    var q = state.questions[state.currentIdx];
    var isCorrect = answer === q.answer;

    if (isCorrect) {
      state.correct++;
      if (window.GameCore) {
        window.GameCore.addXP(3, 'review');
        window.GameCore.recordExercise('review', true);
      }
      if (window.GameSound) window.GameSound.correct();
    } else {
      if (window.GameCore) window.GameCore.recordExercise('review', false);
      if (window.GameSound) window.GameSound.incorrect();
    }

    state.currentIdx++;

    var content = document.querySelector('.markdown-section');
    if (content) {
      setTimeout(function() { renderReviewQuestion(content); }, 500);
    }
  };

  function renderReviewResult(content) {
    var state = window._reviewState;
    if (!state) return;

    var score = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0;
    var scoreClass = score >= 90 ? 'good' : (score >= 70 ? 'okay' : 'bad');
    var message = score >= 90 ? '\uD0C1\uC6D4\uD569\uB2C8\uB2E4! \uB2E4\uC74C \uBCF5\uC2B5 \uAC04\uACA9\uC774 \uB298\uC5B4\uB0A9\uB2C8\uB2E4.' :
      (score >= 70 ? '\uC798 \uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uAC19\uC740 \uAC04\uACA9\uC73C\uB85C \uBCF5\uC2B5\uD569\uB2C8\uB2E4.' :
        '\uC870\uAE08 \uB354 \uBCF5\uC2B5\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. \uBCF5\uC2B5 \uAC04\uACA9\uC774 \uC904\uC5B4\uB4ED\uB2C8\uB2E4.');

    content.innerHTML = '<div class="review-result">' +
      '<h3>\uBCF5\uC2B5 \uC644\uB8CC!</h3>' +
      '<div class="result-score ' + scoreClass + '">' + score + '%</div>' +
      '<div>' + state.correct + ' / ' + state.total + ' \uC815\uB2F5</div>' +
      '<div class="result-message">' + message + '</div>' +
      '<button onclick="window.location.hash=\'#/\'">\uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</button>' +
    '</div>';

    // Update review schedule
    updateReviewSchedule(state.phaseKey, score);

    if (score >= 90 && window.GameConfetti) {
      window.GameConfetti.launch({ particleCount: 40, duration: 1500 });
    }
  }

  function updateReviewSchedule(phaseKey, score) {
    if (!window.GameCore) return;
    var data = window.GameCore.load();
    var key = '/' + phaseKey;
    if (!data.reviewSchedule || !data.reviewSchedule[key]) return;

    var r = data.reviewSchedule[key];
    var currentIntervalIdx = INTERVALS.indexOf(r.interval);
    if (currentIntervalIdx < 0) currentIntervalIdx = 0;

    r.reviewCount++;
    r.lastScore = score / 100;

    if (score >= 90) {
      // Move to next interval
      currentIntervalIdx = Math.min(INTERVALS.length - 1, currentIntervalIdx + 1);
    } else if (score < 70) {
      // Move to previous interval
      currentIntervalIdx = Math.max(0, currentIntervalIdx - 1);
    }
    // 70-89: same interval

    r.interval = INTERVALS[currentIntervalIdx];
    r.nextReview = addDays(window.GameCore.getToday(), r.interval);

    data.reviewSchedule[key] = r;
    window.GameCore.save(data);
  }

  // ── Auto-register reviews for completed phases ──
  function checkPhaseCompletions() {
    if (!window.GameCore) return;
    var data = window.GameCore.load();
    var completed = data.completedPages || [];

    window.GameCore.PHASE_ORDER.forEach(function(phaseKey) {
      var info = window.GameCore.PHASE_MAP[phaseKey];
      var count = completed.filter(function(p) { return p.includes(phaseKey); }).length;
      if (count >= info.total) {
        registerReview(phaseKey);
      }
    });
  }

  // ── Auto-show review popup on page load ──
  function checkAndShowReview() {
    var due = getDueReviews();
    if (due.length > 0) {
      setTimeout(function() { window.__showReviewPopup(); }, 2000);
    }
  }

  // ── Register Plugin ──
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.doneEach(function() {
      checkPhaseCompletions();
    });

    hook.ready(function() {
      checkAndShowReview();
    });
  });
})();

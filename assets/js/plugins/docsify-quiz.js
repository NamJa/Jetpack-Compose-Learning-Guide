(function() {
  var STORAGE_KEY = 'rn-learning-progress';
  var quizCounter = 0;

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // Simple YAML-like parser for quiz blocks
  function parseQuiz(text) {
    var quiz = {
      type: 'mcq',
      question: '',
      options: [],
      answer: '',
      explanation: '',
      pairs: [],
      code: '',
      answers: [],
      hints: []
    };

    var lines = text.split('\n');
    var currentKey = null;
    var currentList = null;
    var codeBlock = false;
    var codeContent = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();

      // Handle code blocks within quiz
      if (trimmed.startsWith('```')) {
        if (codeBlock) {
          codeBlock = false;
          quiz.code = codeContent.join('\n');
          codeContent = [];
        } else {
          codeBlock = true;
        }
        continue;
      }

      if (codeBlock) {
        codeContent.push(line);
        continue;
      }

      // Parse key: value pairs
      var colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0 && !trimmed.startsWith('-') && !trimmed.startsWith(' ')) {
        var key = trimmed.substring(0, colonIdx).trim().toLowerCase();
        var value = trimmed.substring(colonIdx + 1).trim();

        if (key === 'type') {
          quiz.type = value;
          currentKey = null;
          currentList = null;
        } else if (key === 'question') {
          quiz.question = value;
          currentKey = 'question';
          currentList = null;
        } else if (key === 'answer') {
          quiz.answer = value;
          currentKey = null;
          currentList = null;
        } else if (key === 'explanation') {
          quiz.explanation = value;
          currentKey = 'explanation';
          currentList = null;
        } else if (key === 'options') {
          currentList = 'options';
          currentKey = null;
        } else if (key === 'pairs') {
          currentList = 'pairs';
          currentKey = null;
        } else if (key === 'answers') {
          currentList = 'answers';
          currentKey = null;
        } else if (key === 'hints') {
          currentList = 'hints';
          currentKey = null;
        } else if (key === 'code') {
          quiz.code = value;
          currentKey = 'code';
          currentList = null;
        }
      } else if (trimmed.startsWith('- ')) {
        var item = trimmed.substring(2).trim();
        if (currentList === 'options') {
          quiz.options.push(item);
        } else if (currentList === 'pairs') {
          // Parse "left: right" or "left -> right" or "left | right"
          var sep = item.indexOf(' -> ');
          if (sep < 0) sep = item.indexOf(' | ');
          if (sep < 0) sep = item.indexOf(': ');
          if (sep >= 0) {
            var sepLen = item.indexOf(' -> ') >= 0 ? 4 : (item.indexOf(' | ') >= 0 ? 3 : 2);
            quiz.pairs.push({
              left: item.substring(0, sep).trim(),
              right: item.substring(sep + sepLen).trim()
            });
          }
        } else if (currentList === 'answers') {
          quiz.answers.push(item);
        } else if (currentList === 'hints') {
          quiz.hints.push(item);
        }
      } else if (trimmed && currentKey === 'question') {
        quiz.question += ' ' + trimmed;
      } else if (trimmed && currentKey === 'explanation') {
        quiz.explanation += ' ' + trimmed;
      } else if (trimmed && currentKey === 'code') {
        quiz.code += '\n' + trimmed;
      }
    }

    return quiz;
  }

  // Render MCQ quiz
  function renderMCQ(quiz, id, path) {
    var optionsHtml = quiz.options.map(function(opt, i) {
      var letter = String.fromCharCode(65 + i); // A, B, C, D
      return '<button class="quiz-option" data-index="' + i + '" data-letter="' + letter + '" onclick="window.__quizSelectMCQ(\'' + id + '\',' + i + ')">' +
        '<span class="quiz-option-letter">' + letter + '</span>' +
        '<span class="quiz-option-text">' + opt + '</span>' +
        '</button>';
    }).join('');

    return '<div class="quiz-container quiz-mcq" id="' + id + '" data-answer="' + encodeURIComponent(quiz.answer) + '" data-path="' + encodeURIComponent(path) + '" data-explanation="' + encodeURIComponent(quiz.explanation) + '">' +
      '<div class="quiz-header"><span class="quiz-badge">\uD83D\uDCDD \uD004\uC988</span></div>' +
      '<div class="quiz-question">' + quiz.question + '</div>' +
      '<div class="quiz-options">' + optionsHtml + '</div>' +
      '<div class="quiz-feedback" style="display:none;"></div>' +
      '</div>';
  }

  // Render fill-in-the-blank quiz
  function renderFill(quiz, id, path) {
    var codeHtml = quiz.code;
    var inputIndex = 0;
    // Replace ___ with input fields
    codeHtml = codeHtml.replace(/___/g, function() {
      var html = '<input type="text" class="quiz-fill-input" data-index="' + inputIndex + '" placeholder="\uB2F5\uC744 \uC785\uB825\uD558\uC138\uC694" />';
      inputIndex++;
      return html;
    });

    var hintsHtml = '';
    if (quiz.hints.length > 0) {
      hintsHtml = '<div class="quiz-hints" style="display:none;">' +
        '<strong>\uD83D\uDCA1 \uD78C\uD2B8:</strong><ul>' +
        quiz.hints.map(function(h) { return '<li>' + h + '</li>'; }).join('') +
        '</ul></div>' +
        '<button class="quiz-hint-btn" onclick="window.__quizToggleHints(\'' + id + '\')">\uD78C\uD2B8 \uBCF4\uAE30</button>';
    }

    var answersData = encodeURIComponent(JSON.stringify(quiz.answers));

    return '<div class="quiz-container quiz-fill" id="' + id + '" data-answers="' + answersData + '" data-path="' + encodeURIComponent(path) + '">' +
      '<div class="quiz-header"><span class="quiz-badge">\u270D\uFE0F \uBE48\uCE78 \uCC44\uC6B0\uAE30</span></div>' +
      '<div class="quiz-question">' + quiz.question + '</div>' +
      '<div class="quiz-code-block"><pre>' + codeHtml + '</pre></div>' +
      hintsHtml +
      '<button class="quiz-check-btn" onclick="window.__quizCheckFill(\'' + id + '\')">\uC815\uB2F5 \uD655\uC778</button>' +
      '<div class="quiz-feedback" style="display:none;"></div>' +
      '</div>';
  }

  // Render matching quiz
  function renderMatch(quiz, id, path) {
    // Shuffle right side
    var rightItems = quiz.pairs.map(function(p) { return p.right; });
    var shuffledRight = rightItems.slice().sort(function() { return Math.random() - 0.5; });

    var leftHtml = quiz.pairs.map(function(p, i) {
      return '<div class="match-item match-left" data-index="' + i + '" onclick="window.__quizMatchSelect(\'' + id + '\',\'left\',' + i + ')">' +
        '<span class="match-text">' + p.left + '</span>' +
        '<span class="match-indicator"></span>' +
        '</div>';
    }).join('');

    var rightHtml = shuffledRight.map(function(text, i) {
      return '<div class="match-item match-right" data-index="' + i + '" data-text="' + encodeURIComponent(text) + '" onclick="window.__quizMatchSelect(\'' + id + '\',\'right\',' + i + ')">' +
        '<span class="match-indicator"></span>' +
        '<span class="match-text">' + text + '</span>' +
        '</div>';
    }).join('');

    var pairsData = encodeURIComponent(JSON.stringify(quiz.pairs));

    return '<div class="quiz-container quiz-match" id="' + id + '" data-pairs="' + pairsData + '" data-path="' + encodeURIComponent(path) + '">' +
      '<div class="quiz-header"><span class="quiz-badge">\uD83D\uDD17 \uC9DD\uC9D3\uAE30</span></div>' +
      '<div class="quiz-question">' + quiz.question + '</div>' +
      '<div class="match-columns">' +
        '<div class="match-column match-column-left">' + leftHtml + '</div>' +
        '<div class="match-column match-column-right">' + rightHtml + '</div>' +
      '</div>' +
      '<div class="quiz-feedback" style="display:none;"></div>' +
      '</div>';
  }

  // MCQ selection handler
  window.__quizSelectMCQ = function(id, selectedIndex) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;
    container.classList.add('answered');

    var answer = decodeURIComponent(container.getAttribute('data-answer'));
    var explanation = decodeURIComponent(container.getAttribute('data-explanation'));
    var path = decodeURIComponent(container.getAttribute('data-path'));
    var buttons = container.querySelectorAll('.quiz-option');
    var correctIndex = -1;

    // Find correct answer index by letter (A, B, C, D) or by text match
    buttons.forEach(function(btn, i) {
      var letter = btn.getAttribute('data-letter');
      var text = btn.querySelector('.quiz-option-text').textContent;
      if (letter === answer || text === answer || (i + 1).toString() === answer) {
        correctIndex = i;
      }
    });

    var isCorrect = selectedIndex === correctIndex;

    buttons.forEach(function(btn, i) {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
      if (i === correctIndex) {
        btn.classList.add('correct');
      } else if (i === selectedIndex && !isCorrect) {
        btn.classList.add('incorrect');
      }
    });

    var feedback = container.querySelector('.quiz-feedback');
    feedback.style.display = 'block';
    feedback.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'incorrect');
    feedback.innerHTML = isCorrect
      ? '<strong>\u2705 \uC815\uB2F5!</strong>' + (explanation ? '<p>' + explanation + '</p>' : '')
      : '<strong>\u274C \uD2C0\uB838\uC2B5\uB2C8\uB2E4.</strong>' + (explanation ? '<p>' + explanation + '</p>' : '');

    // Save to localStorage
    var data = loadProgress();
    if (!data.quizResults) data.quizResults = {};
    var existing = data.quizResults[path] || { score: 0, total: 0 };
    existing.total += 1;
    if (isCorrect) existing.score += 1;
    data.quizResults[path] = existing;
    saveProgress(data);

    // Gamification integration
    if (window.GameCore) {
      if (isCorrect) {
        window.GameCore.addXP(5, 'quiz-mcq');
        window.GameCore.recordExercise('mcq', true);
        window.GameCore.incrementStreak();
        if (window.GameSound) window.GameSound.correct();
        // XP float
        var rect = container.getBoundingClientRect();
        var el = document.createElement('div');
        el.className = 'xp-float';
        el.textContent = '+5 XP';
        el.style.left = (rect.right - 80) + 'px';
        el.style.top = (rect.top + window.scrollY) + 'px';
        document.body.appendChild(el);
        setTimeout(function() { el.remove(); }, 1000);
      } else {
        window.GameCore.recordExercise('mcq', false);
        window.GameCore.useHeart(path);
        if (window.GameSound) window.GameSound.incorrect();
      }
      container.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
      setTimeout(function() { container.classList.remove('feedback-correct', 'feedback-incorrect'); }, 600);
    }
  };

  // Fill-in-the-blank check handler
  window.__quizCheckFill = function(id) {
    var container = document.getElementById(id);
    if (!container) return;

    var answersStr = decodeURIComponent(container.getAttribute('data-answers'));
    var path = decodeURIComponent(container.getAttribute('data-path'));
    var answers = JSON.parse(answersStr);
    var inputs = container.querySelectorAll('.quiz-fill-input');
    var correct = 0;
    var total = answers.length;

    inputs.forEach(function(input, i) {
      var userAnswer = input.value.trim();
      var expected = answers[i] || '';
      if (userAnswer.toLowerCase() === expected.toLowerCase()) {
        input.classList.add('correct');
        input.classList.remove('incorrect');
        correct++;
      } else {
        input.classList.add('incorrect');
        input.classList.remove('correct');
      }
      input.disabled = true;
    });

    var feedback = container.querySelector('.quiz-feedback');
    feedback.style.display = 'block';
    var allCorrect = correct === total;
    feedback.className = 'quiz-feedback ' + (allCorrect ? 'correct' : 'incorrect');
    feedback.innerHTML = allCorrect
      ? '<strong>\u2705 \uBAA8\uB450 \uC815\uB2F5!</strong> ' + correct + '/' + total
      : '<strong>\uACB0\uACFC:</strong> ' + correct + '/' + total + ' \uC815\uB2F5';

    // Save to localStorage
    var data = loadProgress();
    if (!data.quizResults) data.quizResults = {};
    data.quizResults[path] = { score: correct, total: total };
    saveProgress(data);

    // Gamification integration
    if (window.GameCore) {
      var xp = correct * 5;
      if (xp > 0) { window.GameCore.addXP(xp, 'quiz-fill'); window.GameCore.incrementStreak(); }
      for (var gi = 0; gi < correct; gi++) window.GameCore.recordExercise('fill', true);
      for (var gj = 0; gj < (total - correct); gj++) { window.GameCore.recordExercise('fill', false); window.GameCore.useHeart(path); }
      if (allCorrect && window.GameSound) window.GameSound.correct();
      else if (!allCorrect && window.GameSound) window.GameSound.incorrect();
    }
  };

  // Toggle hints
  window.__quizToggleHints = function(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var hints = container.querySelector('.quiz-hints');
    if (hints) {
      hints.style.display = hints.style.display === 'none' ? 'block' : 'none';
    }
  };

  // Matching quiz state
  var matchState = {};

  window.__quizMatchSelect = function(id, side, index) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;

    if (!matchState[id]) {
      matchState[id] = { selected: null, pairs: [], matchCount: 0 };
    }
    var state = matchState[id];

    var item;
    if (side === 'left') {
      item = container.querySelectorAll('.match-left')[index];
    } else {
      item = container.querySelectorAll('.match-right')[index];
    }

    // Don't allow selecting already-paired items
    if (item.classList.contains('paired')) return;

    // If same side is already selected, switch selection
    if (state.selected && state.selected.side === side) {
      state.selected.element.classList.remove('selected');
      state.selected = { side: side, index: index, element: item };
      item.classList.add('selected');
      return;
    }

    // If nothing selected, select this
    if (!state.selected) {
      state.selected = { side: side, index: index, element: item };
      item.classList.add('selected');
      return;
    }

    // We have a selection from the other side - make a pair
    var leftEl, rightEl, leftIndex, rightIndex;
    if (side === 'left') {
      leftEl = item;
      leftIndex = index;
      rightEl = state.selected.element;
      rightIndex = state.selected.index;
    } else {
      leftEl = state.selected.element;
      leftIndex = state.selected.index;
      rightEl = item;
      rightIndex = state.selected.index;
    }

    state.selected.element.classList.remove('selected');
    state.selected = null;

    // Check if this pair is correct
    var pairsData = JSON.parse(decodeURIComponent(container.getAttribute('data-pairs')));
    var expectedRight = pairsData[leftIndex].right;
    var actualRight = decodeURIComponent(rightEl.getAttribute('data-text'));

    var colorIndex = state.matchCount % 6;
    var colors = ['#4ecdc4', '#61dafb', '#f5a623', '#e94560', '#a06cd5', '#2ecc71'];
    var pairColor = colors[colorIndex];

    leftEl.classList.add('paired');
    rightEl.classList.add('paired');
    leftEl.style.borderColor = pairColor;
    rightEl.style.borderColor = pairColor;
    leftEl.querySelector('.match-indicator').style.backgroundColor = pairColor;
    rightEl.querySelector('.match-indicator').style.backgroundColor = pairColor;

    if (expectedRight !== actualRight) {
      leftEl.classList.add('pair-incorrect');
      rightEl.classList.add('pair-incorrect');
    } else {
      leftEl.classList.add('pair-correct');
      rightEl.classList.add('pair-correct');
    }

    state.matchCount++;
    state.pairs.push({ leftIndex: leftIndex, rightText: actualRight, correct: expectedRight === actualRight });

    // Check if all pairs are made
    if (state.matchCount === pairsData.length) {
      container.classList.add('answered');
      var correctCount = state.pairs.filter(function(p) { return p.correct; }).length;
      var total = pairsData.length;
      var feedback = container.querySelector('.quiz-feedback');
      feedback.style.display = 'block';
      var allCorrect = correctCount === total;
      feedback.className = 'quiz-feedback ' + (allCorrect ? 'correct' : 'incorrect');
      feedback.innerHTML = allCorrect
        ? '<strong>\u2705 \uBAA8\uB450 \uC815\uB2F5!</strong> ' + correctCount + '/' + total
        : '<strong>\uACB0\uACFC:</strong> ' + correctCount + '/' + total + ' \uC815\uB2F5';

      // Save to localStorage
      var path = decodeURIComponent(container.getAttribute('data-path'));
      var data = loadProgress();
      if (!data.quizResults) data.quizResults = {};
      data.quizResults[path] = { score: correctCount, total: total };
      saveProgress(data);

      // Gamification integration
      if (window.GameCore) {
        var xp = correctCount * 5;
        if (xp > 0) { window.GameCore.addXP(xp, 'quiz-match'); window.GameCore.incrementStreak(); }
        for (var gi = 0; gi < correctCount; gi++) window.GameCore.recordExercise('match', true);
        for (var gj = 0; gj < (total - correctCount); gj++) { window.GameCore.recordExercise('match', false); window.GameCore.useHeart(path); }
        if (allCorrect && window.GameSound) window.GameSound.correct();
        else if (!allCorrect && window.GameSound) window.GameSound.incorrect();
      }
    }
  };

  // Register Docsify plugin
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.afterEach(function(html, next) {
      var path = vm.route.path;
      quizCounter = 0;

      // Find quiz code blocks rendered by Docsify as <pre><code class="lang-quiz">
      html = html.replace(/<pre[^>]*><code[^>]*class="lang-quiz"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(match, content) {
        // Decode HTML entities
        var decoded = content
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        var quiz = parseQuiz(decoded);
        var id = 'quiz-' + path.replace(/\//g, '-') + '-' + quizCounter;
        quizCounter++;

        if (quiz.type === 'mcq' || quiz.type === 'multiple-choice') {
          return renderMCQ(quiz, id, path);
        } else if (quiz.type === 'fill' || quiz.type === 'fill-in' || quiz.type === 'fill-blank') {
          return renderFill(quiz, id, path);
        } else if (quiz.type === 'match' || quiz.type === 'matching') {
          return renderMatch(quiz, id, path);
        }

        return match; // Unknown type, leave as-is
      });

      next(html);
    });
  });
})();

/**
 * Docsify Exercise Plugin
 * Renders 5 new exercise types: code-arrange, output-predict, bug-find, word-bank, categorize
 * Uses window.GameCore for XP/hearts integration.
 */
(function() {
  'use strict';
  var exerciseCounter = 0;

  // ── YAML-like parser for exercise blocks ──
  function parseExercise(text) {
    var ex = {
      type: '', question: '', code: '', tokens: [], distractors: [],
      answer: null, options: [], blanks: [], hint: '', explanation: '',
      bugLines: [], explanations: {}, categories: [], items: [], xp: 5
    };

    var lines = text.split('\n');
    var currentKey = null;
    var currentList = null;
    var codeLines = [];
    var inCode = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();

      if (trimmed === '```' || trimmed.match(/^```\w/)) {
        if (inCode) {
          inCode = false;
          ex.code = codeLines.join('\n');
          codeLines = [];
        } else {
          inCode = true;
        }
        continue;
      }

      if (inCode) {
        codeLines.push(line);
        continue;
      }

      var colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0 && !trimmed.startsWith('-') && !trimmed.startsWith(' ')) {
        var key = trimmed.substring(0, colonIdx).trim().toLowerCase();
        var value = trimmed.substring(colonIdx + 1).trim();

        if (key === 'type') { ex.type = value; currentKey = null; currentList = null; }
        else if (key === 'question') { ex.question = stripQuotes(value); currentKey = 'question'; currentList = null; }
        else if (key === 'hint') { ex.hint = stripQuotes(value); currentKey = null; currentList = null; }
        else if (key === 'explanation') { ex.explanation = stripQuotes(value); currentKey = 'explanation'; currentList = null; }
        else if (key === 'xp') { ex.xp = parseInt(value) || 5; currentKey = null; currentList = null; }
        else if (key === 'answer') {
          // Could be a string or start of array
          if (value.startsWith('[')) {
            try { ex.answer = JSON.parse(value); } catch(e) { ex.answer = stripQuotes(value); }
          } else {
            ex.answer = stripQuotes(value);
          }
          currentKey = null; currentList = null;
        }
        else if (key === 'buglines') {
          if (value.startsWith('[')) {
            try { ex.bugLines = JSON.parse(value); } catch(e) {}
          }
          currentKey = null; currentList = 'bugLines';
        }
        else if (key === 'tokens') { currentList = 'tokens'; currentKey = null; }
        else if (key === 'distractors') { currentList = 'distractors'; currentKey = null; }
        else if (key === 'options') { currentList = 'options'; currentKey = null; }
        else if (key === 'blanks') {
          if (value.startsWith('[')) {
            try { ex.blanks = JSON.parse(value); } catch(e) {}
          }
          currentList = 'blanks'; currentKey = null;
        }
        else if (key === 'categories') {
          if (value.startsWith('[')) {
            try { ex.categories = JSON.parse(value); } catch(e) {}
          }
          currentList = 'categories'; currentKey = null;
        }
        else if (key === 'items') { currentList = 'items'; currentKey = null; }
        else if (key === 'explanations') { currentList = 'explanations'; currentKey = null; }
        else if (key === 'code') {
          if (value) {
            // Inline code or start of multiline
            if (value === '|') { inCode = true; }
            else { ex.code = stripQuotes(value); }
          }
          currentKey = 'code'; currentList = null;
        }
      } else if (trimmed.startsWith('- ')) {
        var item = trimmed.substring(2).trim();
        if (currentList === 'tokens') ex.tokens.push(stripQuotes(item));
        else if (currentList === 'distractors') ex.distractors.push(stripQuotes(item));
        else if (currentList === 'options') ex.options.push(stripQuotes(item));
        else if (currentList === 'blanks') ex.blanks.push(stripQuotes(item));
        else if (currentList === 'categories') ex.categories.push(stripQuotes(item));
        else if (currentList === 'items') {
          // Parse item objects: - text: "X" \n    category: "Y"
          // This is a simplified approach - items are multiline
          if (item.startsWith('text:')) {
            ex._currentItem = { text: stripQuotes(item.substring(5).trim()), category: '' };
            ex.items.push(ex._currentItem);
          }
        }
      } else if (trimmed && currentList === 'items' && ex._currentItem) {
        // Parse category line for items
        var catMatch = trimmed.match(/^category:\s*(.+)/);
        if (catMatch) {
          ex._currentItem.category = stripQuotes(catMatch[1]);
        }
      } else if (trimmed && currentList === 'explanations') {
        // Parse "2: explanation text"
        var expMatch = trimmed.match(/^(\d+):\s*(.+)/);
        if (expMatch) {
          ex.explanations[parseInt(expMatch[1])] = stripQuotes(expMatch[2]);
        }
      } else if (trimmed && currentKey === 'code') {
        ex.code += (ex.code ? '\n' : '') + line;
      } else if (trimmed && currentKey === 'question') {
        ex.question += ' ' + trimmed;
      } else if (trimmed && currentKey === 'explanation') {
        ex.explanation += ' ' + trimmed;
      }
    }

    delete ex._currentItem;
    return ex;
  }

  function stripQuotes(s) {
    s = s.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    return s;
  }

  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Render: Code Arrange ──
  function renderCodeArrange(ex, id) {
    var allTokens = ex.tokens.concat(ex.distractors);
    // Shuffle
    allTokens.sort(function() { return Math.random() - 0.5; });

    var tokensHtml = allTokens.map(function(t, i) {
      var isDistractor = ex.distractors.indexOf(t) >= 0;
      return '<div class="code-token' + (isDistractor ? ' distractor' : '') + '" data-token="' + escAttr(t) + '" data-idx="' + i + '" draggable="true">' + escHtml(t) + '</div>';
    }).join('');

    var hintHtml = ex.hint ?
      '<button class="exercise-hint-btn" onclick="window.__exHint(\'' + id + '\')">\uD83D\uDCA1 \uD78C\uD2B8</button>' +
      '<div class="exercise-hint" id="' + id + '-hint">' + escHtml(ex.hint) + '</div>' : '';

    return '<div class="exercise-container" id="' + id + '" data-type="code-arrange" data-answer="' + escAttr(JSON.stringify(ex.answer)) + '" data-xp="' + ex.xp + '">' +
      '<div class="exercise-header"><span class="exercise-badge">\uD83E\uDDE9 \uCF54\uB4DC \uC870\uB9BD</span><span class="exercise-xp">+' + ex.xp + ' XP</span></div>' +
      '<div class="exercise-question">' + escHtml(ex.question) + '</div>' +
      '<div class="code-arrange-answer" id="' + id + '-answer"><span class="placeholder">\uD1A0\uD070\uC744 \uC5EC\uAE30\uC5D0 \uBC30\uCE58\uD558\uC138\uC694</span></div>' +
      '<div class="code-arrange-tokens" id="' + id + '-tokens">' + tokensHtml + '</div>' +
      hintHtml +
      '<button class="exercise-btn" onclick="window.__exSubmitArrange(\'' + id + '\')">\uC81C\uCD9C\uD558\uAE30 \u2192</button>' +
      '<div class="exercise-feedback" id="' + id + '-feedback"></div>' +
      '</div>';
  }

  // ── Render: Output Predict ──
  function renderOutputPredict(ex, id) {
    var optionsHtml = ex.options.map(function(opt, i) {
      return '<button class="quiz-option" data-index="' + i + '" onclick="window.__exSelectOption(\'' + id + '\',' + i + ')">' +
        '<span class="quiz-option-text">' + escHtml(opt) + '</span></button>';
    }).join('');

    return '<div class="exercise-container" id="' + id + '" data-type="output-predict" data-answer="' + escAttr(ex.answer) + '" data-xp="' + ex.xp + '">' +
      '<div class="exercise-header"><span class="exercise-badge">\uD83D\uDD2E \uCD9C\uB825 \uC608\uCE21</span><span class="exercise-xp">+' + ex.xp + ' XP</span></div>' +
      '<div class="exercise-question">' + escHtml(ex.question) + '</div>' +
      '<div class="output-predict-code">' + escHtml(ex.code) + '</div>' +
      '<div class="quiz-options">' + optionsHtml + '</div>' +
      '<div class="exercise-feedback" id="' + id + '-feedback"></div>' +
      '</div>';
  }

  // ── Render: Bug Find ──
  function renderBugFind(ex, id) {
    var codeLines = ex.code.split('\n');
    var linesHtml = codeLines.map(function(line, i) {
      var lineNum = i + 1;
      return '<div class="bug-find-line" data-line="' + lineNum + '" onclick="window.__exToggleBugLine(\'' + id + '\',' + lineNum + ')">' +
        '<span class="line-num">' + lineNum + '</span>' +
        '<span class="line-code">' + escHtml(line) + '</span>' +
        '</div>';
    }).join('');

    return '<div class="exercise-container" id="' + id + '" data-type="bug-find" data-buglines="' + escAttr(JSON.stringify(ex.bugLines)) + '" data-explanations="' + escAttr(JSON.stringify(ex.explanations)) + '" data-xp="' + ex.xp + '">' +
      '<div class="exercise-header"><span class="exercise-badge">\uD83D\uDC1B \uBC84\uADF8 \uCC3E\uAE30</span><span class="exercise-xp">+' + ex.xp + ' XP</span></div>' +
      '<div class="exercise-question">' + escHtml(ex.question) + '</div>' +
      '<div class="bug-find-code" id="' + id + '-code">' + linesHtml + '</div>' +
      '<div class="bug-find-selected" id="' + id + '-selected">\uC120\uD0DD\uD55C \uB77C\uC778: \uC5C6\uC74C</div>' +
      '<button class="exercise-btn" onclick="window.__exSubmitBugFind(\'' + id + '\')">\uC81C\uCD9C\uD558\uAE30 \u2192</button>' +
      '<div class="exercise-feedback" id="' + id + '-feedback"></div>' +
      '</div>';
  }

  // ── Render: Word Bank ──
  function renderWordBank(ex, id) {
    // Replace ___ in code with blank slots
    var blankIdx = 0;
    var codeHtml = escHtml(ex.code).replace(/___/g, function() {
      var html = '<span class="word-bank-blank" data-blank="' + blankIdx + '" onclick="window.__exClearBlank(\'' + id + '\',' + blankIdx + ')">___</span>';
      blankIdx++;
      return html;
    });

    var allTokens = ex.blanks.concat(ex.distractors);
    allTokens.sort(function() { return Math.random() - 0.5; });

    var poolHtml = allTokens.map(function(t) {
      return '<div class="word-bank-token" data-token="' + escAttr(t) + '" onclick="window.__exSelectWordBank(\'' + id + '\',this)">' + escHtml(t) + '</div>';
    }).join('');

    var hintHtml = ex.hint ?
      '<button class="exercise-hint-btn" onclick="window.__exHint(\'' + id + '\')">\uD83D\uDCA1 \uD78C\uD2B8</button>' +
      '<div class="exercise-hint" id="' + id + '-hint">' + escHtml(ex.hint) + '</div>' : '';

    return '<div class="exercise-container" id="' + id + '" data-type="word-bank" data-blanks="' + escAttr(JSON.stringify(ex.blanks)) + '" data-xp="' + ex.xp + '">' +
      '<div class="exercise-header"><span class="exercise-badge">\uD83C\uDFAF \uBE48\uCE78 \uCC44\uC6B0\uAE30</span><span class="exercise-xp">+' + ex.xp + ' XP</span></div>' +
      '<div class="exercise-question">' + escHtml(ex.question) + '</div>' +
      '<div class="word-bank-code" id="' + id + '-code">' + codeHtml + '</div>' +
      '<div class="word-bank-pool" id="' + id + '-pool">' + poolHtml + '</div>' +
      hintHtml +
      '<button class="exercise-btn" onclick="window.__exSubmitWordBank(\'' + id + '\')">\uC815\uB2F5 \uD655\uC778</button>' +
      '<div class="exercise-feedback" id="' + id + '-feedback"></div>' +
      '</div>';
  }

  // ── Render: Categorize ──
  function renderCategorize(ex, id) {
    var shuffledItems = ex.items.slice().sort(function() { return Math.random() - 0.5; });
    var itemsHtml = shuffledItems.map(function(item, i) {
      return '<div class="categorize-item" data-text="' + escAttr(item.text) + '" data-correct-cat="' + escAttr(item.category) + '" data-idx="' + i + '" draggable="true">' + escHtml(item.text) + '</div>';
    }).join('');

    var zonesHtml = ex.categories.map(function(cat) {
      return '<div class="categorize-zone" data-category="' + escAttr(cat) + '">' +
        '<div class="categorize-zone-label">' + escHtml(cat) + '</div>' +
        '<div class="categorize-zone-items"></div>' +
        '</div>';
    }).join('');

    return '<div class="exercise-container" id="' + id + '" data-type="categorize" data-xp="' + ex.xp + '">' +
      '<div class="exercise-header"><span class="exercise-badge">\uD83D\uDCC2 \uBD84\uB958\uD558\uAE30</span><span class="exercise-xp">+' + ex.xp + ' XP</span></div>' +
      '<div class="exercise-question">' + escHtml(ex.question) + '</div>' +
      '<div class="categorize-items" id="' + id + '-items">' + itemsHtml + '</div>' +
      '<div class="categorize-zones" id="' + id + '-zones">' + zonesHtml + '</div>' +
      '<button class="exercise-btn" onclick="window.__exSubmitCategorize(\'' + id + '\')">\uC81C\uCD9C\uD558\uAE30 \u2192</button>' +
      '<div class="exercise-feedback" id="' + id + '-feedback"></div>' +
      '</div>';
  }

  // ── Interaction Handlers ──

  // Hint toggle
  window.__exHint = function(id) {
    var hint = document.getElementById(id + '-hint');
    if (hint) hint.classList.toggle('visible');
  };

  // Code Arrange: drag & click
  function initCodeArrange(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var answerZone = document.getElementById(id + '-answer');
    var tokensZone = document.getElementById(id + '-tokens');

    // Click to move tokens
    tokensZone.addEventListener('click', function(e) {
      var token = e.target.closest('.code-token');
      if (!token || token.classList.contains('placed') || container.classList.contains('answered')) return;

      // Remove placeholder
      var ph = answerZone.querySelector('.placeholder');
      if (ph) ph.remove();

      // Clone to answer zone
      var clone = document.createElement('div');
      clone.className = 'code-token in-answer';
      clone.textContent = token.textContent;
      clone.setAttribute('data-token', token.getAttribute('data-token'));
      clone.addEventListener('click', function() {
        if (container.classList.contains('answered')) return;
        clone.remove();
        token.classList.remove('placed');
        if (answerZone.querySelectorAll('.code-token').length === 0) {
          answerZone.innerHTML = '<span class="placeholder">\uD1A0\uD070\uC744 \uC5EC\uAE30\uC5D0 \uBC30\uCE58\uD558\uC138\uC694</span>';
        }
      });

      answerZone.appendChild(clone);
      token.classList.add('placed');
    });
  }

  window.__exSubmitArrange = function(id) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;
    container.classList.add('answered');

    var answerZone = document.getElementById(id + '-answer');
    var placedTokens = answerZone.querySelectorAll('.code-token');
    var userAnswer = [];
    placedTokens.forEach(function(t) { userAnswer.push(t.getAttribute('data-token')); });

    var correctAnswer;
    try { correctAnswer = JSON.parse(container.getAttribute('data-answer')); } catch(e) { correctAnswer = []; }
    var xp = parseInt(container.getAttribute('data-xp')) || 8;

    var isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);

    // Visual feedback on tokens
    placedTokens.forEach(function(t, i) {
      if (i < correctAnswer.length && t.getAttribute('data-token') === correctAnswer[i]) {
        t.classList.add('correct-token');
      } else {
        t.classList.add('incorrect-token');
      }
    });

    showFeedback(id, isCorrect, xp, 'code-arrange');
  };

  // Output Predict
  window.__exSelectOption = function(id, index) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;
    container.classList.add('answered');

    var answer = container.getAttribute('data-answer');
    var xp = parseInt(container.getAttribute('data-xp')) || 6;
    var buttons = container.querySelectorAll('.quiz-option');
    var correctIdx = -1;

    buttons.forEach(function(btn, i) {
      var text = btn.querySelector('.quiz-option-text').textContent;
      if (text === answer) correctIdx = i;
    });

    var isCorrect = index === correctIdx;

    buttons.forEach(function(btn, i) {
      btn.style.pointerEvents = 'none';
      if (i === correctIdx) btn.classList.add('correct');
      else if (i === index && !isCorrect) btn.classList.add('incorrect');
    });

    showFeedback(id, isCorrect, xp, 'output-predict');
  };

  // Bug Find
  var bugFindState = {};

  window.__exToggleBugLine = function(id, lineNum) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;

    if (!bugFindState[id]) bugFindState[id] = [];
    var lines = bugFindState[id];
    var idx = lines.indexOf(lineNum);

    var lineEl = container.querySelector('.bug-find-line[data-line="' + lineNum + '"]');
    if (idx >= 0) {
      lines.splice(idx, 1);
      if (lineEl) lineEl.classList.remove('selected');
    } else {
      lines.push(lineNum);
      if (lineEl) lineEl.classList.add('selected');
    }

    var selectedEl = document.getElementById(id + '-selected');
    if (selectedEl) {
      selectedEl.textContent = '\uC120\uD0DD\uD55C \uB77C\uC778: ' + (lines.length > 0 ? lines.sort(function(a,b){return a-b;}).join(', ') : '\uC5C6\uC74C');
    }
  };

  window.__exSubmitBugFind = function(id) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;
    container.classList.add('answered');

    var bugLines;
    try { bugLines = JSON.parse(container.getAttribute('data-buglines')); } catch(e) { bugLines = []; }
    var explanations;
    try { explanations = JSON.parse(container.getAttribute('data-explanations')); } catch(e) { explanations = {}; }
    var xp = parseInt(container.getAttribute('data-xp')) || 10;
    var selected = bugFindState[id] || [];

    var correct = 0;
    bugLines.forEach(function(line) {
      var lineEl = container.querySelector('.bug-find-line[data-line="' + line + '"]');
      if (selected.indexOf(line) >= 0) {
        if (lineEl) lineEl.classList.add('correct-bug');
        correct++;
      } else {
        if (lineEl) lineEl.classList.add('missed-bug');
      }
    });

    var isCorrect = correct === bugLines.length && selected.length === bugLines.length;

    // Show explanations
    var expHtml = '';
    bugLines.forEach(function(line) {
      if (explanations[line]) {
        expHtml += '<div>\uB77C\uC778 ' + line + ': ' + escHtml(explanations[line]) + '</div>';
      }
    });

    showFeedback(id, isCorrect, xp, 'bug-find', expHtml);
  };

  // Word Bank
  var wordBankState = {};

  window.__exSelectWordBank = function(id, tokenEl) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;

    if (!wordBankState[id]) wordBankState[id] = { nextBlank: 0 };
    var state = wordBankState[id];

    var blanks = container.querySelectorAll('.word-bank-blank');
    if (state.nextBlank >= blanks.length) return;

    var blank = blanks[state.nextBlank];
    var token = tokenEl.getAttribute('data-token');
    blank.textContent = token;
    blank.classList.add('filled');
    blank.setAttribute('data-filled', token);
    tokenEl.classList.add('used');
    state.nextBlank++;
  };

  window.__exClearBlank = function(id, blankIdx) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;
    if (!wordBankState[id]) return;

    var blank = container.querySelector('.word-bank-blank[data-blank="' + blankIdx + '"]');
    if (!blank || !blank.classList.contains('filled')) return;

    var token = blank.getAttribute('data-filled');
    blank.textContent = '___';
    blank.classList.remove('filled');
    blank.removeAttribute('data-filled');

    // Restore token in pool
    var pool = document.getElementById(id + '-pool');
    if (pool) {
      pool.querySelectorAll('.word-bank-token').forEach(function(t) {
        if (t.getAttribute('data-token') === token && t.classList.contains('used')) {
          t.classList.remove('used');
        }
      });
    }

    // Recalculate nextBlank
    var blanks = container.querySelectorAll('.word-bank-blank');
    wordBankState[id].nextBlank = 0;
    blanks.forEach(function(b) {
      if (b.classList.contains('filled')) wordBankState[id].nextBlank++;
    });
  };

  window.__exSubmitWordBank = function(id) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;
    container.classList.add('answered');

    var correctBlanks;
    try { correctBlanks = JSON.parse(container.getAttribute('data-blanks')); } catch(e) { correctBlanks = []; }
    var xp = parseInt(container.getAttribute('data-xp')) || 5;

    var blanks = container.querySelectorAll('.word-bank-blank');
    var correct = 0;

    blanks.forEach(function(blank, i) {
      var filled = blank.getAttribute('data-filled') || '';
      if (filled.trim().toLowerCase() === (correctBlanks[i] || '').trim().toLowerCase()) {
        blank.classList.add('correct');
        correct++;
      } else {
        blank.classList.add('incorrect');
      }
    });

    var isCorrect = correct === correctBlanks.length;
    showFeedback(id, isCorrect, xp, 'word-bank');
  };

  // Categorize
  function initCategorize(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var itemsZone = document.getElementById(id + '-items');
    var zonesContainer = document.getElementById(id + '-zones');

    // Click to place items into selected zone
    var selectedZone = null;

    zonesContainer.querySelectorAll('.categorize-zone').forEach(function(zone) {
      zone.addEventListener('click', function(e) {
        if (container.classList.contains('answered')) return;
        if (e.target.closest('.categorize-item')) {
          // Clicking an item in zone to remove it
          var item = e.target.closest('.categorize-item');
          var origIdx = item.getAttribute('data-idx');
          var origItem = itemsZone.querySelector('[data-idx="' + origIdx + '"]');
          if (origItem) origItem.classList.remove('placed');
          item.remove();
          return;
        }
        selectedZone = zone;
        zonesContainer.querySelectorAll('.categorize-zone').forEach(function(z) { z.classList.remove('drag-over'); });
        zone.classList.add('drag-over');
      });
    });

    itemsZone.addEventListener('click', function(e) {
      var item = e.target.closest('.categorize-item');
      if (!item || item.classList.contains('placed') || container.classList.contains('answered')) return;

      if (!selectedZone) {
        // Auto-select first zone
        selectedZone = zonesContainer.querySelector('.categorize-zone');
      }

      if (selectedZone) {
        var clone = document.createElement('div');
        clone.className = 'categorize-item in-category';
        clone.textContent = item.textContent;
        clone.setAttribute('data-text', item.getAttribute('data-text'));
        clone.setAttribute('data-correct-cat', item.getAttribute('data-correct-cat'));
        clone.setAttribute('data-idx', item.getAttribute('data-idx'));
        clone.setAttribute('data-placed-cat', selectedZone.getAttribute('data-category'));
        selectedZone.querySelector('.categorize-zone-items').appendChild(clone);
        item.classList.add('placed');
      }
    });
  }

  window.__exSubmitCategorize = function(id) {
    var container = document.getElementById(id);
    if (!container || container.classList.contains('answered')) return;
    container.classList.add('answered');

    var xp = parseInt(container.getAttribute('data-xp')) || 6;
    var zones = container.querySelectorAll('.categorize-zone');
    var correct = 0;
    var total = 0;

    zones.forEach(function(zone) {
      var cat = zone.getAttribute('data-category');
      zone.querySelectorAll('.categorize-item').forEach(function(item) {
        total++;
        if (item.getAttribute('data-correct-cat') === cat) {
          item.classList.add('correct-item');
          correct++;
        } else {
          item.classList.add('incorrect-item');
        }
      });
    });

    var isCorrect = correct === total && total > 0;
    showFeedback(id, isCorrect, xp, 'categorize');
  };

  // ── Shared Feedback ──
  function showFeedback(id, isCorrect, xp, type, extraHtml) {
    var feedback = document.getElementById(id + '-feedback');
    var container = document.getElementById(id);

    if (isCorrect) {
      feedback.className = 'exercise-feedback correct';
      feedback.innerHTML = '<strong>\u2705 \uC815\uB2F5!</strong>' + (extraHtml ? '<div style="margin-top:8px">' + extraHtml + '</div>' : '');
      container.classList.add('feedback-correct');

      // XP & stats
      if (window.GameCore) {
        window.GameCore.addXP(xp, type);
        window.GameCore.recordExercise(type, true);
        window.GameCore.incrementStreak();
      }
      if (window.GameSound) window.GameSound.correct();
      showXPFloat(container, xp);
    } else {
      feedback.className = 'exercise-feedback incorrect';
      feedback.innerHTML = '<strong>\u274C \uD2C0\uB838\uC2B5\uB2C8\uB2E4.</strong>' + (extraHtml ? '<div style="margin-top:8px">' + extraHtml + '</div>' : '');
      container.classList.add('feedback-incorrect');

      if (window.GameCore) {
        window.GameCore.recordExercise(type, false);
        var path = (window.$docsify && window.$docsify._currentPath) || location.hash.replace('#', '').split('?')[0] || '/';
        window.GameCore.useHeart(path);
      }
      if (window.GameSound) window.GameSound.incorrect();
    }

    // Remove animation class after it plays
    setTimeout(function() {
      container.classList.remove('feedback-correct', 'feedback-incorrect');
    }, 600);
  }

  function showXPFloat(container, amount) {
    var rect = container.getBoundingClientRect();
    var el = document.createElement('div');
    el.className = 'xp-float';
    el.textContent = '+' + amount + ' XP';
    el.style.left = (rect.right - 80) + 'px';
    el.style.top = (rect.top + window.scrollY) + 'px';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 1000);
  }

  // ── Register Plugin ──
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.afterEach(function(html, next) {
      exerciseCounter = 0;
      var path = vm.route.path;

      html = html.replace(/<pre[^>]*><code[^>]*class="lang-exercise"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(match, content) {
        var decoded = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        var ex = parseExercise(decoded);
        var id = 'exercise-' + path.replace(/\//g, '-') + '-' + exerciseCounter;
        exerciseCounter++;

        switch(ex.type) {
          case 'code-arrange': return renderCodeArrange(ex, id);
          case 'output-predict': return renderOutputPredict(ex, id);
          case 'bug-find': return renderBugFind(ex, id);
          case 'word-bank': return renderWordBank(ex, id);
          case 'categorize': return renderCategorize(ex, id);
          default: return match;
        }
      });

      next(html);
    });

    hook.doneEach(function() {
      // Initialize interactive exercises
      document.querySelectorAll('.exercise-container[data-type="code-arrange"]').forEach(function(el) {
        if (!el.getAttribute('data-init')) {
          el.setAttribute('data-init', '1');
          initCodeArrange(el.id);
        }
      });

      document.querySelectorAll('.exercise-container[data-type="categorize"]').forEach(function(el) {
        if (!el.getAttribute('data-init')) {
          el.setAttribute('data-init', '1');
          initCategorize(el.id);
        }
      });
    });
  });
})();

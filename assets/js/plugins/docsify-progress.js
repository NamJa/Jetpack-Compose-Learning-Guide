(function() {
  var STORAGE_KEY = 'rn-learning-progress';
  var TOTAL_PAGES = 39;
  var PHASE_MAP = {
    'phase-00-javascript-typescript': { name: 'Phase 0: JS/TS', total: 4 },
    'phase-01-react-basics':         { name: 'Phase 1: React \uAE30\uCD08', total: 4 },
    'phase-02-environment-setup':    { name: 'Phase 2: \uD658\uACBD \uAD6C\uCD95', total: 3 },
    'phase-03-core-components':      { name: 'Phase 3: \uD575\uC2EC \uCEF4\uD3EC\uB10C\uD2B8', total: 4 },
    'phase-04-navigation':           { name: 'Phase 4: \uB124\uBE44\uAC8C\uC774\uC158', total: 4 },
    'phase-05-state-and-networking': { name: 'Phase 5: \uC0C1\uD0DC/\uB124\uD2B8\uC6CC\uD06C', total: 4 },
    'phase-06-new-architecture':     { name: 'Phase 6: New Arch', total: 4 },
    'phase-07-native-modules':       { name: 'Phase 7: \uB124\uC774\uD2F0\uBE0C \uBAA8\uB4C8', total: 3 },
    'phase-08-debugging-testing':    { name: 'Phase 8: \uB514\uBC84\uAE45/\uD14C\uC2A4\uD305', total: 3 },
    'phase-09-project-deployment':   { name: 'Phase 9: \uD504\uB85C\uC81D\uD2B8/\uBC30\uD3EC', total: 3 },
    'phase-10-advanced':             { name: 'Phase 10: \uC2EC\uD654', total: 3 }
  };

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

  function getProgressColor(percent) {
    if (percent >= 100) return '#4ecdc4';
    if (percent >= 67)  return '#61dafb';
    if (percent >= 34)  return '#f5a623';
    return '#e94560';
  }

  // Render top progress bar
  function renderProgressBar() {
    var data = loadProgress();
    var completed = data.completedPages || [];
    var percent = Math.round((completed.length / TOTAL_PAGES) * 100);
    var color = getProgressColor(percent);

    var container = document.querySelector('.progress-bar-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'progress-bar-container';
      // Insert before the main app or at top of body
      var app = document.getElementById('app');
      if (app) {
        app.parentNode.insertBefore(container, app);
      } else {
        document.body.prepend(container);
      }
    }

    var phaseRows = Object.keys(PHASE_MAP).map(function(dir) {
      var info = PHASE_MAP[dir];
      var count = completed.filter(function(p) { return p.includes(dir); }).length;
      var phasePct = Math.round((count / info.total) * 100);
      return '<div class="progress-phase-row">' +
        '<span class="phase-name">' + info.name + '</span>' +
        '<div class="phase-bar"><div style="width:' + phasePct + '%;height:100%;background:' + getProgressColor(phasePct) + ';border-radius:3px;"></div></div>' +
        '<span style="font-size:12px;color:var(--progress-text,#a0a0b0);min-width:50px;text-align:right;">' + count + '/' + info.total + '</span>' +
        '</div>';
    }).join('');

    container.innerHTML =
      '<div class="progress-bar-track">' +
        '<div class="progress-bar-fill" style="width:' + percent + '%;background:' + color + ';"></div>' +
      '</div>' +
      '<span class="progress-bar-text">' + completed.length + '/' + TOTAL_PAGES + ' (' + percent + '%)</span>' +
      '<div class="progress-dropdown">' + phaseRows + '</div>';

    container.onclick = function(e) {
      e.stopPropagation();
      container.querySelector('.progress-dropdown').classList.toggle('open');
    };

    document.addEventListener('click', function() {
      var dd = document.querySelector('.progress-dropdown.open');
      if (dd) dd.classList.remove('open');
    });
  }

  // Update sidebar with completion indicators
  function updateSidebarProgress() {
    var data = loadProgress();
    var completed = data.completedPages || [];
    // Add checkmarks to sidebar items
    document.querySelectorAll('.sidebar-nav a').forEach(function(a) {
      var href = a.getAttribute('href');
      if (href) {
        var path = href.replace('#', '');
        if (completed.includes(path)) {
          if (!a.querySelector('.check-mark')) {
            var span = document.createElement('span');
            span.className = 'check-mark';
            span.textContent = ' \u2713';
            span.style.color = '#4ecdc4';
            span.style.fontWeight = 'bold';
            a.appendChild(span);
          }
        } else {
          // Remove checkmark if page was uncompleted
          var existing = a.querySelector('.check-mark');
          if (existing) {
            existing.remove();
          }
        }
      }
    });
  }

  // Toggle page completion
  window.toggleComplete = function(path) {
    var data = loadProgress();
    var completed = data.completedPages || [];
    var idx = completed.indexOf(path);
    var wasCompleted = idx >= 0;
    if (wasCompleted) {
      completed.splice(idx, 1);
    } else {
      completed.push(path);
    }
    data.completedPages = completed;
    data.lastVisited = path;
    saveProgress(data);
    renderProgressBar();
    updateSidebarProgress();
    // Update button state
    var btn = document.querySelector('.completion-btn');
    if (btn) {
      var isCompleted = completed.includes(path);
      btn.className = 'completion-btn ' + (isCompleted ? 'completed' : '');
      btn.textContent = isCompleted ? '\u2705 \uD559\uC2B5 \uC644\uB8CC!' : '\uD83D\uDCDD \uC774 \uBB38\uC11C \uD559\uC2B5 \uC644\uB8CC\uB85C \uD45C\uC2DC';
    }
    // Award XP for completing a page
    if (!wasCompleted && window.GameCore) {
      window.GameCore.addXP(10, 'page-complete');
      window.GameCore.incrementStreak();
      window.GameCore.checkAndAwardBadges();
    }
  };

  // Register Docsify plugin
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.afterEach(function(html, next) {
      var path = vm.route.path;
      // Don't add completion button to home page
      if (path === '/' || path === '/REACT_NATIVE_LEARNING_PLAN') {
        next(html);
        return;
      }
      var data = loadProgress();
      var completed = data.completedPages || [];
      var isCompleted = completed.includes(path);

      var button = '<div class="completion-section">' +
        '<button class="completion-btn ' + (isCompleted ? 'completed' : '') + '" ' +
        'onclick="toggleComplete(\'' + path + '\')">' +
        (isCompleted ? '\u2705 \uD559\uC2B5 \uC644\uB8CC!' : '\uD83D\uDCDD \uC774 \uBB38\uC11C \uD559\uC2B5 \uC644\uB8CC\uB85C \uD45C\uC2DC') +
        '</button></div>';
      next(html + button);
    });

    hook.doneEach(function() {
      renderProgressBar();
      updateSidebarProgress();
    });
  });
})();

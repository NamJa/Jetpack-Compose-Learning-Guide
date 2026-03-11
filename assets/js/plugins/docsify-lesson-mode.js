/**
 * Docsify Lesson Mode Plugin
 * Splits content by H2 into cards with step-by-step navigation.
 */
(function() {
  'use strict';

  function isLessonModeEnabled() {
    if (!window.GameCore) return false;
    var data = window.GameCore.load();
    return data.settings && data.settings.lessonMode;
  }

  function initLessonMode(vm) {
    var content = document.querySelector('.markdown-section');
    if (!content) return;

    var path = vm.route.path;
    // Skip home page
    if (path === '/' || path === '/REACT_NATIVE_LEARNING_PLAN') return;
    if (!isLessonModeEnabled()) return;

    // Split by H2 headings
    var children = Array.from(content.children);
    var sections = [];
    var currentSection = [];
    var sectionTitles = [];

    children.forEach(function(child) {
      if (child.tagName === 'H2') {
        if (currentSection.length > 0) {
          sections.push(currentSection);
        }
        currentSection = [child];
        sectionTitles.push(child.textContent);
      } else if (child.tagName === 'H1') {
        // Keep H1 always visible (title)
        currentSection.push(child);
      } else {
        currentSection.push(child);
      }
    });

    if (currentSection.length > 0) {
      sections.push(currentSection);
    }

    // Need at least 2 sections for lesson mode
    if (sections.length < 2) return;

    // Check for completion section / button at end
    var completionSection = content.querySelector('.completion-section');

    // Clear content and rebuild
    content.innerHTML = '';

    // Add lesson header
    var header = document.createElement('div');
    header.className = 'lesson-header';
    header.id = 'lesson-header';

    var hearts = window.GameCore ? window.GameCore.getHearts(path) : { current: 5 };
    var heartsHtml = '';
    for (var h = 0; h < 5; h++) {
      heartsHtml += '<span class="heart' + (h >= hearts.current ? ' empty' : '') + '">\u2764\uFE0F</span>';
    }

    header.innerHTML = '<div class="lesson-progress-bar"><div class="lesson-progress-fill" id="lesson-progress-fill" style="width:0%"></div></div>' +
      '<span class="lesson-section-text" id="lesson-section-text">1/' + sections.length + '</span>' +
      '<div class="lesson-hearts hearts-display">' + heartsHtml + '</div>';

    content.appendChild(header);

    // Build section containers
    sections.forEach(function(sectionElements, idx) {
      var sectionDiv = document.createElement('div');
      sectionDiv.className = 'lesson-section' + (idx === 0 ? ' active' : '');
      sectionDiv.setAttribute('data-section', idx);

      sectionElements.forEach(function(el) {
        sectionDiv.appendChild(el);
      });

      // Add nav buttons
      var nav = document.createElement('div');
      nav.className = 'lesson-nav';

      var prevBtn = idx > 0
        ? '<button class="lesson-nav-btn prev" onclick="window.__lessonNav(' + (idx - 1) + ')">\u2190 \uC774\uC804</button>'
        : '<span></span>';

      var nextBtn = idx < sections.length - 1
        ? '<button class="lesson-nav-btn next" onclick="window.__lessonNav(' + (idx + 1) + ')">\uB2E4\uC74C \u2192</button>'
        : '<button class="lesson-nav-btn next" onclick="window.__lessonComplete()">\uC644\uB8CC! \uD83C\uDF89</button>';

      nav.innerHTML = prevBtn + nextBtn;
      sectionDiv.appendChild(nav);

      content.appendChild(sectionDiv);
    });

    // Add lesson complete screen
    var complete = document.createElement('div');
    complete.className = 'lesson-complete';
    complete.id = 'lesson-complete';
    complete.innerHTML = '<div class="complete-emoji">\uD83C\uDF89</div>' +
      '<h2>\uB808\uC2A8 \uC644\uB8CC!</h2>' +
      '<div class="xp-summary" id="lesson-xp-summary">+0 XP</div>' +
      '<div class="stats-row">' +
        '<div><span class="stat-value" id="lesson-stat-correct">0</span>\uC815\uB2F5</div>' +
        '<div><span class="stat-value" id="lesson-stat-hearts">5</span>\u2764\uFE0F \uB0A8\uC74C</div>' +
      '</div>' +
      '<button class="next-lesson-btn" onclick="window.__lessonNextPage()">\uB2E4\uC74C \uB808\uC2A8 \u2192</button>';

    content.appendChild(complete);

    // Re-add completion button
    if (completionSection) {
      content.appendChild(completionSection);
    }

    // Store state
    window._lessonState = {
      currentSection: 0,
      totalSections: sections.length,
      path: path,
      startTime: Date.now()
    };

    updateLessonProgress(0, sections.length);
  }

  function updateLessonProgress(current, total) {
    var pct = Math.round(((current + 1) / total) * 100);
    var fill = document.getElementById('lesson-progress-fill');
    if (fill) fill.style.width = pct + '%';
    var text = document.getElementById('lesson-section-text');
    if (text) text.textContent = (current + 1) + '/' + total;
  }

  window.__lessonNav = function(sectionIdx) {
    var sections = document.querySelectorAll('.lesson-section');
    sections.forEach(function(s) { s.classList.remove('active'); });

    var target = document.querySelector('.lesson-section[data-section="' + sectionIdx + '"]');
    if (target) {
      target.classList.add('active');
      window._lessonState.currentSection = sectionIdx;
      updateLessonProgress(sectionIdx, window._lessonState.totalSections);

      // Scroll to top of section
      var header = document.getElementById('lesson-header');
      if (header) header.scrollIntoView({ behavior: 'smooth' });
    }
  };

  window.__lessonComplete = function() {
    // Hide all sections
    document.querySelectorAll('.lesson-section').forEach(function(s) { s.classList.remove('active'); });

    // Show complete screen
    var complete = document.getElementById('lesson-complete');
    if (complete) complete.classList.add('active');

    // Calculate stats
    var data = window.GameCore ? window.GameCore.load() : {};
    var hearts = (data.hearts && data.hearts.current) || 5;
    var exerciseStats = data.exerciseStats || { totalCorrect: 0 };

    // Award lesson completion XP
    var xpEarned = 10; // base lesson completion
    if (hearts === 5) {
      xpEarned += 10; // perfect lesson bonus
      // Check perfect-lesson badge
      if (window.GameCore && !data.badges.includes('perfect-lesson')) {
        data.badges.push('perfect-lesson');
        window.GameCore.save(data);
        window.GameCore.emit('badge-earned', window.GameCore.getBadgeById('perfect-lesson'));
      }
    }

    if (window.GameCore) {
      window.GameCore.addXP(xpEarned, 'lesson-complete');
      window.GameCore.incrementStreak();
    }

    // Update UI
    var xpSummary = document.getElementById('lesson-xp-summary');
    if (xpSummary) xpSummary.textContent = '+' + xpEarned + ' XP';
    var heartsEl = document.getElementById('lesson-stat-hearts');
    if (heartsEl) heartsEl.textContent = hearts;

    // Speed runner check
    if (window._lessonState) {
      var elapsed = Date.now() - window._lessonState.startTime;
      if (elapsed < 5 * 60 * 1000 && window.GameCore) { // Under 5 minutes
        if (!data.badges.includes('speed-runner')) {
          data.badges.push('speed-runner');
          window.GameCore.save(data);
          window.GameCore.emit('badge-earned', window.GameCore.getBadgeById('speed-runner'));
        }
      }
    }

    if (window.GameConfetti) window.GameConfetti.launch();
    if (window.GameSound) window.GameSound.levelUp();

    // Update progress
    updateLessonProgress(window._lessonState.totalSections - 1, window._lessonState.totalSections);
  };

  window.__lessonNextPage = function() {
    // Find next page in sidebar
    var currentLink = document.querySelector('.sidebar-nav a.active');
    if (currentLink) {
      var li = currentLink.closest('li');
      if (li && li.nextElementSibling) {
        var nextLink = li.nextElementSibling.querySelector('a');
        if (nextLink) {
          nextLink.click();
          return;
        }
      }
    }
    // Fallback: go to home
    window.location.hash = '#/';
  };

  // ── Register Plugin ──
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.doneEach(function() {
      // Small delay to let other plugins render first
      setTimeout(function() { initLessonMode(vm); }, 50);
    });
  });

  // Re-init on lesson mode toggle
  if (window.GameCore) {
    window.GameCore.on('lesson-mode-changed', function() {
      // Reload current page
      var hash = window.location.hash;
      window.location.hash = '';
      setTimeout(function() { window.location.hash = hash; }, 10);
    });
  }
})();

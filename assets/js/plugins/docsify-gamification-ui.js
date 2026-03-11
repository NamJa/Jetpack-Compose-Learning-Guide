/**
 * Docsify Gamification UI Plugin
 * Renders sidebar widgets (streak, daily goal, review), progress bar XP, feedback effects.
 * Uses window.GameCore for data.
 */
(function() {
  'use strict';

  // ── Sidebar Widget ──
  function renderSidebarWidget() {
    if (!window.GameCore) return;
    var data = window.GameCore.load();
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    var existing = sidebar.querySelector('.sidebar-gamification');
    if (existing) existing.remove();

    var streak = data.streak || { current: 0, freezeCount: 0 };
    var xp = data.xp || { total: 0, today: 0 };
    var dailyGoal = data.dailyGoal || { target: 50 };
    var todayXP = xp.today || 0;
    var target = dailyGoal.target || 50;
    var pct = Math.min(100, Math.round((todayXP / target) * 100));
    var level = window.GameCore.getLevel(xp.total);

    // Circle gauge SVG
    var r = 18;
    var circumference = 2 * Math.PI * r;
    var offset = circumference - (pct / 100) * circumference;

    // Review count
    var reviewCount = getReviewCount(data);

    var html = '<div class="sidebar-gamification">' +
      // Streak
      '<div class="streak-display">' +
        '<span class="streak-fire">\uD83D\uDD25</span>' +
        '<span><span class="streak-count">' + streak.current + '</span>\uC77C \uC5F0\uC18D \uD559\uC2B5</span>' +
      '</div>' +
      (streak.freezeCount > 0 ? '<div class="streak-freeze">\uD83D\uDEE1\uFE0F \u00D7 ' + streak.freezeCount + ' \uBCF4\uC720 \uC911</div>' : '') +

      // Daily Goal
      '<div class="daily-goal-widget">' +
        '<div class="daily-goal-circle">' +
          '<svg width="48" height="48" viewBox="0 0 48 48">' +
            '<circle class="circle-bg" cx="24" cy="24" r="' + r + '"/>' +
            '<circle class="circle-fill" cx="24" cy="24" r="' + r + '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"/>' +
          '</svg>' +
          '<span class="circle-text">' + pct + '%</span>' +
        '</div>' +
        '<div class="daily-goal-info">' +
          '<div class="goal-label">\uC624\uB298\uC758 \uBAA9\uD45C</div>' +
          '<div>' + todayXP + ' / ' + target + ' XP</div>' +
        '</div>' +
      '</div>' +

      // Review notification
      (reviewCount > 0 ?
        '<div class="review-notification" onclick="window.__showReviewPopup()">' +
          '\uD83D\uDCDA \uBCF5\uC2B5 \uB300\uAE30: <span class="review-badge-count">' + reviewCount + '</span>\uAC74' +
        '</div>' : '') +

      // Lesson mode toggle
      '<div class="lesson-mode-toggle">' +
        '<button class="lesson-mode-switch' + (data.settings && data.settings.lessonMode ? ' active' : '') + '" onclick="window.__toggleLessonMode()" title="\uB808\uC2A8 \uBAA8\uB4DC"></button>' +
        '<span>\uB808\uC2A8 \uBAA8\uB4DC</span>' +
      '</div>' +

    '</div>';

    var widget = document.createElement('div');
    widget.innerHTML = html;
    var gamWidget = widget.firstChild;

    // Insert after theme toggle
    var themeToggle = sidebar.querySelector('.theme-toggle-wrapper');
    if (themeToggle) {
      themeToggle.parentNode.insertBefore(gamWidget, themeToggle.nextSibling);
    } else {
      sidebar.insertBefore(gamWidget, sidebar.firstChild);
    }
  }

  function getReviewCount(data) {
    if (!data.reviewSchedule) return 0;
    var today = window.GameCore.getToday();
    var count = 0;
    Object.keys(data.reviewSchedule).forEach(function(key) {
      var r = data.reviewSchedule[key];
      if (r.nextReview && r.nextReview <= today) count++;
    });
    return count;
  }

  // ── Progress Bar XP Extension ──
  function updateProgressBarXP() {
    if (!window.GameCore) return;
    var data = window.GameCore.load();
    var xp = data.xp || { total: 0 };
    var level = window.GameCore.getLevel(xp.total);

    var container = document.querySelector('.progress-bar-container');
    if (!container) return;

    var xpEl = container.querySelector('.progress-bar-xp');
    if (!xpEl) {
      xpEl = document.createElement('div');
      xpEl.className = 'progress-bar-xp';
      container.appendChild(xpEl);
    }

    xpEl.innerHTML = '<span class="xp-level">' + level.title.split(' ')[0] + ' Lv.' + level.level + '</span>' +
      '<span class="xp-count">' + xp.total + ' XP</span>';
  }

  // ── Hearts Display in Content ──
  function updateHeartsDisplay(path) {
    if (!window.GameCore) return;
    var hearts = window.GameCore.getHearts(path);

    // Update existing hearts displays
    document.querySelectorAll('.hearts-display').forEach(function(el) {
      var html = '';
      for (var i = 0; i < 5; i++) {
        html += '<span class="heart' + (i >= hearts.current ? ' empty' : '') + '">\u2764\uFE0F</span>';
      }
      el.innerHTML = html;
    });

    // Check if locked
    if (hearts.lockedUntil) {
      var lockTime = new Date(hearts.lockedUntil).getTime();
      if (Date.now() < lockTime) {
        showHeartsLockOverlay(hearts.lockedUntil);
      }
    }
  }

  function showHeartsLockOverlay(lockedUntil) {
    if (document.querySelector('.hearts-lock-overlay')) return;

    var lockTime = new Date(lockedUntil).getTime();
    var remaining = Math.max(0, Math.ceil((lockTime - Date.now()) / 60000));

    var overlay = document.createElement('div');
    overlay.className = 'hearts-lock-overlay';
    overlay.innerHTML = '<div class="hearts-lock-modal">' +
      '<div class="heart-icon">\uD83D\uDC94</div>' +
      '<h3>\uD558\uD2B8\uAC00 \uBAA8\uB450 \uC18C\uC9C4\uB418\uC5C8\uC2B5\uB2C8\uB2E4</h3>' +
      '<p>' + remaining + '\uBD84 \uD6C4 \uC7AC\uB3C4\uC804 \uAC00\uB2A5\uD569\uB2C8\uB2E4</p>' +
      '<div class="btn-row">' +
        '<button class="btn-wait" onclick="this.closest(\'.hearts-lock-overlay\').remove()">\uB2EB\uAE30</button>' +
      '</div>' +
    '</div>';

    document.body.appendChild(overlay);
  }

  // ── Level Up Overlay ──
  function showLevelUpOverlay(data) {
    if (window.GameConfetti) window.GameConfetti.launch();
    if (window.GameSound) window.GameSound.levelUp();

    var overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    overlay.innerHTML = '<div class="levelup-modal">' +
      '<div class="level-icon">\uD83C\uDF89</div>' +
      '<h2>\uB808\uBCA8 \uC5C5!</h2>' +
      '<div class="level-title">' + data.title + '</div>' +
      '<button onclick="this.closest(\'.levelup-overlay\').remove()">\uACC4\uC18D\uD558\uAE30</button>' +
    '</div>';

    document.body.appendChild(overlay);
  }

  // ── Badge Toast ──
  function showBadgeToast(badge) {
    if (window.GameSound) window.GameSound.badge();

    var toast = document.createElement('div');
    toast.className = 'badge-toast';
    toast.innerHTML = '<span class="badge-icon">' + (badge.icon || '\uD83C\uDFC5') + '</span>' +
      '<div class="badge-info"><div class="badge-title">\uB1CC\uC9C0 \uD68D\uB4DD!</div>' +
      '<div>' + (badge.name || badge.id) + '</div></div>';

    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
  }

  // ── Combo Banner ──
  function showCombo(count) {
    if (window.GameSound) window.GameSound.combo();

    var banner = document.createElement('div');
    banner.className = 'combo-banner';
    banner.textContent = '\uD83D\uDD25 ' + count + '\uC5F0\uC18D \uC815\uB2F5!';
    document.body.appendChild(banner);
    setTimeout(function() { banner.remove(); }, 2000);
  }

  // ── Lesson Mode Toggle ──
  window.__toggleLessonMode = function() {
    if (!window.GameCore) return;
    var data = window.GameCore.load();
    if (!data.settings) data.settings = {};
    data.settings.lessonMode = !data.settings.lessonMode;
    window.GameCore.save(data);

    var btn = document.querySelector('.lesson-mode-switch');
    if (btn) btn.classList.toggle('active', data.settings.lessonMode);

    window.GameCore.emit('lesson-mode-changed', { enabled: data.settings.lessonMode });
  };

  // ── Onboarding ──
  function showOnboarding() {
    if (!window.GameCore) return;
    var data = window.GameCore.load();
    if (data.dailyGoal && data.dailyGoal._onboarded) return;

    var overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.innerHTML = '<div class="onboarding-modal">' +
      '<h2>\uD83C\uDF1F \uD559\uC2B5 \uBAA9\uD45C \uC124\uC815</h2>' +
      '<p>\uB9E4\uC77C \uC5BC\uB9C8\uB098 \uD559\uC2B5\uD558\uACE0 \uC2F6\uC73C\uC138\uC694?</p>' +
      '<div class="goal-options">' +
        '<button class="goal-option" onclick="window.__setGoal(20)">' +
          '<span class="goal-emoji">\uD83D\uDC22</span><div class="goal-info"><div class="goal-name">\uAC00\uBCBC\uC6B4 \uD559\uC2B5</div><div class="goal-desc">20 XP / \uD558\uB8E8 2~3\uBD84</div></div>' +
        '</button>' +
        '<button class="goal-option" onclick="window.__setGoal(50)">' +
          '<span class="goal-emoji">\uD83D\uDC07</span><div class="goal-info"><div class="goal-name">\uBCF4\uD1B5 \uD559\uC2B5</div><div class="goal-desc">50 XP / \uD558\uB8E8 10~15\uBD84</div></div>' +
        '</button>' +
        '<button class="goal-option" onclick="window.__setGoal(100)">' +
          '<span class="goal-emoji">\uD83C\uDFC3</span><div class="goal-info"><div class="goal-name">\uC9D1\uC911 \uD559\uC2B5</div><div class="goal-desc">100 XP / \uD558\uB8E8 20~30\uBD84</div></div>' +
        '</button>' +
        '<button class="goal-option" onclick="window.__setGoal(200)">' +
          '<span class="goal-emoji">\uD83D\uDD25</span><div class="goal-info"><div class="goal-name">\uD558\uB4DC\uCF54\uC5B4</div><div class="goal-desc">200 XP / \uD558\uB8E8 1\uC2DC\uAC04+</div></div>' +
        '</button>' +
      '</div>' +
    '</div>';

    document.body.appendChild(overlay);
  }

  window.__setGoal = function(target) {
    if (!window.GameCore) return;
    window.GameCore.setDailyGoal(target);
    var data = window.GameCore.load();
    if (!data.dailyGoal) data.dailyGoal = {};
    data.dailyGoal._onboarded = true;
    window.GameCore.save(data);

    var overlay = document.querySelector('.onboarding-overlay');
    if (overlay) overlay.remove();

    renderSidebarWidget();
  };

  // ── Event Listeners ──
  if (window.GameCore) {
    window.GameCore.on('level-up', showLevelUpOverlay);
    window.GameCore.on('badge-earned', showBadgeToast);
    window.GameCore.on('combo', function(data) { showCombo(data.count); });
    window.GameCore.on('xp-gained', function() {
      updateProgressBarXP();
      renderSidebarWidget();
    });
    window.GameCore.on('heart-lost', function() {
      var path = location.hash.replace('#', '').split('?')[0] || '/';
      updateHeartsDisplay(path);
    });
    window.GameCore.on('hearts-depleted', function(data) {
      showHeartsLockOverlay(data.lockedUntil);
    });
    window.GameCore.on('daily-goal-completed', function() {
      if (window.GameConfetti) window.GameConfetti.launch({ particleCount: 40, duration: 1500 });
      // Award bonus 20 XP (directly, skip recursive check)
      var d = window.GameCore.load();
      d.xp.total += 20;
      d.xp.today += 20;
      var today = window.GameCore.getToday();
      if (!d.xp.history) d.xp.history = {};
      d.xp.history[today] = (d.xp.history[today] || 0) + 20;
      window.GameCore.save(d);

      showCombo(0); // repurpose for daily goal message
      var banner = document.querySelector('.combo-banner');
      if (banner) banner.textContent = '\uD83C\uDF89 \uC77C\uC77C \uBAA9\uD45C \uB2EC\uC131! +20 XP';
    });
    window.GameCore.on('streak-freeze-used', function(data) {
      var banner = document.createElement('div');
      banner.className = 'combo-banner';
      banner.style.background = 'linear-gradient(135deg, #61dafb, #4ecdc4)';
      banner.textContent = '\uD83D\uDEE1\uFE0F Streak Freeze\uB85C \uC2A4\uD2B8\uB9AD\uC774 \uBCF4\uD638\uB418\uC5C8\uC2B5\uB2C8\uB2E4!';
      document.body.appendChild(banner);
      setTimeout(function() { banner.remove(); }, 3000);
    });
  }

  // ── Register Plugin ──
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.doneEach(function() {
      renderSidebarWidget();
      updateProgressBarXP();

      var path = vm.route.path;
      if (path !== '/' && path !== '/REACT_NATIVE_LEARNING_PLAN') {
        updateHeartsDisplay(path);
      }
    });

    hook.ready(function() {
      // Show onboarding on first visit
      setTimeout(showOnboarding, 1000);
    });
  });
})();

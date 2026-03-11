/**
 * Skill Tree Component
 * Renders visual learning path on the home page.
 * Mounted via: <div class="skill-tree-mount"></div> in markdown.
 */
(function() {
  'use strict';

  var PHASE_ICONS = [
    '\uD83D\uDCBB', // Phase 0: Kotlin 기초
    '\uD83D\uDE80', // Phase 1: Compose 시작
    '\uD83D\uDCD0', // Phase 2: 기본 레이아웃
    '\uD83E\uDDE9', // Phase 3: 핵심 컴포넌트
    '\uD83D\uDCE6', // Phase 4: 상태 관리
    '\uD83D\uDDFA\uFE0F', // Phase 5: 내비게이션
    '\uD83C\uDFA8', // Phase 6: Material Design
    '\u2728',       // Phase 7: 애니메이션
    '\uD83D\uDC46', // Phase 8: 터치/제스처
    '\uD83D\uDC1B', // Phase 9: 테스팅/디버깅
    '\u2B50'  // Phase 10: 아키텍처/성능
  ];

  function renderSkillTree() {
    var mount = document.querySelector('.skill-tree-mount');
    if (!mount || !window.GameCore) return;

    var data = window.GameCore.load();
    var completed = data.completedPages || [];

    var html = '<div class="skill-tree">';

    window.GameCore.PHASE_ORDER.forEach(function(phaseKey, idx) {
      var info = window.GameCore.PHASE_MAP[phaseKey];
      var progress = window.GameCore.getPhaseProgress(phaseKey);
      var unlocked = window.GameCore.isPhaseUnlocked(phaseKey);
      var isComplete = progress.completed >= progress.total;
      var isCurrent = unlocked && !isComplete;

      var stateClass = isComplete ? 'completed' : (isCurrent ? 'current' : 'locked');

      // Connector (not before first)
      if (idx > 0) {
        var prevPhaseKey = window.GameCore.PHASE_ORDER[idx - 1];
        var prevProgress = window.GameCore.getPhaseProgress(prevPhaseKey);
        var connectorClass = prevProgress.completed >= prevProgress.total ? ' completed' : '';
        html += '<div class="skill-tree-connector' + connectorClass + '"></div>';
      }

      // Stars
      var stars = '';
      if (isComplete) {
        stars = '\u2B50\u2B50\u2B50';
      } else if (isCurrent && progress.completed > 0) {
        var starCount = Math.ceil((progress.completed / progress.total) * 3);
        for (var s = 0; s < 3; s++) {
          stars += s < starCount ? '\u2B50' : '\u2606';
        }
      }

      // Lessons dropdown
      var lessonsHtml = '<div class="skill-tree-lessons" id="st-lessons-' + idx + '">';
      info.pages.forEach(function(page) {
        var pageName = page.split('/').pop().replace(/-/g, ' ').replace(/^\d+-/, '');
        var isPageComplete = completed.includes(page);
        var pageUnlocked = unlocked;
        var lessonClass = isPageComplete ? 'completed-lesson' : (!pageUnlocked ? 'locked-lesson' : '');
        var statusIcon = isPageComplete ? '\u2705' : (pageUnlocked ? '\u25CB' : '\uD83D\uDD12');

        lessonsHtml += '<a class="skill-tree-lesson-item ' + lessonClass + '" href="#' + page + '">' +
          '<span class="lesson-status">' + statusIcon + '</span>' +
          '<span>' + pageName + '</span></a>';
      });
      lessonsHtml += '</div>';

      html += '<div class="skill-tree-node ' + stateClass + '" onclick="window.__toggleSTLessons(' + idx + ')">' +
        '<div class="skill-tree-circle">' +
          (unlocked ? PHASE_ICONS[idx] : '\uD83D\uDD12') +
        '</div>' +
        '<div class="skill-tree-label">' + info.name + '</div>' +
        (isCurrent ? '<div class="skill-tree-progress">' + progress.completed + '/' + progress.total + '</div>' : '') +
        (stars ? '<div class="skill-tree-stars">' + stars + '</div>' : '') +
        lessonsHtml +
      '</div>';
    });

    html += '</div>';
    mount.innerHTML = html;
  }

  window.__toggleSTLessons = function(idx) {
    var lessons = document.getElementById('st-lessons-' + idx);
    if (!lessons) return;

    // Close all others
    document.querySelectorAll('.skill-tree-lessons.open').forEach(function(el) {
      if (el.id !== 'st-lessons-' + idx) el.classList.remove('open');
    });

    lessons.classList.toggle('open');
  };

  // ── Dashboard Stats ──
  function renderDashboardStats() {
    var mount = document.querySelector('.dashboard-stats-mount');
    if (!mount || !window.GameCore) return;

    var data = window.GameCore.load();
    var xp = data.xp || { total: 0, today: 0 };
    var streak = data.streak || { current: 0, best: 0 };
    var level = window.GameCore.getLevel(xp.total);
    var badges = data.badges || [];
    var completedPages = data.completedPages || [];

    mount.innerHTML = '<div class="dashboard-stats">' +
      '<div class="dashboard-stat"><div class="stat-icon">' + level.title.split(' ')[0] + '</div>' +
        '<div class="stat-value">Lv.' + level.level + '</div><div class="stat-label">' + level.title.split(' ').slice(1).join(' ') + '</div></div>' +
      '<div class="dashboard-stat"><div class="stat-icon">\uD83D\uDD25</div>' +
        '<div class="stat-value">' + streak.current + '\uC77C</div><div class="stat-label">\uC5F0\uC18D \uD559\uC2B5</div></div>' +
      '<div class="dashboard-stat"><div class="stat-icon">\u2B50</div>' +
        '<div class="stat-value">' + xp.total + '</div><div class="stat-label">\uCD1D XP</div></div>' +
      '<div class="dashboard-stat"><div class="stat-icon">\uD83C\uDFC5</div>' +
        '<div class="stat-value">' + badges.length + '</div><div class="stat-label">\uB1CC\uC9C0</div></div>' +
      '<div class="dashboard-stat"><div class="stat-icon">\uD83D\uDCDA</div>' +
        '<div class="stat-value">' + completedPages.length + '/' + window.GameCore.TOTAL_PAGES + '</div><div class="stat-label">\uC644\uB8CC</div></div>' +
    '</div>';
  }

  // ── Badge Grid ──
  function renderBadgePreview() {
    var mount = document.querySelector('.badge-preview-mount');
    if (!mount || !window.GameCore) return;

    var data = window.GameCore.load();
    var earned = data.badges || [];

    var allBadges = window.GameCore.BADGES.slice();
    // Add phase master badges
    window.GameCore.PHASE_ORDER.forEach(function(_, idx) {
      allBadges.push({ id: 'phase-master-' + idx, name: 'Phase ' + idx + ' \uB9C8\uC2A4\uD130', icon: '\uD83C\uDF1F', xp: 50 });
    });

    var html = '<div class="badge-grid">';
    allBadges.forEach(function(badge) {
      var isEarned = earned.includes(badge.id);
      html += '<div class="badge-card' + (isEarned ? '' : ' locked') + '">' +
        '<div class="badge-icon">' + badge.icon + '</div>' +
        '<div class="badge-name">' + badge.name + '</div>' +
        '<div class="badge-desc">' + (isEarned ? '\u2705 \uD68D\uB4DD' : '\uD83D\uDD12 +' + badge.xp + ' XP') + '</div>' +
      '</div>';
    });
    html += '</div>';
    mount.innerHTML = html;
  }

  // ── Register doneEach hook ──
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.doneEach(function() {
      renderSkillTree();
      renderDashboardStats();
      renderBadgePreview();
    });
  });
})();

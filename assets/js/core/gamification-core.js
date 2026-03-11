/**
 * Gamification Core
 * Shared state management, XP, streak, hearts, daily goal, badges logic.
 * Creates window.GameCore for use by all Docsify plugins.
 */
(function() {
  'use strict';
  var STORAGE_KEY = 'compose-learning-progress';
  var TOTAL_PAGES = 38;

  // ── Phase Map (with pages for review system) ──
  var PHASE_MAP = {
    'phase-00-kotlin-basics': {
      name: 'Phase 0: Kotlin 기초',
      total: 3,
      pages: [
        '/phase-00-kotlin-basics/01-kotlin-fundamentals',
        '/phase-00-kotlin-basics/02-kotlin-functional-programming',
        '/phase-00-kotlin-basics/03-coroutines-and-async'
      ]
    },
    'phase-01-compose-introduction': {
      name: 'Phase 1: Compose 시작',
      total: 4,
      pages: [
        '/phase-01-compose-introduction/01-declarative-ui-and-compose',
        '/phase-01-compose-introduction/02-environment-setup',
        '/phase-01-compose-introduction/03-composable-functions',
        '/phase-01-compose-introduction/04-lifecycle-and-recomposition'
      ]
    },
    'phase-02-basic-layouts': {
      name: 'Phase 2: 기본 레이아웃',
      total: 4,
      pages: [
        '/phase-02-basic-layouts/01-column-row-box',
        '/phase-02-basic-layouts/02-modifier-deep-dive',
        '/phase-02-basic-layouts/03-arrangement-and-alignment',
        '/phase-02-basic-layouts/04-constraints-and-responsive'
      ]
    },
    'phase-03-core-components': {
      name: 'Phase 3: 핵심 컴포넌트',
      total: 4,
      pages: [
        '/phase-03-core-components/01-text-and-textfield',
        '/phase-03-core-components/02-button-and-icon',
        '/phase-03-core-components/03-image-and-graphics',
        '/phase-03-core-components/04-lists-and-grids'
      ]
    },
    'phase-04-state-management': {
      name: 'Phase 4: 상태 관리',
      total: 4,
      pages: [
        '/phase-04-state-management/01-state-and-remember',
        '/phase-04-state-management/02-state-hoisting-and-udf',
        '/phase-04-state-management/03-side-effects',
        '/phase-04-state-management/04-viewmodel-integration'
      ]
    },
    'phase-05-navigation': {
      name: 'Phase 5: 내비게이션',
      total: 3,
      pages: [
        '/phase-05-navigation/01-navigation-basics',
        '/phase-05-navigation/02-screen-transitions-and-arguments',
        '/phase-05-navigation/03-advanced-navigation'
      ]
    },
    'phase-06-material-design': {
      name: 'Phase 6: Material Design',
      total: 4,
      pages: [
        '/phase-06-material-design/01-material3-theming',
        '/phase-06-material-design/02-scaffold-and-appbar',
        '/phase-06-material-design/03-dialog-and-bottomsheet',
        '/phase-06-material-design/04-custom-theming'
      ]
    },
    'phase-07-animation': {
      name: 'Phase 7: 애니메이션',
      total: 3,
      pages: [
        '/phase-07-animation/01-basic-animation-api',
        '/phase-07-animation/02-transition-and-visibility',
        '/phase-07-animation/03-advanced-animation'
      ]
    },
    'phase-08-touch-and-gestures': {
      name: 'Phase 8: 터치/제스처',
      total: 3,
      pages: [
        '/phase-08-touch-and-gestures/01-click-and-tap',
        '/phase-08-touch-and-gestures/02-scroll-and-nested-scroll',
        '/phase-08-touch-and-gestures/03-drag-swipe-multitouch'
      ]
    },
    'phase-09-testing-and-debugging': {
      name: 'Phase 9: 테스팅/디버깅',
      total: 3,
      pages: [
        '/phase-09-testing-and-debugging/01-ui-testing-basics',
        '/phase-09-testing-and-debugging/02-testing-patterns',
        '/phase-09-testing-and-debugging/03-debugging-tools'
      ]
    },
    'phase-10-architecture-and-performance': {
      name: 'Phase 10: 아키텍처/성능',
      total: 3,
      pages: [
        '/phase-10-architecture-and-performance/01-architecture-patterns',
        '/phase-10-architecture-and-performance/02-performance-optimization',
        '/phase-10-architecture-and-performance/03-real-world-project'
      ]
    }
  };

  // ── Phase order for skill tree unlock ──
  var PHASE_ORDER = [
    'phase-00-kotlin-basics',
    'phase-01-compose-introduction',
    'phase-02-basic-layouts',
    'phase-03-core-components',
    'phase-04-state-management',
    'phase-05-navigation',
    'phase-06-material-design',
    'phase-07-animation',
    'phase-08-touch-and-gestures',
    'phase-09-testing-and-debugging',
    'phase-10-architecture-and-performance'
  ];

  // ── Level definitions ──
  var LEVELS = [
    { level: 1, xp: 0,    title: '\uD83C\uDF31 새싹 개발자' },
    { level: 2, xp: 100,  title: '\uD83D\uDCD7 입문자' },
    { level: 3, xp: 300,  title: '\uD83D\uDCD8 학습자' },
    { level: 4, xp: 600,  title: '\uD83D\uDCD9 숙련자' },
    { level: 5, xp: 1000, title: '\uD83D\uDCD5 전문가' },
    { level: 6, xp: 1500, title: '\uD83C\uDFC6 마스터' },
    { level: 7, xp: 2500, title: '\uD83D\uDC8E 그랜드마스터' }
  ];

  // ── Badge definitions ──
  var BADGES = [
    { id: 'first-step',      name: '첫 발걸음',      icon: '\uD83C\uDF31', xp: 10 },
    { id: 'quiz-master',     name: '퀴즈 신동',      icon: '\uD83D\uDCDD', xp: 30 },
    { id: 'perfect-lesson',  name: '퍼펙트 레슨',    icon: '\uD83C\uDFAF', xp: 20 },
    { id: 'week-warrior',    name: '일주일 전사',    icon: '\uD83D\uDD25', xp: 50 },
    { id: 'month-warrior',   name: '한 달의 집념',   icon: '\uD83D\uDD25', xp: 200 },
    { id: 'review-master',   name: '복습의 달인',    icon: '\uD83E\uDDE0', xp: 50 },
    { id: 'bug-hunter',      name: '버그 헌터',      icon: '\uD83D\uDC1B', xp: 30 },
    { id: 'code-builder',    name: '코드 빌더',      icon: '\uD83C\uDFD7\uFE0F', xp: 30 },
    { id: 'speed-runner',    name: '스피드러너',     icon: '\u26A1', xp: 40 },
    { id: 'all-clear',       name: '올 클리어',      icon: '\uD83D\uDC8E', xp: 500 },
    { id: 'grand-master',    name: '그랜드마스터',   icon: '\uD83D\uDD2E', xp: 1000 }
  ];
  // Phase master badges are generated dynamically: phase-master-0 .. phase-master-10

  // ── Event system ──
  var _listeners = {};

  function on(event, cb) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(cb);
  }

  function emit(event, data) {
    (_listeners[event] || []).forEach(function(cb) {
      try { cb(data); } catch(e) { console.error('GameCore event error:', e); }
    });
  }

  // ── Storage ──
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  // ── Migration v1 → v2 ──
  function migrate() {
    var data = load();
    if (data.version === 2) return data;

    // Preserve existing v1 fields
    var migrated = {
      version: 2,
      completedPages: data.completedPages || [],
      checklists: data.checklists || {},
      xp: data.xp || { total: 0, today: 0, history: {} },
      level: data.level || 1,
      streak: data.streak || { current: 0, best: 0, lastActiveDate: '', freezeCount: 0 },
      dailyGoal: data.dailyGoal || { target: 50 },
      hearts: data.hearts || { current: 5, lessonPath: '', lockedUntil: null },
      quizResults: data.quizResults || {},
      exerciseStats: data.exerciseStats || {
        totalAnswered: 0, totalCorrect: 0,
        byType: {}, combo: { current: 0, best: 0 }
      },
      badges: data.badges || [],
      reviewSchedule: data.reviewSchedule || {},
      settings: data.settings || { theme: data.theme || 'dark', sound: false, lessonMode: true },
      lastVisited: data.lastVisited || ''
    };

    // Migrate old theme field
    if (data.theme && !data.settings) {
      migrated.settings.theme = data.theme;
    }

    save(migrated);
    return migrated;
  }

  // ── XP System ──
  function getLevel(totalXP) {
    var lvl = LEVELS[0];
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (totalXP >= LEVELS[i].xp) {
        lvl = LEVELS[i];
        break;
      }
    }
    return lvl;
  }

  function getNextLevel(totalXP) {
    for (var i = 0; i < LEVELS.length; i++) {
      if (totalXP < LEVELS[i].xp) return LEVELS[i];
    }
    return null;
  }

  function addXP(amount, source) {
    if (amount <= 0) return;
    var data = load();
    var today = getToday();
    if (!data.xp) data.xp = { total: 0, today: 0, history: {} };

    // Reset today XP if date changed
    var lastHistoryDate = Object.keys(data.xp.history || {}).sort().pop();
    if (lastHistoryDate !== today) {
      data.xp.today = 0;
    }

    var prevLevel = getLevel(data.xp.total);
    data.xp.total += amount;
    data.xp.today += amount;
    if (!data.xp.history) data.xp.history = {};
    data.xp.history[today] = (data.xp.history[today] || 0) + amount;

    // Clean up history older than 30 days
    var keys = Object.keys(data.xp.history).sort();
    while (keys.length > 30) {
      delete data.xp.history[keys.shift()];
    }

    var newLevel = getLevel(data.xp.total);
    data.level = newLevel.level;
    save(data);

    emit('xp-gained', { amount: amount, total: data.xp.total, source: source });

    // Check level up
    if (newLevel.level > prevLevel.level) {
      emit('level-up', { level: newLevel.level, title: newLevel.title });
    }

    // Check daily goal
    checkDailyGoal(data);
    // Check badges
    checkAndAwardBadges();

    return { amount: amount, total: data.xp.total, levelUp: newLevel.level > prevLevel.level };
  }

  // ── Streak System ──
  function checkStreak() {
    var data = load();
    if (!data.streak) data.streak = { current: 0, best: 0, lastActiveDate: '', freezeCount: 0 };
    var today = getToday();
    var last = data.streak.lastActiveDate;

    if (last === today) {
      // Already active today
      return data.streak;
    }

    if (!last) {
      // First time
      data.streak.lastActiveDate = today;
      save(data);
      return data.streak;
    }

    var lastDate = new Date(last + 'T00:00:00');
    var todayDate = new Date(today + 'T00:00:00');
    var diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Yesterday - streak continues (will increment on first activity)
    } else if (diffDays > 1) {
      // Missed days
      var missedDays = diffDays - 1;
      if (data.streak.freezeCount >= missedDays) {
        // Use freezes
        data.streak.freezeCount -= missedDays;
        emit('streak-freeze-used', { count: missedDays });
      } else {
        // Reset streak
        var oldStreak = data.streak.current;
        data.streak.current = 0;
        if (oldStreak > 0) {
          emit('streak-lost', { was: oldStreak });
        }
      }
    }

    data.streak.lastActiveDate = today;
    save(data);
    return data.streak;
  }

  function incrementStreak() {
    var data = load();
    var today = getToday();
    if (!data.streak) data.streak = { current: 0, best: 0, lastActiveDate: '', freezeCount: 0 };

    // Only increment once per day
    if (data.streak._lastIncrement === today) return data.streak;

    data.streak.current += 1;
    data.streak._lastIncrement = today;
    data.streak.lastActiveDate = today;
    if (data.streak.current > data.streak.best) {
      data.streak.best = data.streak.current;
    }

    // Award streak freeze at 3-day multiples (max 2)
    if (data.streak.current > 0 && data.streak.current % 3 === 0 && data.streak.freezeCount < 2) {
      data.streak.freezeCount = Math.min(2, data.streak.freezeCount + 1);
      emit('streak-freeze-earned', { count: data.streak.freezeCount });
    }

    save(data);
    emit('streak-updated', { current: data.streak.current, best: data.streak.best });
    return data.streak;
  }

  // ── Hearts System ──
  function getHearts(path) {
    var data = load();
    if (!data.hearts) data.hearts = { current: 5, lessonPath: '', lockedUntil: null };

    // Check if locked
    if (data.hearts.lockedUntil) {
      var lockTime = new Date(data.hearts.lockedUntil).getTime();
      if (Date.now() >= lockTime) {
        data.hearts.current = 5;
        data.hearts.lockedUntil = null;
        data.hearts.lessonPath = '';
        save(data);
      }
    }

    // Reset hearts if different lesson
    if (path && data.hearts.lessonPath !== path) {
      data.hearts.current = 5;
      data.hearts.lessonPath = path;
      data.hearts.lockedUntil = null;
      save(data);
    }

    return data.hearts;
  }

  function useHeart(path) {
    var data = load();
    if (!data.hearts) data.hearts = { current: 5, lessonPath: path, lockedUntil: null };

    // Check if locked
    if (data.hearts.lockedUntil) {
      var lockTime = new Date(data.hearts.lockedUntil).getTime();
      if (Date.now() < lockTime) {
        return { locked: true, current: 0, lockedUntil: data.hearts.lockedUntil };
      }
      data.hearts.current = 5;
      data.hearts.lockedUntil = null;
    }

    data.hearts.current = Math.max(0, data.hearts.current - 1);

    if (data.hearts.current === 0) {
      // Lock for 30 minutes
      var lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      data.hearts.lockedUntil = lockUntil;
      emit('hearts-depleted', { lockedUntil: lockUntil });
    }

    save(data);
    emit('heart-lost', { current: data.hearts.current });
    return data.hearts;
  }

  function recoverHeart(path) {
    var data = load();
    if (!data.hearts) return;
    data.hearts.current = Math.min(5, data.hearts.current + 1);
    if (data.hearts.current > 0) {
      data.hearts.lockedUntil = null;
    }
    save(data);
    emit('heart-recovered', { current: data.hearts.current });
    return data.hearts;
  }

  // ── Daily Goal ──
  function checkDailyGoal(data) {
    if (!data) data = load();
    var target = (data.dailyGoal && data.dailyGoal.target) || 50;
    var todayXP = (data.xp && data.xp.today) || 0;

    if (todayXP >= target) {
      // Check if already awarded today
      var today = getToday();
      if (!data.dailyGoal) data.dailyGoal = { target: target };
      if (data.dailyGoal._lastCompleted !== today) {
        data.dailyGoal._lastCompleted = today;
        save(data);
        emit('daily-goal-completed', { target: target, todayXP: todayXP });
        // Award bonus XP (via emit, not recursive addXP)
        // The UI plugin will handle the +20 XP bonus
      }
    }
  }

  function setDailyGoal(target) {
    var data = load();
    if (!data.dailyGoal) data.dailyGoal = {};
    data.dailyGoal.target = target;
    save(data);
  }

  // ── Exercise Stats ──
  function recordExercise(type, correct) {
    var data = load();
    if (!data.exerciseStats) {
      data.exerciseStats = { totalAnswered: 0, totalCorrect: 0, byType: {}, combo: { current: 0, best: 0 } };
    }
    var stats = data.exerciseStats;
    stats.totalAnswered += 1;
    if (correct) stats.totalCorrect += 1;

    if (!stats.byType[type]) stats.byType[type] = { answered: 0, correct: 0 };
    stats.byType[type].answered += 1;
    if (correct) stats.byType[type].correct += 1;

    if (!stats.combo) stats.combo = { current: 0, best: 0 };
    if (correct) {
      stats.combo.current += 1;
      if (stats.combo.current > stats.combo.best) {
        stats.combo.best = stats.combo.current;
      }
      if (stats.combo.current >= 3) {
        emit('combo', { count: stats.combo.current });
      }
    } else {
      stats.combo.current = 0;
    }

    save(data);
    return stats;
  }

  // ── Badges ──
  function checkAndAwardBadges() {
    var data = load();
    if (!data.badges) data.badges = [];
    var newBadges = [];

    // first-step: first lesson completed
    if (!data.badges.includes('first-step') && data.completedPages && data.completedPages.length >= 1) {
      data.badges.push('first-step');
      newBadges.push(getBadgeById('first-step'));
    }

    // quiz-master: 50 correct quiz answers
    var totalCorrect = (data.exerciseStats && data.exerciseStats.totalCorrect) || 0;
    if (!data.badges.includes('quiz-master') && totalCorrect >= 50) {
      data.badges.push('quiz-master');
      newBadges.push(getBadgeById('quiz-master'));
    }

    // week-warrior: 7 day streak
    var streak = (data.streak && data.streak.current) || 0;
    var bestStreak = (data.streak && data.streak.best) || 0;
    var maxStreak = Math.max(streak, bestStreak);
    if (!data.badges.includes('week-warrior') && maxStreak >= 7) {
      data.badges.push('week-warrior');
      newBadges.push(getBadgeById('week-warrior'));
    }

    // month-warrior: 30 day streak
    if (!data.badges.includes('month-warrior') && maxStreak >= 30) {
      data.badges.push('month-warrior');
      newBadges.push(getBadgeById('month-warrior'));
    }

    // bug-hunter: 10 bug-find correct
    var bugStats = data.exerciseStats && data.exerciseStats.byType && data.exerciseStats.byType['bug-find'];
    if (!data.badges.includes('bug-hunter') && bugStats && bugStats.correct >= 10) {
      data.badges.push('bug-hunter');
      newBadges.push(getBadgeById('bug-hunter'));
    }

    // code-builder: 20 code-arrange correct
    var codeStats = data.exerciseStats && data.exerciseStats.byType && data.exerciseStats.byType['code-arrange'];
    if (!data.badges.includes('code-builder') && codeStats && codeStats.correct >= 20) {
      data.badges.push('code-builder');
      newBadges.push(getBadgeById('code-builder'));
    }

    // review-master: 20 review completions
    var reviewCount = 0;
    if (data.reviewSchedule) {
      Object.keys(data.reviewSchedule).forEach(function(k) {
        reviewCount += (data.reviewSchedule[k].reviewCount || 0);
      });
    }
    if (!data.badges.includes('review-master') && reviewCount >= 20) {
      data.badges.push('review-master');
      newBadges.push(getBadgeById('review-master'));
    }

    // Phase master badges
    PHASE_ORDER.forEach(function(phaseKey, idx) {
      var badgeId = 'phase-master-' + idx;
      if (!data.badges.includes(badgeId)) {
        var info = PHASE_MAP[phaseKey];
        var completed = (data.completedPages || []).filter(function(p) { return p.includes(phaseKey); }).length;
        if (completed >= info.total) {
          // Check quiz score >= 60%
          var quizTotal = 0, quizCorrect = 0;
          info.pages.forEach(function(page) {
            var r = data.quizResults && data.quizResults[page];
            if (r) { quizTotal += r.total; quizCorrect += r.score; }
          });
          if (quizTotal === 0 || (quizCorrect / quizTotal) >= 0.6) {
            data.badges.push(badgeId);
            newBadges.push({ id: badgeId, name: 'Phase ' + idx + ' 마스터', icon: '\uD83C\uDF1F', xp: 50 });
          }
        }
      }
    });

    // all-clear: all phases complete
    if (!data.badges.includes('all-clear')) {
      var allComplete = PHASE_ORDER.every(function(phaseKey, idx) {
        return data.badges.includes('phase-master-' + idx);
      });
      if (allComplete) {
        data.badges.push('all-clear');
        newBadges.push(getBadgeById('all-clear'));
      }
    }

    if (newBadges.length > 0) {
      save(data);
      newBadges.forEach(function(badge) {
        emit('badge-earned', badge);
      });
    }

    return newBadges;
  }

  function getBadgeById(id) {
    for (var i = 0; i < BADGES.length; i++) {
      if (BADGES[i].id === id) return BADGES[i];
    }
    return { id: id, name: id, icon: '\uD83C\uDF1F', xp: 0 };
  }

  // ── Phase unlock check ──
  function isPhaseUnlocked(phaseKey) {
    var idx = PHASE_ORDER.indexOf(phaseKey);
    if (idx <= 0) return true; // Phase 0 always unlocked

    var data = load();
    var prevPhaseKey = PHASE_ORDER[idx - 1];
    var prevPhase = PHASE_MAP[prevPhaseKey];
    if (!prevPhase) return true;

    var completed = (data.completedPages || []).filter(function(p) {
      return p.includes(prevPhaseKey);
    }).length;

    if (completed < prevPhase.total) return false;

    // Check quiz score >= 60%
    var quizTotal = 0, quizCorrect = 0;
    prevPhase.pages.forEach(function(page) {
      var r = data.quizResults && data.quizResults[page];
      if (r) { quizTotal += r.total; quizCorrect += r.score; }
    });

    return quizTotal === 0 || (quizCorrect / quizTotal) >= 0.6;
  }

  function getPhaseProgress(phaseKey) {
    var data = load();
    var info = PHASE_MAP[phaseKey];
    if (!info) return { completed: 0, total: 0, percent: 0 };
    var completed = (data.completedPages || []).filter(function(p) {
      return p.includes(phaseKey);
    }).length;
    return {
      completed: completed,
      total: info.total,
      percent: Math.round((completed / info.total) * 100)
    };
  }

  // ── Export ──
  window.GameCore = {
    STORAGE_KEY: STORAGE_KEY,
    TOTAL_PAGES: TOTAL_PAGES,
    PHASE_MAP: PHASE_MAP,
    PHASE_ORDER: PHASE_ORDER,
    LEVELS: LEVELS,
    BADGES: BADGES,

    load: load,
    save: save,
    migrate: migrate,
    getToday: getToday,

    addXP: addXP,
    getLevel: getLevel,
    getNextLevel: getNextLevel,

    checkStreak: checkStreak,
    incrementStreak: incrementStreak,

    getHearts: getHearts,
    useHeart: useHeart,
    recoverHeart: recoverHeart,

    checkDailyGoal: checkDailyGoal,
    setDailyGoal: setDailyGoal,

    recordExercise: recordExercise,

    checkAndAwardBadges: checkAndAwardBadges,
    getBadgeById: getBadgeById,

    isPhaseUnlocked: isPhaseUnlocked,
    getPhaseProgress: getPhaseProgress,

    on: on,
    emit: emit
  };

  // Run migration on load
  migrate();
  // Check streak on load
  checkStreak();
})();

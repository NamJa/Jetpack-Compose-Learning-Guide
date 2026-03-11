(function() {
  var STORAGE_KEY = 'rn-learning-progress';

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

  function getPreferredTheme() {
    var data = loadProgress();
    // Support both v1 (data.theme) and v2 (data.settings.theme)
    var theme = (data.settings && data.settings.theme) || data.theme;
    if (theme) return theme;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    // Update toggle button state if it exists
    var btn = document.querySelector('.theme-toggle-btn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
      btn.setAttribute('title', theme === 'dark' ? '\uB77C\uC774\uD2B8 \uBAA8\uB4DC\uB85C \uC804\uD658' : '\uB2E4\uD06C \uBAA8\uB4DC\uB85C \uC804\uD658');
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  function toggleTheme() {
    var data = loadProgress();
    var currentTheme = (data.settings && data.settings.theme) || data.theme || getPreferredTheme();
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Save in both v1 and v2 paths for compatibility
    data.theme = newTheme;
    if (!data.settings) data.settings = {};
    data.settings.theme = newTheme;
    saveProgress(data);
    applyTheme(newTheme);
  }

  function createToggleButton() {
    // Don't create duplicate
    if (document.querySelector('.theme-toggle-btn')) return;

    var btn = document.createElement('button');
    btn.className = 'theme-toggle-btn';
    btn.type = 'button';

    var theme = getPreferredTheme();
    btn.textContent = theme === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
    btn.setAttribute('title', theme === 'dark' ? '\uB77C\uC774\uD2B8 \uBAA8\uB4DC\uB85C \uC804\uD658' : '\uB2E4\uD06C \uBAA8\uB4DC\uB85C \uC804\uD658');
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleTheme();
    });

    // Try to insert into sidebar
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      var wrapper = document.createElement('div');
      wrapper.className = 'theme-toggle-wrapper';
      wrapper.appendChild(btn);
      sidebar.insertBefore(wrapper, sidebar.firstChild);
    } else {
      // Fallback: insert at top-right of body
      btn.style.position = 'fixed';
      btn.style.top = '10px';
      btn.style.right = '10px';
      btn.style.zIndex = '999';
      document.body.appendChild(btn);
    }
  }

  // Apply theme immediately on script load (before Docsify renders)
  // This prevents flash of unstyled content
  var initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      var data = loadProgress();
      // Only auto-switch if user hasn't explicitly set a preference
      if (!data.theme) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Register Docsify plugin
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.ready(function() {
      createToggleButton();
    });

    hook.doneEach(function() {
      // Ensure button exists after route changes
      createToggleButton();
      // Re-apply theme in case DOM was rebuilt
      var theme = getPreferredTheme();
      applyTheme(theme);
    });
  });
})();

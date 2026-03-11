(function() {
  var playgroundCounter = 0;

  // Strip Prism.js syntax highlighting HTML tags from code content
  function stripHtmlTags(str) {
    return str.replace(/<[^>]*>/g, '');
  }

  // Escape HTML for display
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Render a JavaScript playground
  function renderPlayground(code, id) {
    var escapedCode = escapeHtml(code);

    return '<div class="playground-container" id="' + id + '">' +
      '<div class="playground-header">' +
        '<span class="playground-badge">\u25B6 JavaScript Playground</span>' +
        '<div class="playground-actions">' +
          '<button class="playground-btn playground-run-btn" onclick="window.__playgroundRun(\'' + id + '\')">\u25B6 \uC2E4\uD589</button>' +
          '<button class="playground-btn playground-reset-btn" onclick="window.__playgroundReset(\'' + id + '\')">\u21BA \uCD08\uAE30\uD654</button>' +
        '</div>' +
      '</div>' +
      '<div class="playground-editor">' +
        '<textarea class="playground-textarea" spellcheck="false">' + escapeHtml(code) + '</textarea>' +
      '</div>' +
      '<div class="playground-output">' +
        '<div class="playground-output-header">\uCD9C\uB825 \uACB0\uACFC</div>' +
        '<pre class="playground-output-content"></pre>' +
      '</div>' +
      '</div>';
  }

  // Detect third-party dependencies from import statements
  function detectDependencies(code) {
    var deps = {};
    var importRegex = /from\s+['"]([^'"./][^'"]*)['"]/g;
    var match;
    while ((match = importRegex.exec(code)) !== null) {
      var pkg = match[1];
      // Handle scoped packages (@org/pkg)
      if (pkg.startsWith('@')) {
        pkg = pkg.split('/').slice(0, 2).join('/');
      } else {
        pkg = pkg.split('/')[0];
      }
      // Skip built-in packages
      if (pkg !== 'react' && pkg !== 'react-native') {
        deps[pkg] = '*';
      }
    }
    // Add peer dependencies for react-navigation
    if (deps['@react-navigation/native'] || deps['@react-navigation/native-stack'] ||
        deps['@react-navigation/bottom-tabs'] || deps['@react-navigation/drawer']) {
      deps['@react-navigation/native'] = '*';
      deps['react-native-screens'] = '*';
      deps['react-native-safe-area-context'] = '*';
    }
    if (deps['@react-navigation/drawer']) {
      deps['react-native-gesture-handler'] = '*';
      deps['react-native-reanimated'] = '*';
    }
    var result = Object.keys(deps).map(function(k) { return k + '@' + deps[k]; }).join(',');
    return result;
  }

  // Render Expo Snack embed placeholder
  function renderSnack(code, id) {
    var encodedCode = encodeURIComponent(code);

    return '<div class="playground-container playground-snack" id="' + id + '">' +
      '<div class="playground-header">' +
        '<span class="playground-badge">\uD83D\uDCF1 Expo Snack</span>' +
      '</div>' +
      '<div class="snack-placeholder" onclick="window.__playgroundLoadSnack(\'' + id + '\')">' +
        '<div class="snack-placeholder-icon">\u25B6</div>' +
        '<div class="snack-placeholder-text">\uCF54\uB4DC \uC2E4\uD589\uD558\uAE30 (Expo Snack)</div>' +
        '<div class="snack-placeholder-hint">\uD074\uB9AD\uD558\uBA74 Expo Snack\uC774 \uB85C\uB4DC\uB429\uB2C8\uB2E4</div>' +
      '</div>' +
      '<div class="snack-iframe-container" style="display:none;">' +
        '<iframe class="snack-iframe" data-code="' + encodedCode + '" style="width:100%;height:500px;border:0;border-radius:4px;overflow:hidden;" loading="lazy"></iframe>' +
      '</div>' +
      '<div class="snack-source">' +
        '<details>' +
          '<summary>\uD83D\uDCCB \uC18C\uC2A4 \uCF54\uB4DC \uBCF4\uAE30</summary>' +
          '<pre><code class="language-jsx">' + escapeHtml(code) + '</code></pre>' +
        '</details>' +
      '</div>' +
      '</div>';
  }

  // Run JavaScript code in playground
  window.__playgroundRun = function(id) {
    var container = document.getElementById(id);
    if (!container) return;

    var textarea = container.querySelector('.playground-textarea');
    var outputEl = container.querySelector('.playground-output-content');
    var code = textarea.value;

    // Clear previous output
    outputEl.textContent = '';
    var outputs = [];

    // Create a sandboxed console
    var sandboxConsole = {
      log: function() {
        var args = Array.prototype.slice.call(arguments);
        var line = args.map(function(a) {
          if (typeof a === 'object') {
            try { return JSON.stringify(a, null, 2); }
            catch (e) { return String(a); }
          }
          return String(a);
        }).join(' ');
        outputs.push(line);
      },
      error: function() {
        var args = Array.prototype.slice.call(arguments);
        outputs.push('\u274C Error: ' + args.join(' '));
      },
      warn: function() {
        var args = Array.prototype.slice.call(arguments);
        outputs.push('\u26A0\uFE0F Warning: ' + args.join(' '));
      },
      info: function() {
        var args = Array.prototype.slice.call(arguments);
        outputs.push('\u2139\uFE0F ' + args.join(' '));
      },
      table: function(data) {
        try { outputs.push(JSON.stringify(data, null, 2)); }
        catch (e) { outputs.push(String(data)); }
      },
      clear: function() {
        outputs = [];
      }
    };

    try {
      // Use Function constructor for safer execution
      var fn = new Function('console', code);
      var result = fn(sandboxConsole);

      // If the code returns a value and nothing was logged, show the return value
      if (result !== undefined && outputs.length === 0) {
        if (typeof result === 'object') {
          try { outputs.push(JSON.stringify(result, null, 2)); }
          catch (e) { outputs.push(String(result)); }
        } else {
          outputs.push(String(result));
        }
      }

      outputEl.textContent = outputs.join('\n');
      if (outputs.length === 0) {
        outputEl.textContent = '(\uCD9C\uB825 \uC5C6\uC74C)';
        outputEl.style.opacity = '0.5';
      } else {
        outputEl.style.opacity = '1';
      }
    } catch (e) {
      outputEl.textContent = '\u274C ' + e.name + ': ' + e.message;
      outputEl.style.color = '#e94560';
    }

    // Show output panel
    container.querySelector('.playground-output').style.display = 'block';
  };

  // Reset playground to original code
  window.__playgroundReset = function(id) {
    var container = document.getElementById(id);
    if (!container) return;

    var textarea = container.querySelector('.playground-textarea');
    var original = container.getAttribute('data-original');
    if (original) {
      textarea.value = original;
    }

    var outputEl = container.querySelector('.playground-output-content');
    outputEl.textContent = '';
    outputEl.style.color = '';
    outputEl.style.opacity = '';
    container.querySelector('.playground-output').style.display = 'none';
  };

  // Load Expo Snack inside an isolated srcdoc iframe with embed.js
  // Each snack gets its own iframe + embed.js instance → no cross-snack interference
  // embed.js uses postMessage to deliver code → no URL length limit → Android/iOS work
  window.__playgroundLoadSnack = function(id) {
    var container = document.getElementById(id);
    if (!container) return;

    var placeholder = container.querySelector('.snack-placeholder');
    var iframeContainer = container.querySelector('.snack-iframe-container');
    var iframe = container.querySelector('.snack-iframe');

    if (placeholder) placeholder.style.display = 'none';
    if (iframeContainer) iframeContainer.style.display = 'block';

    // Skip if already loaded
    if (iframe.getAttribute('data-loaded')) return;
    iframe.setAttribute('data-loaded', 'true');

    var code = decodeURIComponent(iframe.getAttribute('data-code'));
    var deps = detectDependencies(code);
    var files = JSON.stringify({ 'App.js': { type: 'CODE', contents: code } });

    // Escape for safe embedding inside a <script> tag
    var safeFiles = JSON.stringify(files).replace(/<\//g, '<\\/');

    var html = '<!DOCTYPE html><html><head>' +
      '<style>*{margin:0;padding:0;}html,body{height:100%;overflow:hidden;}</style></head><body>' +
      '<div id="snack"' +
      ' data-snack-name="RN Learning Example"' +
      ' data-snack-sdkversion="52.0.0"' +
      ' data-snack-platform="web"' +
      ' data-snack-theme="dark"' +
      ' data-snack-preview="true"' +
      (deps ? ' data-snack-dependencies="' + deps.replace(/"/g, '&quot;') + '"' : '') +
      ' style="overflow:hidden;height:100%;width:100%;"></div>' +
      '<script>document.getElementById("snack").setAttribute("data-snack-files",' + safeFiles + ');<\/script>' +
      '<script src="https://snack.expo.dev/embed.js"><\/script>' +
      '</body></html>';

    iframe.srcdoc = html;
  };

  // Register Docsify plugin
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.afterEach(function(html, next) {
      playgroundCounter = 0;

      // Match code blocks with [playground] in the language tag
      // Docsify renders ```javascript [playground] as <code class="lang-javascript [playground]">
      // or it might be class="lang-javascript" with [playground] in various positions
      html = html.replace(/<pre[^>]*><code[^>]*class="lang-([^"]*?\[playground\][^"]*?)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(match, lang, content) {
        var decoded = stripHtmlTags(content)
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        var id = 'playground-' + playgroundCounter;
        playgroundCounter++;

        var rendered = renderPlayground(decoded, id);
        return rendered;
      });

      // Match code blocks with [snack] in the language tag
      html = html.replace(/<pre[^>]*><code[^>]*class="lang-([^"]*?\[snack\][^"]*?)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(match, lang, content) {
        var decoded = stripHtmlTags(content)
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        var id = 'snack-' + playgroundCounter;
        playgroundCounter++;

        return renderSnack(decoded, id);
      });

      next(html);
    });

    hook.doneEach(function() {
      // Store original code for reset functionality
      document.querySelectorAll('.playground-container').forEach(function(container) {
        if (container.classList.contains('playground-snack')) return;
        var textarea = container.querySelector('.playground-textarea');
        if (textarea && !container.getAttribute('data-original')) {
          container.setAttribute('data-original', textarea.value);
          // Set textarea height to fit all lines (line-height:1.6 * font-size:13px ≈ 20.8px, padding:12px*2)
          var lineCount = textarea.value.split('\n').length;
          textarea.style.height = Math.ceil(lineCount * 20.8 + 24) + 'px';
        }
      });

      // Apply Prism.js highlighting to snack source code
      if (window.Prism) {
        document.querySelectorAll('.snack-source code').forEach(function(el) {
          window.Prism.highlightElement(el);
        });
      }

      // Handle textarea tab key for better editing
      document.querySelectorAll('.playground-textarea').forEach(function(textarea) {
        if (textarea.getAttribute('data-tab-handler')) return;
        textarea.setAttribute('data-tab-handler', 'true');

        textarea.addEventListener('keydown', function(e) {
          if (e.key === 'Tab') {
            e.preventDefault();
            var start = textarea.selectionStart;
            var end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }
          // Ctrl/Cmd + Enter to run
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            var id = textarea.closest('.playground-container').id;
            window.__playgroundRun(id);
          }
        });
      });
    });
  });
})();

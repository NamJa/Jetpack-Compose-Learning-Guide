(function() {
  var playgroundCounter = 0;

  function stripHtmlTags(str) {
    return str.replace(/<[^>]*>/g, '');
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function decodeHtmlEntities(str) {
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  // Strip JetBrains kotlin-playground markers (//sampleStart, //sampleEnd)
  function cleanKotlinCode(code) {
    return code
      .split('\n')
      .filter(function(line) {
        return !/^\s*\/\/sampleStart\s*$/.test(line) && !/^\s*\/\/sampleEnd\s*$/.test(line);
      })
      .join('\n');
  }

  // =========================================================================
  // Compose WASM Compiler & Runtime Engine
  // Uses Kotlin Playground Compose server for compilation and execution
  // =========================================================================
  var ComposeWasm = (function() {
    var COMPOSE_SERVER = 'https://compose-stage.sandbox.intellij.net';
    var COMPILE_URL = COMPOSE_SERVER + '/api/compiler/translate?compiler=compose-wasm';
    var VERSIONS_URL = COMPOSE_SERVER + '/api/resource/compose-wasm-versions';

    // Korean font URL (Spoqa Han Sans Neo Regular TTF - 511KB subset covering common Hangul)
    var KOREAN_FONT_URL = 'https://cdn.jsdelivr.net/gh/spoqa/spoqa-han-sans@latest/Subset/SpoqaHanSansNeo/SpoqaHanSansNeo-Regular.ttf';

    // Cached resources (persists across runs within same page session)
    var _versions = null;
    var _skikoMjsText = null;
    var _stdlibMjsText = null;
    var _koreanFontBytes = null;

    function getVersions() {
      if (_versions) return Promise.resolve(_versions);
      return fetch(VERSIONS_URL)
        .then(function(r) { return r.json(); })
        .then(function(v) { _versions = v; return v; });
    }

    function compile(code) {
      return fetch(COMPILE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          args: '',
          files: [{ name: 'File.kt', text: code, publicId: '' }],
          confType: 'compose-wasm'
        })
      }).then(function(r) { return r.json(); });
    }

    function fetchSkikoMjs(versions) {
      if (_skikoMjsText) return Promise.resolve(_skikoMjsText);
      var skikoWasmUrl = COMPOSE_SERVER + '/api/resource/skiko-' + versions.skiko + '.wasm';
      return fetch(COMPOSE_SERVER + '/api/resource/skiko-' + versions.skiko + '.mjs')
        .then(function(r) { return r.text(); })
        .then(function(code) {
          _skikoMjsText = code.replace(
            'new URL("skiko.wasm",import.meta.url).href',
            "'" + skikoWasmUrl + "'"
          );
          return _skikoMjsText;
        });
    }

    function fetchStdlibMjs(versions) {
      if (_stdlibMjsText) return Promise.resolve(_stdlibMjsText);
      var stdlibWasmUrl = COMPOSE_SERVER + '/api/resource/stdlib-' + versions.stdlib + '.wasm';
      return fetch(COMPOSE_SERVER + '/api/resource/stdlib-' + versions.stdlib + '.mjs')
        .then(function(r) { return r.text(); })
        .then(function(code) {
          var patched = "const stdlibWasm = fetch('" + stdlibWasmUrl + "');\n" + code;
          patched = patched.replace(
            "fetch(new URL('./stdlib_master.wasm',import.meta.url).href)",
            "stdlibWasm"
          );
          patched = patched.replace(
            "(extends) => { return { extends }; }",
            "(extends_) => { return { extends: extends_ }; }"
          );
          _stdlibMjsText = patched;
          return _stdlibMjsText;
        });
    }

    function fetchKoreanFont() {
      if (_koreanFontBytes) return Promise.resolve(_koreanFontBytes);
      return fetch(KOREAN_FONT_URL)
        .then(function(r) { return r.arrayBuffer(); })
        .then(function(buf) {
          _koreanFontBytes = new Uint8Array(buf);
          return _koreanFontBytes;
        })
        .catch(function() { return null; });
    }

    function toBase64(str) {
      try { return btoa(str); }
      catch(e) { return btoa(unescape(encodeURIComponent(str))); }
    }

    function evalModule(iframeWin, code) {
      var b64 = toBase64(code);
      return iframeWin.eval("import('data:text/javascript;base64," + b64 + "')");
    }

    function prepareCompiledCode(jsCode) {
      return 'class BufferedOutput {\n' +
        '  constructor() { this.buffer = "" }\n' +
        '}\n' +
        'export const bufferedOutput = new BufferedOutput()\n' +
        jsCode
          .replace(
            "instantiateStreaming(fetch(wasmFilePath), importObject)).instance;",
            "instantiate(window.wasmCode, importObject)).instance;\nwindow.wasmCode = undefined;"
          )
          .replace(
            /instantiateStreaming\(fetch\(new URL\('\.\/playground\.wasm',import\.meta\.url\)\.href\),\s?importObject(?:,\s?\{ builtins:\s?\[''\]\s?\})?\)\)\.instance;/,
            "instantiate(window.wasmCode, importObject)).instance;\nwindow.wasmCode = undefined;"
          )
          .replace(
            "const importObject = {",
            "js_code['kotlin.io.printImpl'] = (message) => bufferedOutput.buffer += message\n" +
            "js_code['kotlin.io.printlnImpl'] = (message) => {bufferedOutput.buffer += message;bufferedOutput.buffer += \"\\n\"}\n" +
            "const importObject = {"
          );
    }

    // Patch skiko exports: stub any missing Skia functions that stdlib expects.
    // The skiko ES module doesn't export all symbols the stdlib WASM needs,
    // so we use a Proxy to auto-generate no-op stubs for missing imports.
    function fixedSkikoExports(skikoExports) {
      return new Proxy(skikoExports, {
        get: function(target, prop) {
          if (prop in target) return target[prop];
          return function() {};
        },
        has: function(target, prop) {
          return true;
        }
      });
    }

    function parseErrors(errors) {
      if (!errors || typeof errors !== 'object') return { errors: [], warnings: [] };
      var list = [];
      if (Array.isArray(errors)) {
        list = errors;
      } else {
        Object.keys(errors).forEach(function(k) {
          if (Array.isArray(errors[k])) list = list.concat(errors[k]);
        });
      }
      var errs = [], warns = [];
      list.forEach(function(e) {
        if (!e || !e.message) return;
        var loc = (e.interval && e.interval.start) ? ' (line ' + e.interval.start.line + ')' : '';
        var msg = e.message + loc;
        if (e.severity === 'ERROR') errs.push(msg);
        else if (e.severity === 'WARNING') warns.push(msg);
      });
      return { errors: errs, warnings: warns };
    }

    // Patch all WebAssembly instantiation methods inside the iframe so that
    // any missing import function is auto-replaced with a no-op stub.
    // The stdlib uses instantiateStreaming (browser path), instantiate (deno),
    // and new Instance (node) — we must patch ALL of them.
    function patchWasmInstantiate(iframeWin) {
      iframeWin.eval(
        '(function() {\n' +
        '  function wrapImports(importObject) {\n' +
        '    if (!importObject) return importObject;\n' +
        '    Object.keys(importObject).forEach(function(modName) {\n' +
        '      var mod = importObject[modName];\n' +
        '      if (mod && typeof mod === "object") {\n' +
        '        importObject[modName] = new Proxy(mod, {\n' +
        '          get: function(t, p) {\n' +
        '            if (p in t && typeof t[p] !== "undefined") return t[p];\n' +
        '            return function() {};\n' +
        '          },\n' +
        '          has: function(t, p) { return true; }\n' +
        '        });\n' +
        '      }\n' +
        '    });\n' +
        '    return importObject;\n' +
        '  }\n' +
        '  var _origInstantiate = WebAssembly.instantiate.bind(WebAssembly);\n' +
        '  var _origStreaming = WebAssembly.instantiateStreaming.bind(WebAssembly);\n' +
        '  var _OrigInstance = WebAssembly.Instance;\n' +
        '  WebAssembly.instantiate = function(source, imports) {\n' +
        '    return _origInstantiate(source, wrapImports(imports));\n' +
        '  };\n' +
        '  WebAssembly.instantiateStreaming = function(source, imports) {\n' +
        '    return _origStreaming(source, wrapImports(imports));\n' +
        '  };\n' +
        '  WebAssembly.Instance = function(module, imports) {\n' +
        '    return new _OrigInstance(module, wrapImports(imports));\n' +
        '  };\n' +
        '})()'
      );
    }

    function execute(previewEl, compileResult, versions, onStatus) {
      var iframe = document.createElement('iframe');
      iframe.className = 'compose-preview-iframe';
      previewEl.innerHTML = '';
      previewEl.appendChild(iframe);

      var iframeWin = iframe.contentWindow;
      var iframeDoc = iframe.contentDocument || iframeWin.document;
      iframeDoc.open();
      iframeDoc.write(
        '<!DOCTYPE html><html><head>' +
        '<style>*{margin:0;padding:0;}html,body{width:100%;height:100%;overflow:hidden;background:#fff;}</style>' +
        '</head><body></body></html>'
      );
      iframeDoc.close();

      // Patch WebAssembly.instantiate BEFORE any modules are loaded
      patchWasmInstantiate(iframeWin);

      if (onStatus) onStatus('\u23F3 Skiko \uADF8\uB798\uD53D \uC5D4\uC9C4 \uB85C\uB529...');

      return fetchSkikoMjs(versions)
        .then(function(skikoCode) {
          return evalModule(iframeWin, skikoCode);
        })
        .then(function(skikoExports) {
          if (onStatus) onStatus('\u23F3 Kotlin \uB7F0\uD0C0\uC784 \uB85C\uB529...');
          return fetchStdlibMjs(versions)
            .then(function(stdlibCode) {
              return evalModule(iframeWin, stdlibCode);
            })
            .then(function(stdlibModule) {
              return stdlibModule.instantiate({ "./skiko.mjs": fixedSkikoExports(skikoExports) });
            });
        })
        .then(function(stdlibResult) {
          if (onStatus) onStatus('\u23F3 \uC571 \uC2E4\uD589 \uC911...');
          // Preload Korean font into iframe window for Kotlin code to access
          return fetchKoreanFont().then(function(fontBytes) {
            iframeWin.__koreanFontBytes = fontBytes;
            iframeWin.wasmCode = Uint8Array.from(
              atob(compileResult.wasm),
              function(c) { return c.charCodeAt(0); }
            );
            var prepared = prepareCompiledCode(compileResult.jsCode);
            return evalModule(iframeWin, prepared).then(function(compiledModule) {
              return compiledModule.instantiate({
                'playground.master': stdlibResult.exports
              }).then(function(appResult) {
                if (appResult && appResult.exports && appResult.exports.main) {
                  appResult.exports.main();
                }
                return compiledModule.bufferedOutput ? compiledModule.bufferedOutput.buffer : '';
              });
            });
          });
        });
    }

    return {
      compile: compile,
      execute: execute,
      getVersions: getVersions,
      parseErrors: parseErrors
    };
  })();

  // =========================================================================
  // JavaScript Playground
  // =========================================================================
  function renderPlayground(code, id) {
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

  // =========================================================================
  // Kotlin Playground (custom implementation using Kotlin Compiler API)
  // =========================================================================
  function renderKotlinPlayground(code, id) {
    var clean = cleanKotlinCode(code);
    return '<div class="playground-container playground-kotlin" id="' + id + '">' +
      '<div class="playground-header">' +
        '<span class="playground-badge playground-badge-kotlin">\u25B6 Kotlin Playground</span>' +
        '<div class="playground-actions">' +
          '<button class="playground-btn playground-run-btn" onclick="window.__kotlinRun(\'' + id + '\')">\u25B6 \uC2E4\uD589</button>' +
          '<button class="playground-btn playground-reset-btn" onclick="window.__kotlinReset(\'' + id + '\')">\u21BA \uCD08\uAE30\uD654</button>' +
        '</div>' +
      '</div>' +
      '<div class="playground-editor playground-highlight-editor">' +
        '<pre class="playground-highlight-pre" aria-hidden="true"><code class="language-kotlin">' + escapeHtml(clean) + '</code></pre>' +
        '<textarea class="playground-textarea playground-kotlin-textarea" spellcheck="false">' + escapeHtml(clean) + '</textarea>' +
      '</div>' +
      '<div class="playground-output" style="display:none;">' +
        '<div class="playground-output-header">\uCD9C\uB825 \uACB0\uACFC</div>' +
        '<pre class="playground-output-content"></pre>' +
      '</div>' +
      '<div class="playground-footer">' +
        '<a class="playground-link" href="https://play.kotlinlang.org/" target="_blank" rel="noopener">Open in Playground \u2192</a>' +
        '<span class="playground-info">Target: JVM \u00B7 Kotlin</span>' +
      '</div>' +
      '</div>';
  }

  // =========================================================================
  // Compose Preview Playground
  // =========================================================================
  function renderComposePlayground(code, id) {
    var clean = cleanKotlinCode(code);
    return '<div class="playground-container playground-compose" id="' + id + '">' +
      '<div class="playground-header">' +
        '<span class="playground-badge playground-badge-compose">\uD83C\uDFA8 Compose Preview</span>' +
        '<div class="playground-actions">' +
          '<button class="playground-btn playground-run-btn" onclick="window.__composeRun(\'' + id + '\')">\u25B6 \uC2E4\uD589</button>' +
          '<button class="playground-btn playground-reset-btn" onclick="window.__composeReset(\'' + id + '\')">\u21BA \uCD08\uAE30\uD654</button>' +
          '<button class="playground-btn playground-copy-btn" onclick="window.__playgroundCopyCode(\'' + id + '\')">\uD83D\uDCCB \uBCF5\uC0AC</button>' +
        '</div>' +
      '</div>' +
      '<div class="playground-editor playground-highlight-editor">' +
        '<pre class="playground-highlight-pre" aria-hidden="true"><code class="language-kotlin">' + escapeHtml(clean) + '</code></pre>' +
        '<textarea class="playground-textarea playground-compose-textarea" spellcheck="false">' + escapeHtml(clean) + '</textarea>' +
      '</div>' +
      '<div class="compose-preview-container" style="display:none;"></div>' +
      '<div class="playground-output" style="display:none;">' +
        '<div class="playground-output-header">\uCD9C\uB825 \uACB0\uACFC</div>' +
        '<pre class="playground-output-content"></pre>' +
      '</div>' +
      '<div class="playground-footer">' +
        '<a class="playground-link" href="https://play.kotlinlang.org/" target="_blank" rel="noopener">Open in Playground \u2192</a>' +
        '<span class="playground-info">Target: Compose Multiplatform (WASM)</span>' +
      '</div>' +
      '</div>';
  }

  // =========================================================================
  // Expo Snack embed
  // =========================================================================
  function detectDependencies(code) {
    var deps = {};
    var importRegex = /from\s+['"]([^'"./][^'"]*)['"]/g;
    var match;
    while ((match = importRegex.exec(code)) !== null) {
      var pkg = match[1];
      if (pkg.startsWith('@')) {
        pkg = pkg.split('/').slice(0, 2).join('/');
      } else {
        pkg = pkg.split('/')[0];
      }
      if (pkg !== 'react' && pkg !== 'react-native') {
        deps[pkg] = '*';
      }
    }
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
    return Object.keys(deps).map(function(k) { return k + '@' + deps[k]; }).join(',');
  }

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

  // =========================================================================
  // Global action handlers
  // =========================================================================

  // Run JavaScript code
  window.__playgroundRun = function(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var textarea = container.querySelector('.playground-textarea');
    var outputEl = container.querySelector('.playground-output-content');
    var code = textarea.value;
    outputEl.textContent = '';
    var outputs = [];
    var sandboxConsole = {
      log: function() { outputs.push(Array.prototype.slice.call(arguments).map(function(a) { if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); } } return String(a); }).join(' ')); },
      error: function() { outputs.push('\u274C Error: ' + Array.prototype.slice.call(arguments).join(' ')); },
      warn: function() { outputs.push('\u26A0\uFE0F Warning: ' + Array.prototype.slice.call(arguments).join(' ')); },
      info: function() { outputs.push('\u2139\uFE0F ' + Array.prototype.slice.call(arguments).join(' ')); },
      table: function(data) { try { outputs.push(JSON.stringify(data, null, 2)); } catch(e) { outputs.push(String(data)); } },
      clear: function() { outputs = []; }
    };
    try {
      var fn = new Function('console', code);
      var result = fn(sandboxConsole);
      if (result !== undefined && outputs.length === 0) {
        outputs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
      }
      outputEl.textContent = outputs.length > 0 ? outputs.join('\n') : '(\uCD9C\uB825 \uC5C6\uC74C)';
      outputEl.style.opacity = outputs.length > 0 ? '1' : '0.5';
      outputEl.style.color = '';
    } catch (e) {
      outputEl.textContent = '\u274C ' + e.name + ': ' + e.message;
      outputEl.style.color = '#e94560';
    }
    container.querySelector('.playground-output').style.display = 'block';
  };

  // Reset JS playground
  window.__playgroundReset = function(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var textarea = container.querySelector('.playground-textarea');
    var original = container.getAttribute('data-original');
    if (original) textarea.value = original;
    var outputEl = container.querySelector('.playground-output-content');
    outputEl.textContent = '';
    outputEl.style.color = '';
    outputEl.style.opacity = '';
    container.querySelector('.playground-output').style.display = 'none';
  };

  // Sync highlight overlay with textarea content
  function syncHighlight(editor) {
    var textarea = editor.querySelector('.playground-kotlin-textarea, .playground-compose-textarea');
    var codeEl = editor.querySelector('.playground-highlight-pre code');
    if (!textarea || !codeEl) return;
    codeEl.textContent = textarea.value;
    codeEl.className = 'language-kotlin';
    if (window.Prism) {
      window.Prism.highlightElement(codeEl);
    }
  }

  // Run Kotlin code via Kotlin Compiler API
  window.__kotlinRun = function(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var textarea = container.querySelector('.playground-textarea');
    var outputEl = container.querySelector('.playground-output-content');
    var runBtn = container.querySelector('.playground-run-btn');
    var code = textarea.value;

    // Show loading state
    outputEl.textContent = '\u23F3 \uCEF4\uD30C\uC77C \uC911...';
    outputEl.style.color = '';
    outputEl.style.opacity = '0.7';
    container.querySelector('.playground-output').style.display = 'block';
    runBtn.disabled = true;
    runBtn.textContent = '\u23F3 \uC2E4\uD589 \uC911...';

    fetch('https://api.kotlinlang.org/api/2.3.10/compiler/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        args: '',
        confType: 'java',
        files: [{ name: 'File.kt', text: code, publicId: '' }]
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var output = '';
      var hasErrors = false;

      // Collect actual errors (severity=ERROR), skipping warnings
      var errMessages = [];
      var warnMessages = [];
      try {
        if (data.errors && typeof data.errors === 'object') {
          var errorsList = Array.isArray(data.errors) ? data.errors : [];
          if (!Array.isArray(data.errors)) {
            // Object map format: {"File.kt": [{...}, ...]}
            Object.keys(data.errors).forEach(function(file) {
              var arr = data.errors[file];
              if (Array.isArray(arr)) errorsList = errorsList.concat(arr);
            });
          }
          errorsList.forEach(function(err) {
            if (!err || !err.message) return;
            var line = (err.interval && err.interval.start) ? ' (line ' + err.interval.start.line + ')' : '';
            var msg = (err.severity || 'ERROR') + ': ' + err.message + line;
            if (err.severity === 'ERROR') {
              errMessages.push(msg);
            } else {
              warnMessages.push(msg);
            }
          });
        }
      } catch (e) {
        errMessages.push('Error parsing compiler response');
      }

      if (errMessages.length > 0) {
        output = '\u274C \uCEF4\uD30C\uC77C \uC624\uB958:\n' + errMessages.join('\n');
        hasErrors = true;
        outputEl.style.color = '#e94560';
      }

      if (!hasErrors && data.exception) {
        output = '\u274C \uB7F0\uD0C0\uC784 \uC624\uB958:\n' + (data.exception.fullName || 'Exception') + ': ' + (data.exception.message || '');
        outputEl.style.color = '#e94560';
        hasErrors = true;
      }

      if (!hasErrors) {
        // Strip <outStream> and <errStream> tags from output
        var text = (data.text || '')
          .replace(/<outStream>/g, '')
          .replace(/<\/outStream>/g, '')
          .replace(/<errStream>/g, '')
          .replace(/<\/errStream>/g, '');
        output = text || '(\uCD9C\uB825 \uC5C6\uC74C)';
        // Append warnings if any
        if (warnMessages.length > 0) {
          output += '\n\n\u26A0\uFE0F \uACBD\uACE0:\n' + warnMessages.join('\n');
        }
        outputEl.style.color = '';
      }

      outputEl.textContent = output;
      outputEl.style.opacity = '1';
    })
    .catch(function(err) {
      outputEl.textContent = '\u274C \uB124\uD2B8\uC6CC\uD06C \uC624\uB958: ' + err.message;
      outputEl.style.color = '#e94560';
      outputEl.style.opacity = '1';
    })
    .finally(function() {
      runBtn.disabled = false;
      runBtn.textContent = '\u25B6 \uC2E4\uD589';
    });
  };

  // Reset Kotlin playground
  window.__kotlinReset = function(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var textarea = container.querySelector('.playground-textarea');
    var original = container.getAttribute('data-original');
    if (original) textarea.value = original;
    // Recalculate height
    var lineCount = textarea.value.split('\n').length;
    textarea.style.height = Math.max(lineCount * 20.8 + 36, 100) + 'px';
    // Sync highlight overlay
    var editor = container.querySelector('.playground-highlight-editor');
    if (editor) syncHighlight(editor);
    var outputEl = container.querySelector('.playground-output-content');
    outputEl.textContent = '';
    outputEl.style.color = '';
    outputEl.style.opacity = '';
    container.querySelector('.playground-output').style.display = 'none';
  };

  // Run Compose code via Kotlin Playground Compose WASM API
  window.__composeRun = function(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var textarea = container.querySelector('.playground-textarea');
    var outputEl = container.querySelector('.playground-output-content');
    var outputSection = container.querySelector('.playground-output');
    var previewContainer = container.querySelector('.compose-preview-container');
    var runBtn = container.querySelector('.playground-run-btn');
    var code = textarea.value;

    // UI: loading state
    runBtn.disabled = true;
    runBtn.textContent = '\u23F3 \uCEF4\uD30C\uC77C \uC911...';
    outputEl.textContent = '\u23F3 Compose Multiplatform (WASM) \uCEF4\uD30C\uC77C \uC911...';
    outputEl.style.color = '';
    outputEl.style.opacity = '0.7';
    outputSection.style.display = 'block';
    previewContainer.style.display = 'none';
    previewContainer.innerHTML = '';

    // Wrap code with imports and main() if user only provided composable body
    var wrappedCode = code;
    if (code.indexOf('fun main()') === -1) {
      var imports = [
        'import androidx.compose.runtime.*',
        // UI
        'import androidx.compose.ui.*',
        'import androidx.compose.ui.graphics.*',
        'import androidx.compose.ui.graphics.drawscope.*',
        'import androidx.compose.ui.text.*',
        'import androidx.compose.ui.text.font.*',
        'import androidx.compose.ui.text.style.*',
        'import androidx.compose.ui.unit.*',
        'import androidx.compose.ui.draw.*',
        'import androidx.compose.ui.layout.*',
        'import androidx.compose.ui.platform.*',
        'import androidx.compose.ui.window.*',
        // Foundation
        'import androidx.compose.foundation.*',
        'import androidx.compose.foundation.layout.*',
        'import androidx.compose.foundation.shape.*',
        'import androidx.compose.foundation.lazy.*',
        'import androidx.compose.foundation.lazy.grid.*',
        'import androidx.compose.foundation.text.*',
        'import androidx.compose.foundation.gestures.*',
        'import androidx.compose.foundation.interaction.*',
        'import androidx.compose.foundation.pager.*',
        // Material 3
        'import androidx.compose.material.*',
        'import androidx.compose.material.icons.*',
        'import androidx.compose.material.icons.filled.*',
        'import androidx.compose.material.icons.outlined.*',
        // Animation
        'import androidx.compose.animation.*',
        'import androidx.compose.animation.core.*',
        // Font interop
        'import androidx.compose.ui.text.platform.Font',
        // WASM entry
        'import androidx.compose.ui.window.ComposeViewport',
        'import kotlinx.browser.document',
        'import org.jetbrains.compose.resources.*'
      ].join('\n');

      // Korean font loading helpers (font bytes are pre-loaded by JS into window.__koreanFontBytes)
      var fontHelpers =
        '@JsFun("() => window.__koreanFontBytes || null")\n' +
        'external fun __getKoreanFontBytes(): JsAny?\n' +
        '@JsFun("(a) => a.length")\n' +
        'external fun __jsFontLen(a: JsAny): Int\n' +
        '@JsFun("(a,i) => a[i]")\n' +
        'external fun __jsFontGet(a: JsAny, i: Int): Byte\n' +
        'fun __loadKoreanFont(): FontFamily? {\n' +
        '    val js = __getKoreanFontBytes() ?: return null\n' +
        '    val len = __jsFontLen(js)\n' +
        '    val bytes = ByteArray(len) { __jsFontGet(js, it) }\n' +
        '    return FontFamily(Font("NotoSansKR", bytes, FontWeight.Normal, FontStyle.Normal))\n' +
        '}\n';

      // Detect if code defines @Composable functions (vs inline composable calls)
      var composableFuncMatch = code.match(/@Composable\s+fun\s+(\w+)/);

      if (composableFuncMatch) {
        // Code defines composable function(s) - keep at top level, call the first one
        var firstFunc = composableFuncMatch[1];
        wrappedCode = imports + '\n\n' +
          fontHelpers + '\n' +
          code + '\n\n' +
          '@OptIn(ExperimentalComposeUiApi::class)\n' +
          'fun main() {\n' +
          '    val __kf = __loadKoreanFont()\n' +
          '    ComposeViewport(document.body!!) {\n' +
          '        MaterialTheme(typography = if (__kf != null) Typography(defaultFontFamily = __kf) else Typography()) {\n' +
          '            ' + firstFunc + '()\n' +
          '        }\n' +
          '    }\n' +
          '}';
      } else {
        // Inline composable content - wrap in App()
        wrappedCode = imports + '\n\n' +
          fontHelpers + '\n' +
          '@OptIn(ExperimentalComposeUiApi::class)\n' +
          'fun main() {\n' +
          '    val __kf = __loadKoreanFont()\n' +
          '    ComposeViewport(document.body!!) {\n' +
          '        MaterialTheme(typography = if (__kf != null) Typography(defaultFontFamily = __kf) else Typography()) {\n' +
          '            App()\n' +
          '        }\n' +
          '    }\n' +
          '}\n\n' +
          '@Composable\n' +
          'fun App() {\n' +
          code + '\n' +
          '}';
      }
    }

    // Compile and fetch resource versions in parallel
    var compilePromise = ComposeWasm.compile(wrappedCode);
    var versionsPromise = ComposeWasm.getVersions();

    Promise.all([compilePromise, versionsPromise])
      .then(function(results) {
        var compileResult = results[0];
        var versions = results[1];

        // Check for compile errors
        var parsed = ComposeWasm.parseErrors(compileResult.errors);
        if (parsed.errors.length > 0) {
          outputEl.textContent = '\u274C \uCEF4\uD30C\uC77C \uC624\uB958:\n' + parsed.errors.join('\n');
          outputEl.style.color = '#e94560';
          outputEl.style.opacity = '1';
          return;
        }

        if (!compileResult.jsCode || !compileResult.wasm) {
          outputEl.textContent = '\u274C \uCEF4\uD30C\uC77C \uACB0\uACFC\uAC00 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4.';
          outputEl.style.color = '#e94560';
          outputEl.style.opacity = '1';
          return;
        }

        // Show preview area and start runtime loading
        previewContainer.style.display = 'block';
        previewContainer.innerHTML =
          '<div class="compose-preview-loading">' +
            '<div class="compose-preview-spinner"></div>' +
            '<span>\uB7F0\uD0C0\uC784 \uB85C\uB529 \uC911...</span>' +
          '</div>';
        outputEl.textContent = '\u23F3 \uB7F0\uD0C0\uC784 \uB85C\uB529 \uC911...';

        return ComposeWasm.execute(
          previewContainer,
          compileResult,
          versions,
          function(status) { outputEl.textContent = status; }
        ).then(function(consoleOutput) {
          if (consoleOutput) {
            outputEl.textContent = consoleOutput;
            outputEl.style.color = '';
            outputEl.style.opacity = '1';
          } else if (parsed.warnings.length > 0) {
            outputEl.textContent = '\u26A0\uFE0F \uACBD\uACE0:\n' + parsed.warnings.join('\n');
            outputEl.style.color = '#d4a017';
            outputEl.style.opacity = '1';
          } else {
            outputSection.style.display = 'none';
          }
        });
      })
      .catch(function(err) {
        outputEl.textContent = '\u274C \uC624\uB958: ' + err.message;
        outputEl.style.color = '#e94560';
        outputEl.style.opacity = '1';
      })
      .finally(function() {
        runBtn.disabled = false;
        runBtn.textContent = '\u25B6 \uC2E4\uD589';
      });
  };

  // Reset Compose playground
  window.__composeReset = function(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var textarea = container.querySelector('.playground-textarea');
    var original = container.getAttribute('data-original');
    if (original) textarea.value = original;
    // Recalculate height
    var lineCount = textarea.value.split('\n').length;
    textarea.style.height = Math.max(lineCount * 20.8 + 36, 100) + 'px';
    // Sync highlight overlay
    var editor = container.querySelector('.playground-highlight-editor');
    if (editor) syncHighlight(editor);
    var outputEl = container.querySelector('.playground-output-content');
    outputEl.textContent = '';
    outputEl.style.color = '';
    outputEl.style.opacity = '';
    container.querySelector('.playground-output').style.display = 'none';
    // Clear preview
    var previewContainer = container.querySelector('.compose-preview-container');
    if (previewContainer) {
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = '';
    }
  };

  // Copy code (Compose playground)
  window.__playgroundCopyCode = function(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var codeEl = container.querySelector('code.language-kotlin');
    if (!codeEl) return;
    navigator.clipboard.writeText(codeEl.textContent).then(function() {
      var btn = container.querySelector('.playground-copy-btn');
      if (btn) {
        var orig = btn.innerHTML;
        btn.innerHTML = '\u2705 \uBCF5\uC0AC\uB428!';
        setTimeout(function() { btn.innerHTML = orig; }, 2000);
      }
    });
  };

  // Load Expo Snack
  window.__playgroundLoadSnack = function(id) {
    var container = document.getElementById(id);
    if (!container) return;
    var placeholder = container.querySelector('.snack-placeholder');
    var iframeContainer = container.querySelector('.snack-iframe-container');
    var iframe = container.querySelector('.snack-iframe');
    if (placeholder) placeholder.style.display = 'none';
    if (iframeContainer) iframeContainer.style.display = 'block';
    if (iframe.getAttribute('data-loaded')) return;
    iframe.setAttribute('data-loaded', 'true');
    var code = decodeURIComponent(iframe.getAttribute('data-code'));
    var deps = detectDependencies(code);
    var files = JSON.stringify({ 'App.js': { type: 'CODE', contents: code } });
    var safeFiles = JSON.stringify(files).replace(/<\//g, '<\\/');
    var html = '<!DOCTYPE html><html><head><style>*{margin:0;padding:0;}html,body{height:100%;overflow:hidden;}</style></head><body>' +
      '<div id="snack" data-snack-name="RN Learning Example" data-snack-sdkversion="52.0.0" data-snack-platform="web" data-snack-theme="dark" data-snack-preview="true"' +
      (deps ? ' data-snack-dependencies="' + deps.replace(/"/g, '&quot;') + '"' : '') +
      ' style="overflow:hidden;height:100%;width:100%;"></div>' +
      '<script>document.getElementById("snack").setAttribute("data-snack-files",' + safeFiles + ');<\/script>' +
      '<script src="https://snack.expo.dev/embed.js"><\/script></body></html>';
    iframe.srcdoc = html;
  };

  // =========================================================================
  // Docsify Plugin Registration
  // =========================================================================
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.afterEach(function(html, next) {
      playgroundCounter = 0;

      // [kotlin-playground]
      html = html.replace(/<pre[^>]*><code[^>]*class="lang-([^"]*?\[kotlin-playground\][^"]*?)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(match, lang, content) {
        var decoded = decodeHtmlEntities(stripHtmlTags(content));
        return renderKotlinPlayground(decoded, 'kotlin-pg-' + playgroundCounter++);
      });

      // [compose-playground]
      html = html.replace(/<pre[^>]*><code[^>]*class="lang-([^"]*?\[compose-playground\][^"]*?)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(match, lang, content) {
        var decoded = decodeHtmlEntities(stripHtmlTags(content));
        return renderComposePlayground(decoded, 'compose-pg-' + playgroundCounter++);
      });

      // [playground]
      html = html.replace(/<pre[^>]*><code[^>]*class="lang-([^"]*?\[playground\][^"]*?)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(match, lang, content) {
        var decoded = decodeHtmlEntities(stripHtmlTags(content));
        return renderPlayground(decoded, 'playground-' + playgroundCounter++);
      });

      // [snack]
      html = html.replace(/<pre[^>]*><code[^>]*class="lang-([^"]*?\[snack\][^"]*?)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(match, lang, content) {
        var decoded = decodeHtmlEntities(stripHtmlTags(content));
        return renderSnack(decoded, 'snack-' + playgroundCounter++);
      });

      next(html);
    });

    hook.doneEach(function() {
      // Prism.js highlighting for Compose, Snack, and Kotlin playground code
      if (window.Prism) {
        document.querySelectorAll('.compose-code-area code, .snack-source code, .playground-highlight-pre code').forEach(function(el) {
          if (!el.classList.contains('prism-highlighted')) {
            window.Prism.highlightElement(el);
            el.classList.add('prism-highlighted');
          }
        });
      }

      // Store originals & auto-size textareas for all playgrounds
      document.querySelectorAll('.playground-container').forEach(function(container) {
        if (container.classList.contains('playground-snack')) return;
        var textarea = container.querySelector('.playground-textarea');
        if (textarea && !container.getAttribute('data-original')) {
          container.setAttribute('data-original', textarea.value);
          var updateHeight = function() {
            var lineCount = textarea.value.split('\n').length;
            // padding 24px + maybe 12px for horizontal scrollbar buffer
            textarea.style.height = Math.max(lineCount * 20.8 + 36, 100) + 'px';
          };
          updateHeight();
          textarea.addEventListener('input', updateHeight);
        }
      });

      // Highlight overlay: input sync & scroll sync for Kotlin playgrounds
      document.querySelectorAll('.playground-highlight-editor').forEach(function(editor) {
        var textarea = editor.querySelector('.playground-textarea');
        if (!textarea || textarea.getAttribute('data-highlight-bound')) return;
        textarea.setAttribute('data-highlight-bound', 'true');

        textarea.addEventListener('input', function() {
          var codeEl = editor.querySelector('.playground-highlight-pre code');
          if (codeEl) {
            codeEl.textContent = textarea.value;
            codeEl.className = 'language-kotlin';
            if (window.Prism) window.Prism.highlightElement(codeEl);
          }
        });

        textarea.addEventListener('scroll', function() {
          var pre = editor.querySelector('.playground-highlight-pre');
          if (pre) {
            pre.scrollTop = textarea.scrollTop;
            pre.scrollLeft = textarea.scrollLeft;
          }
        });
      });

      // Tab key & Ctrl+Enter handling
      document.querySelectorAll('.playground-textarea').forEach(function(textarea) {
        if (textarea.getAttribute('data-tab-handler')) return;
        textarea.setAttribute('data-tab-handler', 'true');
        textarea.addEventListener('keydown', function(e) {
          if (e.key === 'Tab') {
            e.preventDefault();
            var start = textarea.selectionStart;
            var end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 4;
            // Sync highlight after tab insert
            var editor = textarea.closest('.playground-highlight-editor');
            if (editor) {
              var codeEl = editor.querySelector('.playground-highlight-pre code');
              if (codeEl) {
                codeEl.textContent = textarea.value;
                codeEl.className = 'language-kotlin';
                if (window.Prism) window.Prism.highlightElement(codeEl);
              }
            }
          }
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            var ct = textarea.closest('.playground-container');
            if (ct.classList.contains('playground-kotlin')) {
              window.__kotlinRun(ct.id);
            } else if (ct.classList.contains('playground-compose')) {
              window.__composeRun(ct.id);
            } else {
              window.__playgroundRun(ct.id);
            }
          }
        });
      });
    });
  });
})();

(function() {
  // Parse compare block content
  function parseCompare(text) {
    var result = {
      leftLang: 'javascript',
      leftTitle: 'Left',
      rightLang: 'javascript',
      rightTitle: 'Right',
      note: '',
      leftCode: '',
      rightCode: ''
    };

    var lines = text.split('\n');
    var section = 'header'; // header, left, right
    var leftLines = [];
    var rightLines = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();

      if (trimmed === '---left---') {
        section = 'left';
        continue;
      }
      if (trimmed === '---right---') {
        section = 'right';
        continue;
      }

      if (section === 'header') {
        var colonIdx = trimmed.indexOf(':');
        if (colonIdx > 0) {
          var key = trimmed.substring(0, colonIdx).trim().toLowerCase().replace(/_/g, '');
          var value = trimmed.substring(colonIdx + 1).trim();
          if (key === 'leftlang' || key === 'left_lang') result.leftLang = value;
          else if (key === 'lefttitle' || key === 'left_title') result.leftTitle = value;
          else if (key === 'rightlang' || key === 'right_lang') result.rightLang = value;
          else if (key === 'righttitle' || key === 'right_title') result.rightTitle = value;
          else if (key === 'note') result.note = value;
        }
      } else if (section === 'left') {
        leftLines.push(line);
      } else if (section === 'right') {
        rightLines.push(line);
      }
    }

    result.leftCode = leftLines.join('\n').trim();
    result.rightCode = rightLines.join('\n').trim();
    return result;
  }

  // Escape HTML for display in code blocks
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Render compare panel
  function renderCompare(data, id) {
    var noteHtml = data.note
      ? '<div class="compare-note"><strong>\uD83D\uDCDD Note:</strong> ' + data.note + '</div>'
      : '';

    var leftCodeHtml = escapeHtml(data.leftCode);
    var rightCodeHtml = escapeHtml(data.rightCode);

    return '<div class="compare-container" id="' + id + '">' +
      '<div class="compare-tabs">' +
        '<button class="compare-tab active" data-side="left" onclick="window.__compareTab(\'' + id + '\',\'left\')">' + data.leftTitle + '</button>' +
        '<button class="compare-tab" data-side="right" onclick="window.__compareTab(\'' + id + '\',\'right\')">' + data.rightTitle + '</button>' +
        '<button class="compare-tab compare-tab-both active" data-side="both" onclick="window.__compareTab(\'' + id + '\',\'both\')">\uB098\uB780\uD788 \uBCF4\uAE30</button>' +
      '</div>' +
      '<div class="compare-panels">' +
        '<div class="compare-panel compare-panel-left" data-side="left">' +
          '<div class="compare-panel-header">' + data.leftTitle + '</div>' +
          '<pre class="compare-code" data-side="left"><code class="language-' + data.leftLang + '">' + leftCodeHtml + '</code></pre>' +
        '</div>' +
        '<div class="compare-panel compare-panel-right" data-side="right">' +
          '<div class="compare-panel-header">' + data.rightTitle + '</div>' +
          '<pre class="compare-code" data-side="right"><code class="language-' + data.rightLang + '">' + rightCodeHtml + '</code></pre>' +
        '</div>' +
      '</div>' +
      noteHtml +
      '</div>';
  }

  // Tab switching (for mobile)
  window.__compareTab = function(id, side) {
    var container = document.getElementById(id);
    if (!container) return;

    var tabs = container.querySelectorAll('.compare-tab');
    var panels = container.querySelectorAll('.compare-panel');

    if (side === 'both') {
      // Show both panels side by side
      tabs.forEach(function(t) {
        t.classList.remove('active');
        if (t.getAttribute('data-side') === 'both') t.classList.add('active');
      });
      panels.forEach(function(p) {
        p.style.display = '';
        p.classList.remove('full-width');
      });
      container.querySelector('.compare-panels').classList.remove('single-view');
    } else {
      tabs.forEach(function(t) {
        t.classList.remove('active');
        if (t.getAttribute('data-side') === side) t.classList.add('active');
      });
      panels.forEach(function(p) {
        var panelSide = p.getAttribute('data-side');
        if (panelSide === side) {
          p.style.display = '';
          p.classList.add('full-width');
        } else {
          p.style.display = 'none';
          p.classList.remove('full-width');
        }
      });
      container.querySelector('.compare-panels').classList.add('single-view');
    }
  };

  // Line highlighting on hover
  function setupLineHighlighting() {
    document.querySelectorAll('.compare-container').forEach(function(container) {
      var leftPre = container.querySelector('.compare-panel-left pre');
      var rightPre = container.querySelector('.compare-panel-right pre');
      if (!leftPre || !rightPre) return;

      // Wrap lines in span elements for highlighting
      [leftPre, rightPre].forEach(function(pre) {
        var codeEl = pre.querySelector('code');
        if (!codeEl || codeEl.getAttribute('data-lines-wrapped')) return;
        codeEl.setAttribute('data-lines-wrapped', 'true');

        var html = codeEl.innerHTML;
        var lines = html.split('\n');
        codeEl.innerHTML = lines.map(function(line, i) {
          return '<span class="compare-line" data-line="' + i + '">' + line + '</span>';
        }).join('\n');
      });

      // Add hover event listeners
      container.addEventListener('mouseover', function(e) {
        var lineEl = e.target.closest('.compare-line');
        if (!lineEl) return;
        var lineNum = lineEl.getAttribute('data-line');
        container.querySelectorAll('.compare-line[data-line="' + lineNum + '"]').forEach(function(el) {
          el.classList.add('highlight');
        });
      });

      container.addEventListener('mouseout', function(e) {
        var lineEl = e.target.closest('.compare-line');
        if (!lineEl) return;
        var lineNum = lineEl.getAttribute('data-line');
        container.querySelectorAll('.compare-line[data-line="' + lineNum + '"]').forEach(function(el) {
          el.classList.remove('highlight');
        });
      });
    });
  }

  // Check container width for responsive behavior
  function handleResponsive() {
    document.querySelectorAll('.compare-container').forEach(function(container) {
      var width = container.offsetWidth;
      if (width < 600) {
        container.classList.add('compare-mobile');
        // In mobile mode, show tabs and default to left panel
        var bothTab = container.querySelector('.compare-tab-both');
        if (bothTab) bothTab.style.display = 'none';
        // Auto-switch to single view if in mobile
        if (!container.classList.contains('mobile-initialized')) {
          container.classList.add('mobile-initialized');
          window.__compareTab(container.id, 'left');
        }
      } else {
        container.classList.remove('compare-mobile');
        var bothTab = container.querySelector('.compare-tab-both');
        if (bothTab) bothTab.style.display = '';
      }
    });
  }

  var compareCounter = 0;

  // Register Docsify plugin
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.afterEach(function(html, next) {
      compareCounter = 0;

      // Find compare code blocks rendered by Docsify
      html = html.replace(/<pre[^>]*><code[^>]*class="lang-compare"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, function(match, content) {
        // Decode HTML entities
        var decoded = content
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        var data = parseCompare(decoded);
        var id = 'compare-' + compareCounter;
        compareCounter++;
        return renderCompare(data, id);
      });

      next(html);
    });

    hook.doneEach(function() {
      // Apply Prism.js highlighting if available
      if (window.Prism) {
        document.querySelectorAll('.compare-code code').forEach(function(el) {
          window.Prism.highlightElement(el);
        });
      }

      setupLineHighlighting();
      handleResponsive();

      // Re-check responsive on resize
      window.addEventListener('resize', handleResponsive);
    });
  });
})();

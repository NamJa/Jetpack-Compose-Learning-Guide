/**
 * Flexbox Playground - Interactive Flexbox property explorer
 *
 * A standalone vanilla JS component for Docsify documentation sites.
 * Lets users manipulate Flexbox container and child properties in real-time,
 * generates corresponding React Native style code, and shows Android XML equivalents.
 *
 * Usage: Add <div class="flexbox-playground-mount"></div> in any Docsify markdown page.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Docsify plugin registration
  // ---------------------------------------------------------------------------
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function (hook) {
    hook.doneEach(function () {
      document.querySelectorAll('.flexbox-playground-mount').forEach(function (mount) {
        if (!mount.dataset.initialized) {
          mount.dataset.initialized = 'true';
          renderFlexboxPlayground(mount);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  var CHILD_COLORS = ['#e94560', '#61dafb', '#4ecdc4', '#f5a623', '#a855f7'];
  var MAX_CHILDREN = 5;

  var FLEX_DIRECTION_OPTIONS   = ['column', 'row', 'column-reverse', 'row-reverse'];
  var JUSTIFY_CONTENT_OPTIONS  = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
  var ALIGN_ITEMS_OPTIONS      = ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'];
  var FLEX_WRAP_OPTIONS        = ['nowrap', 'wrap', 'wrap-reverse'];
  var ALIGN_SELF_OPTIONS       = ['auto', 'flex-start', 'center', 'flex-end', 'stretch'];

  // Android XML equivalents reference
  var ANDROID_MAP = {
    flexDirection: {
      'column':         'orientation="vertical"',
      'row':            'orientation="horizontal"',
      'column-reverse': 'orientation="vertical" (reversed)',
      'row-reverse':    'orientation="horizontal" (reversed)'
    },
    justifyContent: {
      'flex-start':    'gravity="start"',
      'center':        'gravity="center"',
      'flex-end':      'gravity="end"',
      'space-between': 'gravity (custom spacing)',
      'space-around':  'gravity (custom spacing)',
      'space-evenly':  'gravity (custom spacing)'
    },
    alignItems: {
      'flex-start': 'gravity="start"',
      'center':     'gravity="center"',
      'flex-end':   'gravity="end"',
      'stretch':    'match_parent',
      'baseline':   'baselineAligned="true"'
    }
  };

  // ---------------------------------------------------------------------------
  // Inline styles (kept here so the template strings stay readable)
  // ---------------------------------------------------------------------------
  var STYLES = {
    playground:
      'border:1px solid var(--border-color, #333);' +
      'border-radius:12px;' +
      'overflow:hidden;' +
      'margin:24px 0;' +
      'background:var(--bg-primary, #1e1e2e);',

    content:
      'display:grid;' +
      'grid-template-columns:280px 1fr;' +
      'min-height:420px;',

    controls:
      'padding:16px;' +
      'border-right:1px solid var(--border-color, #333);' +
      'overflow-y:auto;' +
      'max-height:600px;' +
      'font-size:13px;',

    controlHeading:
      'margin:0 0 16px 0;' +
      'color:var(--theme-color, #61dafb);',

    label:
      'display:block;' +
      'font-size:12px;' +
      'font-weight:600;' +
      'margin:10px 0 4px;' +
      'color:var(--text-muted, #a0a0b0);',

    select:
      'width:100%;' +
      'padding:6px 8px;' +
      'border-radius:6px;' +
      'border:1px solid var(--border-color, #333);' +
      'background:var(--bg-secondary, #282c34);' +
      'color:var(--text-color, #e0e0e0);' +
      'font-size:13px;',

    rangeInput:
      'width:100%;' +
      'margin:4px 0 2px;',

    rangeValue:
      'font-size:12px;' +
      'color:var(--text-muted, #a0a0b0);',

    divider:
      'border:none;' +
      'border-top:1px solid var(--border-color, #333);' +
      'margin:14px 0;',

    childrenHeading:
      'margin:0 0 8px 0;' +
      'font-size:13px;' +
      'color:var(--text-color, #e0e0e0);',

    childCard:
      'margin-bottom:8px;' +
      'padding:8px;' +
      'border-radius:6px;' +
      'border:1px solid var(--border-color, #333);',

    childLabel:
      'font-size:12px;' +
      'font-weight:bold;',

    childInput:
      'width:100%;' +
      'padding:4px 6px;' +
      'border-radius:4px;' +
      'border:1px solid var(--border-color, #333);' +
      'background:var(--bg-secondary, #282c34);' +
      'color:var(--text-color, #e0e0e0);' +
      'font-size:12px;',

    removeBtn:
      'margin-top:4px;' +
      'font-size:11px;' +
      'color:#e94560;' +
      'background:none;' +
      'border:1px solid #e94560;' +
      'border-radius:4px;' +
      'padding:2px 8px;' +
      'cursor:pointer;' +
      'width:100%;',

    addBtn:
      'width:100%;' +
      'padding:8px;' +
      'border-radius:6px;' +
      'border:2px dashed var(--border-color, #333);' +
      'background:none;' +
      'color:var(--text-color, #e0e0e0);' +
      'cursor:pointer;' +
      'font-size:13px;',

    previewArea:
      'padding:16px;' +
      'display:flex;' +
      'flex-direction:column;' +
      'gap:16px;',

    previewBox:
      'flex:1;' +
      'min-height:260px;' +
      'border:2px dashed var(--border-color, #444);' +
      'border-radius:8px;' +
      'padding:12px;',

    previewChild:
      'min-width:40px;' +
      'min-height:40px;' +
      'border-radius:4px;' +
      'display:flex;' +
      'align-items:center;' +
      'justify-content:center;' +
      'font-size:12px;' +
      'font-weight:bold;' +
      'color:white;' +
      'transition:all 0.2s ease;',

    codeOutput:
      'background:var(--bg-secondary, #282c34);' +
      'border-radius:8px;' +
      'padding:12px 16px;' +
      'overflow-x:auto;' +
      'font-size:13px;' +
      'line-height:1.5;',

    androidNote:
      'font-size:12px;' +
      'color:var(--text-muted, #a0a0b0);' +
      'padding:8px 12px;' +
      'background:var(--bg-secondary, #282c34);' +
      'border-radius:6px;' +
      'border-left:3px solid #4ecdc4;'
  };

  // ---------------------------------------------------------------------------
  // Main render function
  // ---------------------------------------------------------------------------
  function renderFlexboxPlayground(container) {
    // Mutable state
    var state = {
      flexDirection:  'column',
      justifyContent: 'flex-start',
      alignItems:     'stretch',
      flexWrap:       'nowrap',
      gap:            8,
      children: [
        { flex: 1, alignSelf: 'auto' },
        { flex: 1, alignSelf: 'auto' },
        { flex: 1, alignSelf: 'auto' }
      ]
    };

    // ---------------------------
    // Global callbacks (scoped per playground instance via closure)
    // ---------------------------
    window.__flexUpdate = function (prop, value) {
      state[prop] = value;
      render();
    };

    window.__flexChildUpdate = function (index, prop, value) {
      state.children[index][prop] = value;
      render();
    };

    window.__flexAddChild = function () {
      if (state.children.length < MAX_CHILDREN) {
        state.children.push({ flex: 1, alignSelf: 'auto' });
        render();
      }
    };

    window.__flexRemoveChild = function (index) {
      if (state.children.length > 1) {
        state.children.splice(index, 1);
        render();
      }
    };

    // ---------------------------
    // Helpers
    // ---------------------------

    /** Build a labelled <select> bound to a state property. */
    function makeSelect(prop, options) {
      var html =
        '<label style="' + STYLES.label + '">' + prop + '</label>' +
        '<select style="' + STYLES.select + '" ' +
          'onchange="window.__flexUpdate(\'' + prop + '\', this.value)">';

      for (var i = 0; i < options.length; i++) {
        var selected = state[prop] === options[i] ? ' selected' : '';
        html += '<option value="' + options[i] + '"' + selected + '>' + options[i] + '</option>';
      }

      html += '</select>';
      return html;
    }

    /** Build the controls panel for a single child item. */
    function makeChildCard(child, index) {
      var color = CHILD_COLORS[index % CHILD_COLORS.length];
      var html =
        '<div style="' + STYLES.childCard + '">' +
          '<span style="' + STYLES.childLabel + 'color:' + color + ';">Child ' + (index + 1) + '</span>' +

          '<label style="' + STYLES.label + 'margin-top:6px;">flex</label>' +
          '<input type="number" min="0" max="10" value="' + child.flex + '" ' +
            'onchange="window.__flexChildUpdate(' + index + ', \'flex\', Number(this.value))" ' +
            'style="' + STYLES.childInput + '">' +

          '<label style="' + STYLES.label + '">alignSelf</label>' +
          '<select ' +
            'onchange="window.__flexChildUpdate(' + index + ', \'alignSelf\', this.value)" ' +
            'style="' + STYLES.childInput + '">';

      for (var i = 0; i < ALIGN_SELF_OPTIONS.length; i++) {
        var v = ALIGN_SELF_OPTIONS[i];
        var sel = child.alignSelf === v ? ' selected' : '';
        html += '<option value="' + v + '"' + sel + '>' + v + '</option>';
      }

      html += '</select>';

      if (state.children.length > 1) {
        html +=
          '<button onclick="window.__flexRemoveChild(' + index + ')" ' +
            'style="' + STYLES.removeBtn + '">삭제</button>';
      }

      html += '</div>';
      return html;
    }

    /** Generate React Native <View style={{...}}> code string. */
    function generateRNCode() {
      var lines = ['<View style={{'];
      lines.push("  flexDirection: '" + state.flexDirection + "',");
      lines.push("  justifyContent: '" + state.justifyContent + "',");
      lines.push("  alignItems: '" + state.alignItems + "',");
      if (state.flexWrap !== 'nowrap') {
        lines.push("  flexWrap: '" + state.flexWrap + "',");
      }
      if (state.gap > 0) {
        lines.push('  gap: ' + state.gap + ',');
      }
      lines.push('}}>');

      state.children.forEach(function (child, i) {
        var parts = [];
        if (child.flex > 0) parts.push('flex: ' + child.flex);
        if (child.alignSelf !== 'auto') parts.push("alignSelf: '" + child.alignSelf + "'");
        if (parts.length > 0) {
          lines.push('  <View style={{ ' + parts.join(', ') + " }} /> {/* Child " + (i + 1) + " */}");
        } else {
          lines.push('  <View /> {/* Child ' + (i + 1) + ' */}');
        }
      });

      lines.push('</View>');
      return lines.join('\n');
    }

    /** Build the Android XML equivalents note. */
    function generateAndroidNote() {
      var parts = [];
      if (ANDROID_MAP.flexDirection[state.flexDirection]) {
        parts.push('LinearLayout ' + ANDROID_MAP.flexDirection[state.flexDirection]);
      }
      if (ANDROID_MAP.justifyContent[state.justifyContent]) {
        parts.push(ANDROID_MAP.justifyContent[state.justifyContent]);
      }
      if (ANDROID_MAP.alignItems[state.alignItems]) {
        parts.push(ANDROID_MAP.alignItems[state.alignItems]);
      }
      return 'Android 대응: ' + parts.join(' · ');
    }

    // ---------------------------
    // Full render
    // ---------------------------
    function render() {
      // --- Controls panel ---
      var controlsHTML =
        '<div style="' + STYLES.controls + '">' +
          '<h4 style="' + STYLES.controlHeading + '">Flexbox Controls</h4>' +
          makeSelect('flexDirection', FLEX_DIRECTION_OPTIONS) +
          makeSelect('justifyContent', JUSTIFY_CONTENT_OPTIONS) +
          makeSelect('alignItems', ALIGN_ITEMS_OPTIONS) +
          makeSelect('flexWrap', FLEX_WRAP_OPTIONS) +

          '<label style="' + STYLES.label + '">gap</label>' +
          '<input type="range" min="0" max="24" value="' + state.gap + '" ' +
            'style="' + STYLES.rangeInput + '" ' +
            'oninput="this.nextElementSibling.textContent = this.value + \'px\'; window.__flexUpdate(\'gap\', Number(this.value))">' +
          '<span style="' + STYLES.rangeValue + '">' + state.gap + 'px</span>' +

          '<hr style="' + STYLES.divider + '">' +

          '<h4 style="' + STYLES.childrenHeading + '">Children (' + state.children.length + '/' + MAX_CHILDREN + ')</h4>';

      for (var c = 0; c < state.children.length; c++) {
        controlsHTML += makeChildCard(state.children[c], c);
      }

      if (state.children.length < MAX_CHILDREN) {
        controlsHTML +=
          '<button onclick="window.__flexAddChild()" style="' + STYLES.addBtn + '">+ Add Child</button>';
      }

      controlsHTML += '</div>';

      // --- Preview area ---
      var previewFlexStyle =
        'display:flex;' +
        'flex-direction:' + state.flexDirection + ';' +
        'justify-content:' + state.justifyContent + ';' +
        'align-items:' + state.alignItems + ';' +
        'flex-wrap:' + state.flexWrap + ';' +
        'gap:' + state.gap + 'px;';

      var childrenHTML = '';
      for (var p = 0; p < state.children.length; p++) {
        var ch = state.children[p];
        var childStyle = STYLES.previewChild +
          'background:' + CHILD_COLORS[p % CHILD_COLORS.length] + ';' +
          (ch.flex > 0 ? 'flex:' + ch.flex + ';' : '') +
          (ch.alignSelf !== 'auto' ? 'align-self:' + ch.alignSelf + ';' : '');
        childrenHTML += '<div style="' + childStyle + '">' + (p + 1) + '</div>';
      }

      var previewHTML =
        '<div style="' + STYLES.previewArea + '">' +
          '<div style="' + STYLES.previewBox + previewFlexStyle + '">' +
            childrenHTML +
          '</div>' +
          '<div style="' + STYLES.codeOutput + '">' +
            '<pre style="margin:0;"><code>' + escapeHTML(generateRNCode()) + '</code></pre>' +
          '</div>' +
          '<div style="' + STYLES.androidNote + '">' +
            escapeHTML(generateAndroidNote()) +
          '</div>' +
        '</div>';

      // --- Assemble ---
      container.innerHTML =
        '<div style="' + STYLES.playground + '">' +
          '<div style="' + STYLES.content + '">' +
            controlsHTML +
            previewHTML +
          '</div>' +
        '</div>';
    }

    // Kick off initial render
    render();
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  /** Minimal HTML-entity escaping for code output. */
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();

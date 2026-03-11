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

  function updateChecklistSummary(section, path) {
    var data = loadProgress();
    var checklists = data.checklists || {};
    var checkboxes = section.querySelectorAll('input[type="checkbox"]');
    var total = checkboxes.length;
    if (total === 0) return;

    var checked = 0;
    checkboxes.forEach(function(cb, i) {
      var key = path + ':' + i;
      if (checklists[key]) checked++;
    });

    // Find or create summary element
    var summary = section.querySelector('.checklist-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'checklist-summary';
      section.insertBefore(summary, section.firstChild);
    }

    var percent = Math.round((checked / total) * 100);
    var color = percent >= 100 ? '#4ecdc4' : percent >= 50 ? '#61dafb' : '#f5a623';
    summary.innerHTML =
      '<div class="checklist-summary-bar">' +
        '<span class="checklist-summary-text">\uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uC9C4\uD589: ' + checked + '/' + total + ' (' + percent + '%)</span>' +
        '<div class="checklist-progress-track">' +
          '<div class="checklist-progress-fill" style="width:' + percent + '%;background:' + color + ';"></div>' +
        '</div>' +
      '</div>';
  }

  // Register Docsify plugin
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(function(hook, vm) {
    hook.doneEach(function() {
      var path = vm.route.path;
      var data = loadProgress();
      var checklists = data.checklists || {};
      var section = document.querySelector('.markdown-section');
      if (!section) return;

      var checkboxes = section.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length === 0) return;

      checkboxes.forEach(function(cb, index) {
        var key = path + ':' + index;

        // Enable the checkbox
        cb.removeAttribute('disabled');
        cb.style.cursor = 'pointer';
        cb.style.width = '16px';
        cb.style.height = '16px';

        // Restore saved state
        if (checklists[key]) {
          cb.checked = true;
          // Style the parent li if applicable
          var li = cb.closest('li');
          if (li) li.classList.add('checklist-done');
        }

        // Handle change events
        cb.addEventListener('change', function() {
          var currentData = loadProgress();
          if (!currentData.checklists) currentData.checklists = {};

          if (cb.checked) {
            currentData.checklists[key] = true;
            var li = cb.closest('li');
            if (li) li.classList.add('checklist-done');
          } else {
            delete currentData.checklists[key];
            var li = cb.closest('li');
            if (li) li.classList.remove('checklist-done');
          }

          saveProgress(currentData);

          // Update summary
          updateChecklistSummary(section, path);
        });
      });

      // Show initial summary
      updateChecklistSummary(section, path);
    });
  });
})();

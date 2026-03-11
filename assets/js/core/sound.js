/**
 * Sound Effects - Web Audio API
 * No external files needed.
 */
(function() {
  'use strict';
  var ctx = null;

  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {
        return null;
      }
    }
    return ctx;
  }

  function isSoundEnabled() {
    try {
      var data = JSON.parse(localStorage.getItem('rn-learning-progress') || '{}');
      return data.settings && data.settings.sound;
    } catch(e) {
      return false;
    }
  }

  function playTone(freq, duration, type, gain) {
    if (!isSoundEnabled()) return;
    var c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();

    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.value = gain || 0.15;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  function playCorrect() {
    playTone(523, 0.1, 'sine', 0.12);
    setTimeout(function() { playTone(659, 0.1, 'sine', 0.12); }, 80);
    setTimeout(function() { playTone(784, 0.15, 'sine', 0.12); }, 160);
  }

  function playIncorrect() {
    playTone(330, 0.15, 'square', 0.08);
    setTimeout(function() { playTone(277, 0.2, 'square', 0.08); }, 120);
  }

  function playLevelUp() {
    var notes = [523, 659, 784, 1047];
    notes.forEach(function(freq, i) {
      setTimeout(function() { playTone(freq, 0.2, 'sine', 0.1); }, i * 120);
    });
  }

  function playCombo() {
    playTone(659, 0.08, 'sine', 0.1);
    setTimeout(function() { playTone(784, 0.08, 'sine', 0.1); }, 60);
    setTimeout(function() { playTone(988, 0.12, 'sine', 0.1); }, 120);
  }

  function playHeartbreak() {
    playTone(440, 0.15, 'sawtooth', 0.06);
    setTimeout(function() { playTone(370, 0.2, 'sawtooth', 0.06); }, 150);
  }

  function playBadge() {
    var notes = [523, 659, 784, 1047, 1319];
    notes.forEach(function(freq, i) {
      setTimeout(function() { playTone(freq, 0.15, 'sine', 0.08); }, i * 100);
    });
  }

  window.GameSound = {
    correct: playCorrect,
    incorrect: playIncorrect,
    levelUp: playLevelUp,
    combo: playCombo,
    heartbreak: playHeartbreak,
    badge: playBadge
  };
})();

/**
 * Confetti Animation - Canvas API
 * Lightweight confetti effect for celebrations.
 */
(function() {
  'use strict';

  function launch(options) {
    options = options || {};
    var duration = options.duration || 2500;
    var particleCount = options.particleCount || 80;
    var colors = options.colors || ['#61dafb', '#4ecdc4', '#f5a623', '#e94560', '#a06cd5', '#FFD700'];

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;pointer-events:none;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];

    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width * Math.random(),
        y: -20 - Math.random() * 100,
        w: 4 + Math.random() * 6,
        h: 6 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    var startTime = Date.now();
    var fadeStart = duration * 0.7;

    function frame() {
      var elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        canvas.remove();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(function(p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.rot += p.rotSpeed;

        if (elapsed > fadeStart) {
          p.opacity = Math.max(0, 1 - (elapsed - fadeStart) / (duration - fadeStart));
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  window.GameConfetti = { launch: launch };
})();

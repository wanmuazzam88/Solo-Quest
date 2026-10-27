/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Cinematic "ARISE" Title Card
   Dramatic dark-fantasy aesthetic inspired by Solo Leveling:
   - Deep shadow void (#020307)
   - Anamorphic horizontal laser lens flare streak
   - Multi-layered glowing typography: [일어나라] / [ARISE]
   - Slow-drifting ethereal shadow mana motes & shockwave ripple
   - Cinematic widescreen letterbox bars
   - Synchronized Web Audio API seismic braam, crystal flare & Monarch bells
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var overlay = null;
  var canvas = null;
  var ctx = null;
  var animFrameId = null;
  var isPlaying = false;
  var onCompleteCallback = null;
  var autoFinishTimer = null;

  var dpr = 1;
  var width = 0;
  var height = 0;
  var startTime = 0;
  var motes = [];
  var shockwaveRadius = 0;
  var shockwaveAlpha = 0;

  var DURATION_MS = 2800;

  function initOverlay() {
    overlay = document.getElementById('arise-intro');
    if (!overlay) return;
    canvas = document.getElementById('arise-canvas');
    if (canvas) ctx = canvas.getContext('2d');

    var btnSkip = document.getElementById('btn-intro-skip');
    if (btnSkip) {
      function doSkip(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        S.intro.skip();
      }
      btnSkip.onclick = doSkip;
      btnSkip.ontouchend = doSkip;
    }

    // Tapping anywhere on the intro overlay skips immediately
    function handleTapSkip(e) {
      if (e.target && e.target.id === 'btn-intro-skip') return;
      S.intro.skip();
    }
    overlay.onclick = handleTapSkip;
    overlay.ontouchend = handleTapSkip;
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }

  function initMotes() {
    motes = [];
    var count = Math.min(48, Math.floor(width * 0.05) + 15);
    for (var i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.0 + 0.6,
        vy: -Math.random() * 0.8 - 0.25,
        vx: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.65 + 0.2,
        seed: Math.random() * Math.PI * 2,
        isCyan: Math.random() > 0.4
      });
    }
  }

  // Draw anamorphic horizontal flare and central energy glint on canvas
  function drawAnamorphicFlare(cx, cy, elapsed) {
    if (!ctx) return;
    var t = Math.min(1, elapsed / 0.8);
    // Smooth ease out cubic
    var grow = 1 - Math.pow(1 - t, 3);
    var flareWidth = width * 0.95 * grow;
    var flareAlpha = Math.min(0.9, elapsed * 1.5);
    if (elapsed > 2.0) {
      flareAlpha *= Math.max(0, 1 - (elapsed - 2.0) / 0.8);
    }
    if (flareAlpha <= 0.01) return;

    ctx.save();

    // 1. Wide horizontal anamorphic cyan streak
    var gradLine = ctx.createLinearGradient(cx - flareWidth * 0.5, cy, cx + flareWidth * 0.5, cy);
    gradLine.addColorStop(0, 'rgba(0, 229, 255, 0)');
    gradLine.addColorStop(0.25, 'rgba(114, 9, 183, ' + (flareAlpha * 0.3) + ')');
    gradLine.addColorStop(0.48, 'rgba(0, 229, 255, ' + (flareAlpha * 0.85) + ')');
    gradLine.addColorStop(0.5, 'rgba(255, 255, 255, ' + flareAlpha + ')');
    gradLine.addColorStop(0.52, 'rgba(0, 229, 255, ' + (flareAlpha * 0.85) + ')');
    gradLine.addColorStop(0.75, 'rgba(114, 9, 183, ' + (flareAlpha * 0.3) + ')');
    gradLine.addColorStop(1, 'rgba(0, 229, 255, 0)');

    ctx.fillStyle = gradLine;
    ctx.fillRect(cx - flareWidth * 0.5, cy - 1.5, flareWidth, 3);

    // 2. Central blooming glint diamond
    var glintSize = 40 * grow;
    var glintAlpha = flareAlpha * 0.7;
    var glintGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glintSize);
    glintGrad.addColorStop(0, 'rgba(255, 255, 255, ' + glintAlpha + ')');
    glintGrad.addColorStop(0.3, 'rgba(0, 229, 255, ' + (glintAlpha * 0.8) + ')');
    glintGrad.addColorStop(0.7, 'rgba(114, 9, 183, ' + (glintAlpha * 0.3) + ')');
    glintGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glintGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, glintSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw expanding shockwave pulse ring
  function drawShockwave(cx, cy, elapsed) {
    if (!ctx || elapsed < 0.35) return;
    var tWave = (elapsed - 0.35) / 1.6;
    if (tWave > 1) return;

    var maxR = Math.max(width, height) * 0.85;
    var currentR = tWave * maxR;
    var alpha = Math.max(0, (1 - tWave) * 0.6);

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 255, ' + alpha + ')';
    ctx.lineWidth = Math.max(1, 4 * (1 - tWave));
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00E5FF';
    ctx.beginPath();
    ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function render(timestamp) {
    if (!isPlaying) return;
    if (!startTime) startTime = timestamp;
    var elapsed = (timestamp - startTime) / 1000;

    ctx.clearRect(0, 0, width, height);

    var cx = width / 2;
    var cy = height / 2;

    // --- 1. Ambient Mana Motes ---
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.y += m.vy;
      m.x += m.vx + Math.sin(elapsed * 1.5 + m.seed) * 0.3;
      if (m.y < -10) {
        m.y = height + 10;
        m.x = Math.random() * width;
      }
      var color = m.isCyan ? '0, 229, 255' : '138, 43, 226';
      var alpha = m.alpha * Math.min(1, elapsed * 2);
      ctx.fillStyle = 'rgba(' + color + ', ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 2. Anamorphic Flare Layer ---
    drawAnamorphicFlare(cx, cy, elapsed);

    // --- 3. Expanding Shockwave Ring ---
    drawShockwave(cx, cy, elapsed);

    animFrameId = requestAnimationFrame(render);
  }

  function finishIntro() {
    if (!isPlaying) return;
    isPlaying = false;

    if (autoFinishTimer) {
      clearTimeout(autoFinishTimer);
      autoFinishTimer = null;
    }

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    if (overlay) {
      overlay.classList.remove('active');
      overlay.classList.add('hidden');
      setTimeout(function () {
        if (overlay) {
          overlay.style.display = 'none';
        }
      }, 700);
    }

    if (typeof onCompleteCallback === 'function') {
      var cb = onCompleteCallback;
      onCompleteCallback = null;
      cb();
    }
  }

  S.intro = {
    init: function () {
      initOverlay();
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('orientationchange', function () {
        setTimeout(resize, 100);
      }, { passive: true });
    },

    play: function (callback, forceReplay) {
      initOverlay();
      if (!overlay) {
        if (callback) callback();
        return;
      }

      onCompleteCallback = callback;
      isPlaying = true;
      startTime = 0;

      if (autoFinishTimer) {
        clearTimeout(autoFinishTimer);
        autoFinishTimer = null;
      }

      overlay.style.display = 'flex';
      overlay.classList.remove('hidden', 'active');

      resize();
      initMotes();

      // Trigger audio design
      if (S.audio && S.audio.ariseCinematicSound) {
        try { S.audio.ariseCinematicSound(); } catch (err) {}
      } else if (S.audio && S.audio.monarchIntro) {
        try { S.audio.monarchIntro(); } catch (err) {}
      }

      // Allow 40ms paint before adding .active to kick off CSS letter transitions
      setTimeout(function () {
        if (overlay && isPlaying) {
          overlay.classList.add('active');
        }
      }, 40);

      animFrameId = requestAnimationFrame(render);

      // Auto finish after cinematic duration
      autoFinishTimer = setTimeout(function () {
        finishIntro();
      }, DURATION_MS);
    },

    skip: function () {
      finishIntro();
    }
  };

  // Wire automatic init on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    S.intro.init();
  });
})(window.SYS);

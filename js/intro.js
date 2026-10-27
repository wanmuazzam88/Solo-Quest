/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Solo Leveling Opening Intro Animation
   High-performance procedural canvas renderer & cinematic sequence.
   Features:
   - Double Dungeon ancient runic magic circle rotation
   - Shadow Monarch dark mist & floating mana embers
   - Sung Jin-woo's iconic glowing electric-cyan eye flare with smoke trails
   - Branching mana lightning discharge
   - Seismic [ARISE] (일어나라) shockwave pulse and radial spark burst
   - Procedural Web Audio API sound synchronization
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

  // Particle & animation states
  var dpr = 1;
  var width = 0;
  var height = 0;
  var startTime = 0;
  var embers = [];
  var shockwaveSparks = [];
  var lightnings = [];
  var shockwaveRadius = 0;
  var shockwaveTriggered = false;

  var DURATION_SEC = 3.6;

  function initOverlay() {
    overlay = document.getElementById('monarch-intro-overlay');
    if (!overlay) return;
    canvas = document.getElementById('intro-canvas');
    if (canvas) ctx = canvas.getContext('2d');

    var btnSkip = document.getElementById('btn-intro-skip');
    if (btnSkip) {
      function doSkip(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        S.intro.skip();
      }
      btnSkip.addEventListener('click', doSkip);
      btnSkip.addEventListener('touchend', doSkip);
    }

    // Tapping overlay background also allows instant skip
    overlay.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'btn-intro-skip') return;
      S.intro.skip();
    });
  }

  function resize() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
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

  function initEmbers() {
    embers = [];
    var count = Math.min(60, Math.floor(width * 0.08));
    for (var i = 0; i < count; i++) {
      embers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.8,
        vy: -Math.random() * 1.2 - 0.4,
        vx: (Math.random() - 0.5) * 0.6,
        alpha: Math.random() * 0.7 + 0.3,
        hue: Math.random() > 0.4 ? '0, 229, 255' : '150, 60, 255', // Cyan or Monarch violet
        seed: Math.random() * Math.PI * 2
      });
    }
  }

  function spawnShockwave() {
    shockwaveRadius = 1;
    shockwaveSparks = [];
    var count = 55;
    var cx = width / 2;
    var cy = height * 0.42;

    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      var speed = Math.random() * 9 + 4;
      shockwaveSparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 2.8 + 1.2,
        alpha: 1,
        color: Math.random() > 0.3 ? '0, 229, 255' : '255, 255, 255'
      });
    }
  }

  function generateLightning(x1, y1, x2, y2) {
    var points = [{ x: x1, y: y1 }];
    var steps = 10;
    var dx = (x2 - x1) / steps;
    var dy = (y2 - y1) / steps;
    for (var i = 1; i < steps; i++) {
      var offset = (Math.random() - 0.5) * 45;
      points.push({
        x: x1 + dx * i - dy * (offset / 50),
        y: y1 + dy * i + dx * (offset / 50) + offset
      });
    }
    points.push({ x: x2, y: y2 });
    return points;
  }

  // Draw ancient double-dungeon runic circle
  function drawRuneCircle(cx, cy, radius, alpha, angle) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Outer glow ring
    ctx.strokeStyle = 'rgba(0, 229, 255, ' + (alpha * 0.6) + ')';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00E5FF';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary dashed circle
    ctx.strokeStyle = 'rgba(0, 229, 255, ' + (alpha * 0.4) + ')';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Runic tick marks
    var ticks = 32;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0, 229, 255, ' + (alpha * 0.75) + ')';
    for (var i = 0; i < ticks; i++) {
      var a = (i / ticks) * Math.PI * 2;
      var r1 = radius * 0.88;
      var r2 = radius * (i % 4 === 0 ? 1.05 : 0.98);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }

    // Inner sacred geometry star
    var starPts = 8;
    ctx.strokeStyle = 'rgba(125, 249, 255, ' + (alpha * 0.45) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var j = 0; j < starPts * 2; j++) {
      var sa = (j / (starPts * 2)) * Math.PI * 2;
      var sr = j % 2 === 0 ? radius * 0.65 : radius * 0.35;
      if (j === 0) ctx.moveTo(Math.cos(sa) * sr, Math.sin(sa) * sr);
      else ctx.lineTo(Math.cos(sa) * sr, Math.sin(sa) * sr);
    }
    ctx.closePath();
    ctx.stroke();

    // Central pulsing glyph core
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.7) + ')';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Jin-woo's iconic glowing cyan eye slit with burning flame smoke trails
  function drawMonarchEyeFlare(cx, cy, intensity, time) {
    if (intensity <= 0.01) return;
    ctx.save();

    var eyeSpacing = Math.min(width * 0.18, 68);
    var eyeWidth = 26 * intensity;
    var eyeHeight = 6 * intensity;

    // Both left and right eyes
    var eyes = [
      { x: cx - eyeSpacing, dir: -1 },
      { x: cx + eyeSpacing, dir: 1 }
    ];

    eyes.forEach(function (eye) {
      var ex = eye.x;
      var ey = cy;

      // 1. Horizontal lens flare line
      var beamLen = 140 * intensity;
      var grad = ctx.createLinearGradient(ex - beamLen, ey, ex + beamLen, ey);
      grad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      grad.addColorStop(0.3, 'rgba(0, 229, 255, ' + (0.35 * intensity) + ')');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, ' + (0.95 * intensity) + ')');
      grad.addColorStop(0.7, 'rgba(0, 229, 255, ' + (0.35 * intensity) + ')');
      grad.addColorStop(1, 'rgba(0, 229, 255, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 3 * intensity;
      ctx.beginPath();
      ctx.moveTo(ex - beamLen, ey);
      ctx.lineTo(ex + beamLen, ey);
      ctx.stroke();

      // 2. Eye slit core (blazing cyan/white vertical slit)
      ctx.shadowBlur = 24 * intensity;
      ctx.shadowColor = '#00E5FF';
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(ex, ey, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp central slit
      ctx.fillStyle = 'rgba(0, 229, 255, ' + (0.9 * intensity) + ')';
      ctx.beginPath();
      ctx.ellipse(ex, ey, eyeWidth * 0.45, eyeHeight * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Ethereal flame smoke trail curving outward
      var trailCount = 4;
      for (var t = 0; t < trailCount; t++) {
        var trailLen = (90 + t * 30) * intensity;
        var wave = Math.sin(time * 6 + t * 1.8) * 14 * intensity;
        var endX = ex + eye.dir * trailLen;
        var endY = ey - (25 + t * 15 + wave);

        ctx.strokeStyle = 'rgba(0, 229, 255, ' + ((0.45 - t * 0.08) * intensity) + ')';
        ctx.lineWidth = (3.5 - t * 0.6) * intensity;
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#0066FF';

        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.bezierCurveTo(
          ex + eye.dir * (trailLen * 0.4), ey - 10 + wave * 0.5,
          ex + eye.dir * (trailLen * 0.7), ey - 20 - wave,
          endX, endY
        );
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  // Animation frame loop
  function render(timeMs) {
    if (!isPlaying) return;
    if (!startTime) startTime = timeMs;
    var elapsed = (timeMs - startTime) / 1000;

    ctx.clearRect(0, 0, width, height);

    var cx = width / 2;
    var cy = height * 0.42;

    // --- 1. Void Atmosphere & Floating Mana Embers ---
    for (var i = 0; i < embers.length; i++) {
      var p = embers[i];
      p.y += p.vy;
      p.x += p.vx + Math.sin(elapsed * 2 + p.seed) * 0.4;
      if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      ctx.fillStyle = 'rgba(' + p.hue + ', ' + p.alpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 2. Runic Magic Circle Phase (0s - 2.5s) ---
    var runeRadius = Math.min(width, height) * 0.38;
    var runeAlpha = 0;
    if (elapsed < 0.8) {
      runeAlpha = (elapsed / 0.8) * 0.65;
    } else if (elapsed < 2.4) {
      runeAlpha = 0.65 + Math.sin(elapsed * 5) * 0.15;
    } else {
      runeAlpha = Math.max(0, 0.65 - (elapsed - 2.4) * 0.7);
    }
    drawRuneCircle(cx, cy, runeRadius, runeAlpha, elapsed * 0.35);

    // --- 3. Monarch Eye Flare Phase (0.7s - 3.2s) ---
    var eyeIntensity = 0;
    if (elapsed >= 0.7 && elapsed < 1.6) {
      eyeIntensity = Math.min(1, (elapsed - 0.7) / 0.8);
    } else if (elapsed >= 1.6 && elapsed < 2.7) {
      eyeIntensity = 1.0 + Math.sin((elapsed - 1.6) * 12) * 0.18;
    } else if (elapsed >= 2.7) {
      eyeIntensity = Math.max(0, 1 - (elapsed - 2.7) / 0.5);
    }
    drawMonarchEyeFlare(cx, cy, eyeIntensity, elapsed);

    // --- 4. Branching Electric Lightning (1.2s - 2.4s) ---
    if (elapsed >= 1.2 && elapsed < 2.4) {
      if (Math.random() < 0.35) {
        var a1 = Math.random() * Math.PI * 2;
        var a2 = a1 + (Math.random() - 0.5) * 1.5;
        var rDist = runeRadius * (0.4 + Math.random() * 0.6);
        lightnings.push({
          pts: generateLightning(
            cx + Math.cos(a1) * (rDist * 0.3),
            cy + Math.sin(a1) * (rDist * 0.3),
            cx + Math.cos(a2) * rDist,
            cy + Math.sin(a2) * rDist
          ),
          life: 1.0
        });
      }
    }

    for (var l = lightnings.length - 1; l >= 0; l--) {
      var bolt = lightnings[l];
      bolt.life -= 0.14;
      if (bolt.life <= 0) {
        lightnings.splice(l, 1);
        continue;
      }
      ctx.save();
      ctx.strokeStyle = 'rgba(125, 249, 255, ' + bolt.life + ')';
      ctx.lineWidth = 1.8 * bolt.life;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00E5FF';
      ctx.beginPath();
      ctx.moveTo(bolt.pts[0].x, bolt.pts[0].y);
      for (var pi = 1; pi < bolt.pts.length; pi++) {
        ctx.lineTo(bolt.pts[pi].x, bolt.pts[pi].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // --- 5. [ARISE] Seismic Shockwave & Spark Burst (1.6s+) ---
    if (elapsed >= 1.6 && !shockwaveTriggered) {
      shockwaveTriggered = true;
      spawnShockwave();
    }

    if (shockwaveTriggered && shockwaveRadius < Math.max(width, height) * 1.2) {
      shockwaveRadius += (Math.max(width, height) * 0.05);
      var waveAlpha = Math.max(0, 1 - shockwaveRadius / (Math.max(width, height) * 1.1));

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, ' + (waveAlpha * 0.85) + ')';
      ctx.lineWidth = Math.max(1, 8 * waveAlpha);
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#00E5FF';
      ctx.beginPath();
      ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Render radial sparks
      for (var s = 0; s < shockwaveSparks.length; s++) {
        var sp = shockwaveSparks[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.94;
        sp.vy *= 0.94;
        sp.alpha *= 0.95;

        if (sp.alpha > 0.02) {
          ctx.fillStyle = 'rgba(' + sp.color + ', ' + sp.alpha + ')';
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- 6. DOM Stage Synchronizations ---
    var badgeEl = document.getElementById('intro-badge');
    var sysBoxEl = document.getElementById('intro-sys-box');
    var ariseEl = document.getElementById('intro-arise-banner');
    var descEl = document.getElementById('intro-sys-desc');

    if (elapsed >= 0.2 && badgeEl && !badgeEl.classList.contains('active')) {
      badgeEl.classList.add('active');
    }

    if (elapsed >= 0.8 && sysBoxEl && !sysBoxEl.classList.contains('active')) {
      sysBoxEl.classList.add('active');
      var pName = (S.state && S.state.profile && S.state.profile.hunterName && S.state.profile.hunterName !== 'PLAYER') ?
        S.state.profile.hunterName.toUpperCase() : 'SUNG JIN-WOO';
      if (descEl) descEl.textContent = 'SYNCHRONIZING WITH PLAYER: ' + pName + '...';
    }

    if (elapsed >= 1.6 && ariseEl && !ariseEl.classList.contains('active')) {
      if (sysBoxEl) sysBoxEl.style.display = 'none';
      ariseEl.classList.add('active');
    }

    // Complete transition
    if (elapsed >= DURATION_SEC) {
      finishIntro();
      return;
    }

    animFrameId = requestAnimationFrame(render);
  }

  function finishIntro() {
    if (!isPlaying) return;
    isPlaying = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(function () {
        overlay.style.display = 'none';
      }, 600);
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
      window.addEventListener('resize', resize);
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
      shockwaveTriggered = false;
      lightnings = [];

      overlay.style.display = 'flex';
      overlay.classList.remove('hidden');

      // Reset DOM element animations
      var badgeEl = document.getElementById('intro-badge');
      var sysBoxEl = document.getElementById('intro-sys-box');
      var ariseEl = document.getElementById('intro-arise-banner');
      if (badgeEl) badgeEl.classList.remove('active');
      if (sysBoxEl) {
        sysBoxEl.classList.remove('active');
        sysBoxEl.style.display = 'block';
      }
      if (ariseEl) ariseEl.classList.remove('active');

      resize();
      initEmbers();

      // Trigger procedural audio sound suite
      if (S.audio && S.audio.monarchIntro) {
        try { S.audio.monarchIntro(); } catch (err) {}
      }

      animFrameId = requestAnimationFrame(render);
    },

    skip: function () {
      finishIntro();
    }
  };

  // Wire automatic boot on load
  document.addEventListener('DOMContentLoaded', function () {
    S.intro.init();
  });
})(window.SYS);

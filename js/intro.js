/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Solo Leveling Dual Dagger Opening Cinematic
   100% Manhwa aesthetic featuring Sung Jin-woo's iconic twin daggers:
   - Kasaka's Venom Fang (카사카의 독니) with curved serrated toxic cyan aura
   - Knight Killer (기사 살해자) with obsidian steel & violet/crimson shadow runes
   - High-velocity diagonal slash arc trails
   - Kinetic X-Clash impact with 85+ explosive sparks and screen shake
   - Sung Jin-woo's piercing glowing cyan eye slits with billowing shadow flame trails
   - Ancient Double Dungeon rotating runic magic circle
   - Seismic [ARISE] (일어나라) shockwave pulse
   - Synchronized Web Audio API sound suite (unsheathing whooshes, steel clash,
     crystalline system chimes, and seismic sub-bass drop)
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
  var sparks = [];
  var shockwaveSparks = [];
  var lightnings = [];
  var shockwaveRadius = 0;
  var clashTriggered = false;
  var ariseTriggered = false;

  var DURATION_SEC = 3.9;

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
      btnSkip.onclick = doSkip;
      btnSkip.ontouchend = doSkip;
    }

    // Tapping anywhere on overlay allows instant skip
    overlay.onclick = function (e) {
      if (e.target && e.target.id === 'btn-intro-skip') return;
      S.intro.skip();
    };
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
    var count = Math.min(50, Math.floor(width * 0.06));
    for (var i = 0; i < count; i++) {
      embers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.8,
        vy: -Math.random() * 1.4 - 0.5,
        vx: (Math.random() - 0.5) * 0.7,
        alpha: Math.random() * 0.7 + 0.3,
        hue: Math.random() > 0.35 ? '0, 229, 255' : '138, 43, 226',
        seed: Math.random() * Math.PI * 2
      });
    }
  }

  function triggerShake() {
    if (!overlay) return;
    overlay.classList.remove('shake-heavy', 'flash-impact');
    void overlay.offsetWidth; // Force reflow
    overlay.classList.add('shake-heavy', 'flash-impact');
    setTimeout(function () {
      if (overlay) overlay.classList.remove('shake-heavy', 'flash-impact');
    }, 450);
  }

  function spawnClashSparks(cx, cy) {
    sparks = [];
    var count = 85;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = Math.random() * 14 + 5;
      sparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 2.8 + 1.2,
        alpha: 1,
        color: Math.random() > 0.4 ? '0, 229, 255' : (Math.random() > 0.5 ? '255, 255, 255' : '199, 125, 255')
      });
    }
  }

  function spawnShockwave(cx, cy) {
    shockwaveRadius = 1;
    shockwaveSparks = [];
    var count = 65;
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      var speed = Math.random() * 12 + 4;
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
    var steps = 8;
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

    // Secondary inner dashed ring
    ctx.strokeStyle = 'rgba(0, 229, 255, ' + (alpha * 0.4) + ')';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotating octagram stars
    ctx.strokeStyle = 'rgba(138, 43, 226, ' + (alpha * 0.45) + ')';
    ctx.lineWidth = 1;
    for (var r = 0; r < 2; r++) {
      ctx.beginPath();
      var rot = (r * Math.PI) / 4;
      for (var s = 0; s < 4; s++) {
        var a = rot + (s * Math.PI) / 2;
        var x = Math.cos(a) * (radius * 0.7);
        var y = Math.sin(a) * (radius * 0.7);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Dagger 1: Kasaka's Venom Fang (카사카의 독니)
  function drawKasaka(cx, cy, angle, scale, glowAlpha) {
    if (glowAlpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Toxic Cyan Poison Aura
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 24 * glowAlpha;

    // Blade Body (Curved Fang)
    ctx.beginPath();
    ctx.moveTo(0, 75);
    ctx.quadraticCurveTo(-14, 20, 6, -90); // Tip
    ctx.quadraticCurveTo(24, -40, 18, 0); // Serrated spine
    ctx.lineTo(26, 25);
    ctx.lineTo(16, 45);
    ctx.lineTo(22, 65);
    ctx.lineTo(12, 75);
    ctx.closePath();

    var grad = ctx.createLinearGradient(-15, 0, 25, 0);
    grad.addColorStop(0, '#E0F7FA');
    grad.addColorStop(0.3, '#00E5FF');
    grad.addColorStop(0.7, '#0066FF');
    grad.addColorStop(1, '#002244');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + glowAlpha + ')';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Central Poison Vein / Fuller
    ctx.beginPath();
    ctx.moveTo(0, 65);
    ctx.quadraticCurveTo(-6, 20, 4, -75);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Guard
    ctx.fillStyle = '#0F1A24';
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-22, 72, 44, 9, 3);
    ctx.fill();
    ctx.stroke();

    // Hilt
    ctx.fillStyle = '#1A2936';
    ctx.beginPath();
    ctx.roundRect(-6, 81, 12, 42, 2);
    ctx.fill();

    // Hilt Wraps
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-6, 88 + i * 8);
      ctx.lineTo(6, 92 + i * 8);
      ctx.stroke();
    }

    // Pommel Fang
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.moveTo(-7, 123);
    ctx.lineTo(7, 123);
    ctx.lineTo(0, 136);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Draw Dagger 2: Knight Killer (기사 살해자)
  function drawKnightKiller(cx, cy, angle, scale, glowAlpha) {
    if (glowAlpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Violet / Crimson Shadow Aura
    ctx.shadowColor = '#8A2BE2';
    ctx.shadowBlur = 24 * glowAlpha;

    // Blade Body (Obsidian Razor Dagger)
    ctx.beginPath();
    ctx.moveTo(-16, 75);
    ctx.lineTo(-14, 0);
    ctx.lineTo(0, -95); // Tip
    ctx.lineTo(14, 0);
    ctx.lineTo(16, 75);
    ctx.closePath();

    var grad = ctx.createLinearGradient(-16, 0, 16, 0);
    grad.addColorStop(0, '#11052C');
    grad.addColorStop(0.3, '#3A0CA3');
    grad.addColorStop(0.5, '#7209B7');
    grad.addColorStop(0.8, '#4361EE');
    grad.addColorStop(1, '#0B090A');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(199, 125, 255, ' + glowAlpha + ')';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Central Fuller with Glowing Crimson Runes
    ctx.beginPath();
    ctx.moveTo(0, 65);
    ctx.lineTo(0, -80);
    ctx.strokeStyle = '#FF0055';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#FF0055';
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Angular Guard
    ctx.fillStyle = '#1A0B2E';
    ctx.strokeStyle = '#8A2BE2';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-28, 80);
    ctx.lineTo(-24, 70);
    ctx.lineTo(0, 74);
    ctx.lineTo(24, 70);
    ctx.lineTo(28, 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hilt
    ctx.fillStyle = '#0D0221';
    ctx.beginPath();
    ctx.roundRect(-6, 80, 12, 44, 2);
    ctx.fill();

    // Pommel
    ctx.fillStyle = '#8A2BE2';
    ctx.beginPath();
    ctx.arc(0, 128, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Sung Jin-woo's piercing cyan slit eyes with bezier shadow flame smoke trails
  function drawEyeFlare(cx, cy, scale, alpha, time) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    var eyes = [
      { x: -34, dir: -1 },
      { x: 34, dir: 1 }
    ];

    for (var e = 0; e < eyes.length; e++) {
      var eye = eyes[e];
      var ex = eye.x;
      var ey = 0;

      // Outer radial cyan corona
      var corona = ctx.createRadialGradient(ex, ey, 2, ex, ey, 55);
      corona.addColorStop(0, 'rgba(0, 229, 255, ' + (alpha * 0.95) + ')');
      corona.addColorStop(0.35, 'rgba(0, 102, 255, ' + (alpha * 0.6) + ')');
      corona.addColorStop(0.7, 'rgba(138, 43, 226, ' + (alpha * 0.25) + ')');
      corona.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(ex, ey, 55, 0, Math.PI * 2);
      ctx.fill();

      // Sharp piercing eye slit core
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#00E5FF';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 9.5, 3.5, 0.15 * eye.dir, 0, Math.PI * 2);
      ctx.fill();

      // Upward billowing shadow mana flame trails
      for (var f = 0; f < 3; f++) {
        var flameOffset = Math.sin(time * 6 + f * 1.5) * 12;
        var flameLen = 48 + f * 18;

        ctx.strokeStyle = 'rgba(0, 229, 255, ' + (alpha * (0.8 - f * 0.22)) + ')';
        ctx.lineWidth = 3 - f * 0.7;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00E5FF';
        ctx.beginPath();
        ctx.moveTo(ex + eye.dir * 6, ey);
        ctx.quadraticCurveTo(
          ex + eye.dir * (22 + f * 10) + flameOffset,
          ey - flameLen * 0.5,
          ex + eye.dir * (35 + f * 16) + flameOffset * 1.4,
          ey - flameLen
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Main 60fps render loop
  function render(timestamp) {
    if (!isPlaying) return;

    if (!startTime) startTime = timestamp;
    var elapsed = (timestamp - startTime) / 1000;

    ctx.clearRect(0, 0, width, height);

    var cx = width / 2;
    var cy = height * 0.44;

    // --- 1. Ambient Floating Mana Embers ---
    for (var i = 0; i < embers.length; i++) {
      var p = embers[i];
      p.y += p.vy;
      p.x += p.vx + Math.sin(elapsed * 2 + p.seed) * 0.4;
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      ctx.fillStyle = 'rgba(' + p.hue + ', ' + p.alpha * Math.min(1, elapsed * 2) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 2. Rotating Double Dungeon Runes (1.5s+) ---
    if (elapsed >= 1.4) {
      var runeAlpha = Math.min(0.85, (elapsed - 1.4) * 0.9);
      var runeRadius = Math.min(width, height) * 0.38;
      drawRuneCircle(cx, cy, runeRadius, runeAlpha, elapsed * 0.4);
    }

    // --- 3. Twin Dagger Slash & Clash Choreography ---
    var dScale = Math.min(1.4, Math.max(0.85, width / 700));

    if (elapsed < 1.1) {
      // Inward Slash Interpolation (0.4s to 1.1s)
      var tSlash = Math.max(0, (elapsed - 0.4) / 0.7);
      // Ease out cubic
      var progress = 1 - Math.pow(1 - tSlash, 3);

      // Dagger 1 (Kasaka): top-left -> center
      var kStartX = cx - width * 0.45;
      var kStartY = cy - height * 0.45;
      var kCurX = kStartX + (cx - kStartX) * progress;
      var kCurY = kStartY + (cy - kStartY) * progress;
      var kAngle = -Math.PI * 0.35 + (Math.PI * 0.6) * progress;

      // Curved slash light trail behind Kasaka
      if (tSlash > 0.1 && tSlash < 0.95) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 255, ' + (0.75 * tSlash) + ')';
        ctx.lineWidth = 12 * (1 - tSlash);
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00E5FF';
        ctx.beginPath();
        ctx.moveTo(kStartX, kStartY);
        ctx.quadraticCurveTo(kCurX - 40, kCurY + 30, kCurX, kCurY);
        ctx.stroke();
        ctx.restore();
      }
      drawKasaka(kCurX, kCurY, kAngle, dScale, progress);

      // Dagger 2 (Knight Killer): bottom-right -> center
      var kkStartX = cx + width * 0.45;
      var kkStartY = cy + height * 0.45;
      var kkCurX = kkStartX + (cx - kkStartX) * progress;
      var kkCurY = kkStartY + (cy - kkStartY) * progress;
      var kkAngle = Math.PI * 0.65 - (Math.PI * 0.4) * progress;

      // Curved slash light trail behind Knight Killer
      if (tSlash > 0.15 && tSlash < 0.95) {
        ctx.save();
        ctx.strokeStyle = 'rgba(138, 43, 226, ' + (0.75 * tSlash) + ')';
        ctx.lineWidth = 12 * (1 - tSlash);
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#8A2BE2';
        ctx.beginPath();
        ctx.moveTo(kkStartX, kkStartY);
        ctx.quadraticCurveTo(kkCurX + 40, kkCurY - 30, kkCurX, kkCurY);
        ctx.stroke();
        ctx.restore();
      }
      drawKnightKiller(kkCurX, kkCurY, kkAngle, dScale, progress);
    } else {
      // The Locked X-Clash Formation (1.1s+)
      if (!clashTriggered) {
        clashTriggered = true;
        triggerShake();
        spawnClashSparks(cx, cy);

        // Electric mana lightning arcs across crossed blades
        lightnings = [
          generateLightning(cx - 70, cy - 50, cx + 60, cy + 50),
          generateLightning(cx + 60, cy - 60, cx - 50, cy + 60),
          generateLightning(cx - 30, cy - 80, cx + 40, cy + 70)
        ];
      }

      // Crossed angles with subtle recoil breathing
      var recoil = elapsed < 1.3 ? Math.sin((elapsed - 1.1) * Math.PI * 5) * 5 : 0;
      var kCrossAngle = Math.PI * 0.25 + (recoil * 0.01);
      var kkCrossAngle = -Math.PI * 0.25 - (recoil * 0.01);

      // In the final phase (2.5s+), blades slash outward
      var outProgress = Math.max(0, (elapsed - 2.5) / 0.8);
      var outShift = outProgress * 60;
      var outAlpha = Math.max(0, 1 - (elapsed - 3.2) * 1.5);

      if (outAlpha > 0.01) {
        drawKasaka(cx - outShift, cy - outShift * 0.3, kCrossAngle, dScale, outAlpha);
        drawKnightKiller(cx + outShift, cy + outShift * 0.3, kkCrossAngle, dScale, outAlpha);
      }
    }

    // --- 4. Render Clash Sparks ---
    for (var s = 0; s < sparks.length; s++) {
      var sp = sparks[s];
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

    // --- 5. Render Electric Mana Lightning Arcs (1.1s - 1.8s) ---
    if (elapsed >= 1.1 && elapsed <= 1.9 && lightnings.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#00E5FF';
      for (var l = 0; l < lightnings.length; l++) {
        var pts = lightnings[l];
        ctx.beginPath();
        for (var pi = 0; pi < pts.length; pi++) {
          var pt = pts[pi];
          var jx = (Math.random() - 0.5) * 4;
          var jy = (Math.random() - 0.5) * 4;
          if (pi === 0) ctx.moveTo(pt.x + jx, pt.y + jy);
          else ctx.lineTo(pt.x + jx, pt.y + jy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- 6. Sung Jin-woo Eye Flare & Shadow Flames (1.6s+) ---
    if (elapsed >= 1.6) {
      var eyeAlpha = Math.min(1, (elapsed - 1.6) * 1.5);
      drawEyeFlare(cx, cy - 25, 1.15, eyeAlpha, elapsed);
    }

    // --- 7. Seismic [ARISE] (일어나라) Shockwave & Radial Sparks (2.3s+) ---
    if (elapsed >= 2.3 && !ariseTriggered) {
      ariseTriggered = true;
      spawnShockwave(cx, cy);
    }

    if (ariseTriggered && shockwaveRadius < Math.max(width, height) * 1.3) {
      shockwaveRadius += (Math.max(width, height) * 0.05);
      var waveAlpha = Math.max(0, 1 - shockwaveRadius / (Math.max(width, height) * 1.2));

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, ' + (waveAlpha * 0.85) + ')';
      ctx.lineWidth = Math.max(1, 7 * waveAlpha);
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#00E5FF';
      ctx.beginPath();
      ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Render shockwave sparks
      for (var ss = 0; ss < shockwaveSparks.length; ss++) {
        var swSp = shockwaveSparks[ss];
        swSp.x += swSp.vx;
        swSp.y += swSp.vy;
        swSp.vx *= 0.94;
        swSp.vy *= 0.94;
        swSp.alpha *= 0.95;

        if (swSp.alpha > 0.02) {
          ctx.fillStyle = 'rgba(' + swSp.color + ', ' + swSp.alpha + ')';
          ctx.beginPath();
          ctx.arc(swSp.x, swSp.y, swSp.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- 8. DOM Stage Synchronizations ---
    var badgeEl = document.getElementById('intro-badge');
    var badgeText = document.getElementById('intro-badge-text');
    var sysBoxEl = document.getElementById('intro-sys-box');
    var sysTitleEl = document.getElementById('intro-sys-title');
    var sysDescEl = document.getElementById('intro-sys-desc');
    var ariseEl = document.getElementById('intro-arise-banner');

    if (elapsed >= 0.2 && badgeEl && !badgeEl.classList.contains('active')) {
      badgeEl.classList.add('active');
    }

    // Daggers clash: system box appears with item stats
    if (elapsed >= 1.1 && sysBoxEl && !sysBoxEl.classList.contains('active')) {
      sysBoxEl.classList.add('active');
      if (badgeText) badgeText.textContent = '[DUAL BLADES // MONARCH FORMATION]';
      if (sysTitleEl) sysTitleEl.textContent = '[EQUIPPED: KASAKA\'S FANG & KNIGHT KILLER]';
      if (sysDescEl) sysDescEl.textContent = 'ATTACK POWER: +280 • AGILITY: +45 // READY FOR BATTLE';
    }

    // Arise banner bursts in
    if (elapsed >= 2.3 && ariseEl && !ariseEl.classList.contains('active')) {
      if (sysBoxEl) sysBoxEl.style.display = 'none';
      ariseEl.classList.add('active');
    }

    // Finish sequence
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
      }, 550);
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
      clashTriggered = false;
      ariseTriggered = false;
      lightnings = [];
      sparks = [];

      overlay.style.display = 'flex';
      overlay.classList.remove('hidden');

      // Reset DOM element animations
      var badgeEl = document.getElementById('intro-badge');
      var badgeText = document.getElementById('intro-badge-text');
      var sysBoxEl = document.getElementById('intro-sys-box');
      var ariseEl = document.getElementById('intro-arise-banner');

      if (badgeEl) badgeEl.classList.remove('active');
      if (badgeText) badgeText.textContent = '[SYSTEM DIRECTIVE // DUAL BLADES MANIFESTED]';
      if (sysBoxEl) {
        sysBoxEl.classList.remove('active');
        sysBoxEl.style.display = 'block';
      }
      if (ariseEl) ariseEl.classList.remove('active');

      resize();
      initEmbers();

      // Trigger twin daggers synchronized sound suite
      if (S.audio && S.audio.dualDaggerIntro) {
        try { S.audio.dualDaggerIntro(); } catch (err) {}
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

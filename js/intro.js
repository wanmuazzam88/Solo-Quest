/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Cinematic Introduction Animation
   Modeled after Set-as-known Trait Icon Animation (Relentless) & Solo Leveling.
   Features:
   - Synchronized High-Definition Video Animation (Beating Heart, Stone Fortress,
     Kinetic Projectile Impact, Syringe Piercing, and Unbroken Heart Breakthrough)
   - Synchronized Master Sound Suite (Deep biological heartbeats, crushing stone,
     heavy impacts, and seismic ARISE mana burst)
   - Real-Time ECG Biometric Vital HUD (Dynamic BPM scanner & vitals)
   - Kinetic Screen Shakes, Impact Flashes, and Fissure Lightning Arcs
   - Sung Jin-woo Glowing Cyan Eye Flare & Billowing Shadow Flame Trails
   - Seismic [ARISE] (일어나라) Shockwave & Radial Spark Particles
   - Seamless chaining to Narrator Awakening / Command Center & 0ms Skip
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var overlay = null;
  var video = null;
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
  var stageImpact1 = false;
  var stageImpact2 = false;
  var stageArise = false;

  var DURATION_SEC = 9.8;

  function initOverlay() {
    overlay = document.getElementById('monarch-intro-overlay');
    if (!overlay) return;
    video = document.getElementById('intro-vid');
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

    // Tapping overlay background: unlocks audio if blocked, or skips on second tap
    var audioPrompt = document.getElementById('intro-audio-prompt');
    overlay.onclick = function (e) {
      if (e.target && e.target.id === 'btn-intro-skip') return;

      // Try unlocking audio if currently not playing
      if (S.audio && S.audio.currentIntroAudio && S.audio.currentIntroAudio.paused) {
        S.audio.currentIntroAudio.play().then(function () {
          if (audioPrompt) audioPrompt.style.display = 'none';
        }).catch(function () {});
      } else {
        // If audio is already active, tap skips the animation
        S.intro.skip();
      }
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
        hue: Math.random() > 0.35 ? '0, 229, 255' : '150, 60, 255',
        seed: Math.random() * Math.PI * 2
      });
    }
  }

  function triggerShake(type) {
    if (!overlay) return;
    overlay.classList.remove('shake-light', 'shake-heavy', 'flash-impact');
    void overlay.offsetWidth; // Force reflow
    if (type === 'light') {
      overlay.classList.add('shake-light');
    } else if (type === 'heavy') {
      overlay.classList.add('shake-heavy', 'flash-impact');
    }
    setTimeout(function () {
      if (overlay) overlay.classList.remove('shake-light', 'shake-heavy', 'flash-impact');
    }, 500);
  }

  function spawnShockwave() {
    shockwaveRadius = 1;
    shockwaveSparks = [];
    var count = 65;
    var cx = width / 2;
    var cy = height * 0.44;

    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      var speed = Math.random() * 11 + 4;
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
      var offset = (Math.random() - 0.5) * 55;
      points.push({
        x: x1 + dx * i - dy * (offset / 50),
        y: y1 + dy * i + dx * (offset / 50) + offset
      });
    }
    points.push({ x: x2, y: y2 });
    return points;
  }

  // Draw Sung Jin-woo's iconic glowing cyan eye flare with bezier shadow flame trails
  function drawEyeFlare(cx, cy, scale, alpha, time) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    var eyes = [
      { x: -32, dir: -1 },
      { x: 32, dir: 1 }
    ];

    for (var e = 0; e < eyes.length; e++) {
      var eye = eyes[e];
      var ex = eye.x;
      var ey = 0;

      // Outer radial cyan corona
      var corona = ctx.createRadialGradient(ex, ey, 2, ex, ey, 55);
      corona.addColorStop(0, 'rgba(0, 229, 255, ' + (alpha * 0.95) + ')');
      corona.addColorStop(0.3, 'rgba(0, 150, 255, ' + (alpha * 0.6) + ')');
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
      ctx.ellipse(ex, ey, 9, 3.5, 0.15 * eye.dir, 0, Math.PI * 2);
      ctx.fill();

      // Billowing upward shadow mana flame trails
      for (var f = 0; f < 3; f++) {
        var flameOffset = Math.sin(time * 6 + f * 1.5) * 12;
        var flameLen = 45 + f * 18;

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

    // Synchronize elapsed time with video if playing
    if (video && !video.paused && video.currentTime > 0) {
      elapsed = video.currentTime;
    }

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
      ctx.fillStyle = 'rgba(' + p.hue + ', ' + p.alpha * Math.min(1, elapsed * 1.5) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 2. Kinetic Impact 1 (Projectile Strike at ~3.2s) ---
    if (elapsed >= 3.2 && !stageImpact1) {
      stageImpact1 = true;
      triggerShake('light');
    }

    // --- 3. Kinetic Impact 2 (Fatal Syringe Piercing at ~4.3s) ---
    if (elapsed >= 4.3 && !stageImpact2) {
      stageImpact2 = true;
      triggerShake('heavy');

      // Spawn branching lightning arcs across the crack
      lightnings = [
        generateLightning(cx - 140, cy - 80, cx, cy),
        generateLightning(cx + 120, cy - 90, cx, cy + 20),
        generateLightning(cx - 30, cy - 130, cx + 50, cy + 40)
      ];
    }

    // Render mana lightning arcs during impact
    if (elapsed >= 4.3 && elapsed <= 5.2 && lightnings.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#00E5FF';
      for (var l = 0; l < lightnings.length; l++) {
        var pts = lightnings[l];
        ctx.beginPath();
        for (var pi = 0; pi < pts.length; pi++) {
          var pt = pts[pi];
          var jitterX = (Math.random() - 0.5) * 5;
          var jitterY = (Math.random() - 0.5) * 5;
          if (pi === 0) ctx.moveTo(pt.x + jitterX, pt.y + jitterY);
          else ctx.lineTo(pt.x + jitterX, pt.y + jitterY);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- 4. The Unbroken Heart Breakthrough & Arise (6.2s+) ---
    if (elapsed >= 6.2 && !stageArise) {
      stageArise = true;
      spawnShockwave();
    }

    // Sung Jin-woo eye flare emerging from the unbroken heart
    if (elapsed >= 6.2) {
      var eyeAlpha = Math.min(1, (elapsed - 6.2) * 1.2);
      drawEyeFlare(cx, cy - 25, 1.15, eyeAlpha, elapsed);
    }

    // Expanding shockwave pulse & sparks
    if (stageArise && shockwaveRadius < Math.max(width, height) * 1.3) {
      shockwaveRadius += (Math.max(width, height) * 0.045);
      var waveAlpha = Math.max(0, 1 - shockwaveRadius / (Math.max(width, height) * 1.2));

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, ' + (waveAlpha * 0.85) + ')';
      ctx.lineWidth = Math.max(1, 6 * waveAlpha);
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#00E5FF';
      ctx.beginPath();
      ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Render sparks
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

    // --- 5. DOM Stage Synchronizations ---
    var badgeEl = document.getElementById('intro-badge');
    var badgeText = document.getElementById('intro-badge-text');
    var ecgHud = document.getElementById('intro-ecg-hud');
    var bpmEl = document.getElementById('intro-bpm');
    var sysBoxEl = document.getElementById('intro-sys-box');
    var sysTitleEl = document.getElementById('intro-sys-title');
    var sysDescEl = document.getElementById('intro-sys-desc');
    var ariseEl = document.getElementById('intro-arise-banner');

    if (elapsed >= 0.2 && badgeEl && !badgeEl.classList.contains('active')) {
      badgeEl.classList.add('active');
    }

    if (elapsed >= 0.6 && ecgHud && !ecgHud.classList.contains('active')) {
      ecgHud.classList.add('active');
    }

    // Fluctuating organic BPM counter
    if (bpmEl && elapsed < 6.0) {
      var currentBpm = Math.floor(140 + Math.sin(elapsed * 5) * 6);
      bpmEl.textContent = currentBpm;
    }

    // Phase 1: Fortitude stone barrier
    if (elapsed >= 2.0 && elapsed < 3.2 && badgeText) {
      badgeText.textContent = '[FORTITUDE PROTOCOL // HARDENED STONE CARAPACE]';
    }

    // Phase 2: First impact
    if (elapsed >= 3.2 && elapsed < 4.3) {
      if (sysBoxEl && !sysBoxEl.classList.contains('active')) sysBoxEl.classList.add('active');
      if (sysTitleEl) sysTitleEl.textContent = '[KINETIC IMPACT DEFLECTED]';
      if (sysDescEl) sysDescEl.textContent = 'SURVIVAL PROTOCOL // STONE SHATTERED, CORE UNBROKEN';
    }

    // Phase 3: Fatal syringe piercing
    if (elapsed >= 4.3 && elapsed < 6.2) {
      if (sysTitleEl) sysTitleEl.textContent = '[FATAL DAMAGE ABSORPTION]';
      if (sysDescEl) sysDescEl.textContent = 'TRAIT: RELENTLESS // HEALTH CHUNK RETAINED';
      if (badgeText) badgeText.textContent = '[SYSTEM DIRECTIVE // DEATH OVERRULED]';
    }

    // Phase 4: Arise & Relentless Manifestation
    if (elapsed >= 6.2 && ariseEl && !ariseEl.classList.contains('active')) {
      if (sysBoxEl) sysBoxEl.style.display = 'none';
      if (ecgHud) ecgHud.style.display = 'none';
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

    if (video) {
      try {
        video.pause();
        video.currentTime = 0;
      } catch (e) {}
    }

    if (S.audio && S.audio.stopIntroAudio) {
      S.audio.stopIntroAudio();
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
      stageImpact1 = false;
      stageImpact2 = false;
      stageArise = false;
      lightnings = [];

      overlay.style.display = 'flex';
      overlay.classList.remove('hidden');

      // Reset DOM element animations
      var badgeEl = document.getElementById('intro-badge');
      var badgeText = document.getElementById('intro-badge-text');
      var ecgHud = document.getElementById('intro-ecg-hud');
      var sysBoxEl = document.getElementById('intro-sys-box');
      var ariseEl = document.getElementById('intro-arise-banner');
      var audioPrompt = document.getElementById('intro-audio-prompt');

      if (badgeEl) badgeEl.classList.remove('active');
      if (badgeText) badgeText.textContent = '[SYSTEM DIRECTIVE // BIO-METRIC SYNCHRONIZATION]';
      if (ecgHud) {
        ecgHud.classList.remove('active');
        ecgHud.style.display = 'flex';
      }
      if (sysBoxEl) {
        sysBoxEl.classList.remove('active');
        sysBoxEl.style.display = 'block';
      }
      if (ariseEl) ariseEl.classList.remove('active');
      if (audioPrompt) audioPrompt.style.display = 'block';

      resize();
      initEmbers();

      // Start synchronized audio track (TikTok master audio + fallback)
      if (S.audio && S.audio.playIntroAudio) {
        try { S.audio.playIntroAudio(); } catch (err) {}
      }

      // Start synchronized video
      if (video) {
        video.currentTime = 0;
        var playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.then(function () {
            if (audioPrompt) audioPrompt.style.display = 'none';
          }).catch(function (err) {
            console.log('[INTRO VIDEO PLAYBACK]', err);
          });
        }
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

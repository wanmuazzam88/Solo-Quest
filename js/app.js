/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Main Application Bootstrapper
   Initializes engines, background particle canvas, countdown clocks,
   live telemetry, and PWA integration.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var U = S.util;

  function initParticles() {
    var canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h;
    var particles = [];
    var count = 38;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.6 - 0.2,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    function loop() {
      ctx.clearRect(0, 0, w, h);
      var isPenalty = S.state && S.state.profile && S.state.profile.inPenaltyZone;
      var color = isPenalty ? '255, 0, 60' : '0, 229, 255';

      for (var i = 0; i < count; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        ctx.fillStyle = 'rgba(' + color + ', ' + p.alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  function startClocks() {
    setInterval(function () {
      // 1. Midnight countdown update
      var cdEl = document.getElementById('penalty-countdown');
      if (cdEl) {
        cdEl.textContent = U.hms(S.msToMidnight());
      }

      // 2. Focus Gate tick
      if (S.state && S.state.gate) {
        S.gateTick();
        var gateTimerEl = document.getElementById('gate-timer-display');
        if (gateTimerEl) {
          gateTimerEl.textContent = U.mmss(S.gateRemaining());
        }
      }

      // 3. Check for automatic day rollover or expired buffs
      if (S.checkRollover()) {
        S.commit();
      } else if (S.housekeeping()) {
        S.commit();
      }
    }, 1000);
  }

  function setupModalBackdrop() {
    var modal = document.getElementById('system-modal');
    if (!modal) return;
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        S.ui.closeModal();
      }
    });
  }

  /* ======================================================================
     Progressive Web App (PWA) Service Worker & Installation
     ====================================================================== */
  var deferredInstallPrompt = null;

  function initPWA() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js')
          .then(function (reg) {
            console.log('[PWA] Service Worker registered:', reg.scope);
          })
          .catch(function (err) {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Capture beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredInstallPrompt = e;
      var installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) {
        installBtn.classList.remove('hidden');
      }
    });

    // 3. Handle install button click
    var installBtn = document.getElementById('btn-pwa-install');
    if (installBtn) {
      installBtn.addEventListener('click', function () {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(function (choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            if (S.ui) S.ui.showToast('[SYSTEM INSTALLED]', 'Solo Quest added to your home screen.', 'gold');
          }
          deferredInstallPrompt = null;
          installBtn.classList.add('hidden');
        });
      });
    }

    // 4. Handle appinstalled event
    window.addEventListener('appinstalled', function () {
      deferredInstallPrompt = null;
      var installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) installBtn.classList.add('hidden');
      if (S.ui) S.ui.showToast('[SYSTEM INSTALLED]', 'Application is now running standalone.', 'gold');
      if (S.audio) S.audio.rankUp();
    });
  }

  /* ======================================================================
     Netlify & Injected Watermark Suppressor
     Guarantees the bottom mobile navigation dock remains unobstructed
     ====================================================================== */
  function suppressWatermarks() {
    try {
      var selectors = [
        '#netlify-badge',
        '.netlify-badge',
        '[data-netlify-badge]',
        '[data-testid*="netlify"]',
        '[class*="netlify"]',
        '[id*="netlify"]',
        'a[href*="netlify.com"]',
        'a[href*="netlify.app"]',
        'iframe[src*="netlify"]'
      ];
      selectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (node) {
          var container = node.closest('div[style*="fixed"]') || node.closest('div[style*="absolute"]') || node;
          if (container && container !== document.body && container !== document.documentElement && !container.classList.contains('mobile-dock')) {
            container.style.display = 'none';
            container.style.visibility = 'hidden';
            container.style.pointerEvents = 'none';
            if (container.parentNode) container.parentNode.removeChild(container);
          }
        });
      });

      var floatingDivs = document.querySelectorAll('body > div');
      floatingDivs.forEach(function (el) {
        if (el.id === 'app-root' || el.id === 'system-modal' || el.id === 'toast-container' || el.id === 'grace-banner' || el.classList.contains('scanlines')) return;
        var txt = (el.innerText || el.textContent || '').toLowerCase();
        if (txt.indexOf('netlify') !== -1) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
          if (el.parentNode) el.parentNode.removeChild(el);
        }
      });
    } catch (e) {
      // guard
    }
  }

  function initWatermarkSuppressor() {
    suppressWatermarks();
    if (typeof MutationObserver !== 'undefined') {
      var watermarkObserver = new MutationObserver(function () {
        suppressWatermarks();
      });
      watermarkObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    window.addEventListener('load', suppressWatermarks);
  }

  // Run watermark suppressor immediately
  initWatermarkSuppressor();

  // Boot on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    if (S.audio) S.audio.init();
    if (S.gateMgr) S.gateMgr.init();
    if (S.tracker) S.tracker.init();
    if (S.ui) S.ui.init();

    initParticles();
    startClocks();
    setupModalBackdrop();
    initPWA();
    suppressWatermarks();

    // Solo Leveling Opening Intro Animation
    if (S.intro && typeof S.intro.play === 'function') {
      S.intro.play(function () {
        // After intro finishes: if user is not initialized, show the Narrator Awakening Modal
        if (S.state && !S.state.initialized && S.ui) {
          setTimeout(function () {
            if (!S.state.initialized) {
              S.ui.renderAwakeningModal();
            }
          }, 120);
        }
      });
    } else if (S.state && !S.state.initialized && S.ui) {
      setTimeout(function () {
        if (!S.state.initialized) {
          S.ui.renderAwakeningModal();
        }
      }, 150);
    }

    console.log('[PROJECT: ARISE] The System is fully operational.');
  });
})(window.SYS);

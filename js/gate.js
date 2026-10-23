/* ==========================================================================
   THE SYSTEM // Focus Gate & Dark Lock Telemetry
   Handles Fullscreen API, Screen WakeLock API, tab visibility telemetry,
   the 15-second grace countdown on blur/minimize, and Gate Breach triggers.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var wakeLockSentinel = null;
  var graceTimer = null;
  var graceSecondsRemaining = 15;

  var G = S.gateMgr = {
    inGrace: false,
    graceLeft: 15,

    init: function () {
      // Visibility telemetry
      document.addEventListener('visibilitychange', G.handleVisibility);
      window.addEventListener('blur', G.handleBlur);
      window.addEventListener('focus', G.handleFocus);

      // Listen for gate lifecycle events
      S.on('gateStart', function (g) {
        if (g.darkLock) {
          G.engageDarkLock();
        }
      });

      S.on('gateEnd', function () {
        G.disengageDarkLock();
      });

      S.on('gateCleared', function () {
        G.disengageDarkLock();
      });
    },

    /* --- Request Screen Wake Lock --- */
    requestWakeLock: function () {
      if ('wakeLock' in navigator && !wakeLockSentinel) {
        navigator.wakeLock.request('screen')
          .then(function (sentinel) {
            wakeLockSentinel = sentinel;
            sentinel.addEventListener('release', function () {
              wakeLockSentinel = null;
            });
          })
          .catch(function (err) {
            console.log('[SYSTEM WAKELOCK] Wake lock not acquired:', err.message);
          });
      }
    },

    releaseWakeLock: function () {
      if (wakeLockSentinel) {
        try {
          wakeLockSentinel.release();
        } catch (e) {}
        wakeLockSentinel = null;
      }
    },

    /* --- Request Fullscreen --- */
    requestFullscreen: function () {
      var el = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(function () {});
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        }
      }
    },

    exitFullscreen: function () {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(function () {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    },

    engageDarkLock: function () {
      G.requestWakeLock();
      G.requestFullscreen();
      G.clearGrace();
      document.body.classList.add('dark-lock-active');
    },

    disengageDarkLock: function () {
      G.clearGrace();
      G.releaseWakeLock();
      document.body.classList.remove('dark-lock-active');
    },

    /* --- Telemetry Handlers --- */
    handleVisibility: function () {
      var g = S.state.gate;
      if (!g || !g.darkLock || g.phase !== 'FOCUS' || g.breached) return;

      if (document.hidden) {
        G.triggerGraceWarning();
      } else {
        G.recoverFromGrace();
      }
    },

    handleBlur: function () {
      var g = S.state.gate;
      if (!g || !g.darkLock || g.phase !== 'FOCUS' || g.breached) return;
      // Start grace if window lost focus
      G.triggerGraceWarning();
    },

    handleFocus: function () {
      G.recoverFromGrace();
    },

    triggerGraceWarning: function () {
      if (G.inGrace) return;
      var g = S.state.gate;
      if (!g || !g.darkLock || g.phase !== 'FOCUS' || g.breached) return;

      G.inGrace = true;
      G.graceLeft = 15;
      graceSecondsRemaining = 15;

      // Play alert tone
      if (S.audio) {
        S.audio.playTone(392, 'sawtooth', 0.25, 0.4, 0.01, 0);
        S.audio.playTone(311.13, 'sawtooth', 0.25, 0.4, 0.01, 0.3);
      }

      document.body.classList.add('grace-countdown-active');
      S.emit('graceWarning', { secondsLeft: G.graceLeft });

      clearInterval(graceTimer);
      graceTimer = setInterval(function () {
        graceSecondsRemaining--;
        G.graceLeft = graceSecondsRemaining;
        S.emit('graceTick', { secondsLeft: G.graceLeft });

        // Warning audio click
        if (S.audio) {
          S.audio.playTone(550, 'sawtooth', 0.08, 0.35, 0.01, 0);
        }

        if (graceSecondsRemaining <= 0) {
          clearInterval(graceTimer);
          G.inGrace = false;
          document.body.classList.remove('grace-countdown-active');
          // Gate breached!
          S.breachGate();
        }
      }, 1000);
    },

    recoverFromGrace: function () {
      if (!G.inGrace) return;
      G.clearGrace();
      if (S.audio) {
        S.audio.tap();
      }
      S.notify('[TELEMETRY STABILIZED]', 'Focus lock restored. Gate breach averted.', 'info');
      S.emit('graceRecovered', {});
    },

    clearGrace: function () {
      G.inGrace = false;
      G.graceLeft = 15;
      clearInterval(graceTimer);
      graceTimer = null;
      document.body.classList.remove('grace-countdown-active');
    }
  };
})(window.SYS);

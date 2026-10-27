/* ==========================================================================
   THE SYSTEM // Web Audio API Procedural Sound Synthesizer
   Zero external audio files. Synthesizes metallic System window chimes,
   quest check pulses, level-up sub-bass drops, Penalty klaxons, and Gate audio.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var ctx = null;

  function getCtx() {
    if (!ctx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  // Allow unlocking on any first user gesture
  function unlock() {
    getCtx();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  }
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });

  var A = S.audio = {
    enabled: true,
    volume: 0.5,

    init: function () {
      getCtx();
      if (S.state && S.state.settings) {
        A.enabled = S.state.settings.sound !== false;
        A.volume = S.state.settings.volume != null ? S.state.settings.volume : 0.5;
      }
    },

    setSound: function (enabled) {
      A.enabled = !!enabled;
      if (S.state && S.state.settings) {
        S.state.settings.sound = A.enabled;
        S.save();
      }
    },

    setVolume: function (vol) {
      A.volume = Math.max(0, Math.min(1, vol));
      if (S.state && S.state.settings) {
        S.state.settings.volume = A.volume;
        S.save();
      }
    },

    playTone: function (freq, type, duration, startVol, endVol, delay) {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      delay = delay || 0;
      var now = c.currentTime + delay;
      var osc = c.createOscillator();
      var gain = c.createGain();

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);

      var master = A.volume;
      startVol = (startVol == null ? 0.3 : startVol) * master;
      endVol = (endVol == null ? 0.0001 : endVol) * master;

      gain.gain.setValueAtTime(Math.max(0.0001, startVol), now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, endVol), now + duration);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    },

    /* --- System Metallic Window Chime --- */
    windowOpen: function () {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var now = c.currentTime;
      // High harmonic dual ping
      A.playTone(880, 'sine', 0.12, 0.25, 0.01, 0);
      A.playTone(1760, 'triangle', 0.18, 0.2, 0.001, 0.04);
      A.playTone(2640, 'sine', 0.25, 0.1, 0.0001, 0.08);
    },

    /* --- Quest Tick / Fast Log Button --- */
    tap: function () {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var now = c.currentTime;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.04);
      gain.gain.setValueAtTime(0.18 * A.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    },

    /* --- Quest Hold-to-Seal Pulse --- */
    sealHold: function () {
      if (!A.enabled) return null;
      var c = getCtx();
      if (!c) return null;
      var now = c.currentTime;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(660, now + 0.8);
      gain.gain.setValueAtTime(0.05 * A.volume, now);
      gain.gain.linearRampToValueAtTime(0.3 * A.volume, now + 0.8);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      return { osc: osc, gain: gain };
    },

    /* --- Quest Complete Chime --- */
    questComplete: function () {
      if (!A.enabled) return;
      var notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach(function (f, i) {
        A.playTone(f, 'sine', 0.28, 0.3, 0.001, i * 0.06);
        A.playTone(f * 2, 'triangle', 0.2, 0.1, 0.001, i * 0.06 + 0.02);
      });
    },

    /* --- Level Up Sub-Bass Drop & Fanfare --- */
    levelUp: function () {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var now = c.currentTime;

      // 1. Heavy Sub-Bass sweep
      var sub = c.createOscillator();
      var subGain = c.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(180, now);
      sub.frequency.exponentialRampToValueAtTime(45, now + 0.6);
      subGain.gain.setValueAtTime(0.5 * A.volume, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      sub.connect(subGain);
      subGain.connect(c.destination);
      sub.start(now);
      sub.stop(now + 0.75);

      // 2. High majestic triad sweep
      var arps = [440, 554.37, 659.25, 880, 1108.7, 1318.5, 1760];
      arps.forEach(function (freq, i) {
        A.playTone(freq, 'triangle', 0.4, 0.25, 0.001, 0.15 + i * 0.07);
      });
    },

    /* --- Rank Up / Promotion Exam Cleared --- */
    rankUp: function () {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var now = c.currentTime;

      // Epic bass boom
      var sub = c.createOscillator();
      var subGain = c.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(120, now);
      sub.frequency.exponentialRampToValueAtTime(35, now + 1.2);
      var filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(80, now + 1.2);

      subGain.gain.setValueAtTime(0.6 * A.volume, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

      sub.connect(filter);
      filter.connect(subGain);
      subGain.connect(c.destination);
      sub.start(now);
      sub.stop(now + 1.3);

      // Sovereign Royal Chords
      var chord1 = [329.63, 440, 554.37, 659.25]; // A maj
      var chord2 = [440, 554.37, 659.25, 880];
      var chord3 = [554.37, 659.25, 880, 1108.73];
      chord1.forEach(function (f) { A.playTone(f, 'sine', 0.5, 0.2, 0.01, 0.2); });
      chord2.forEach(function (f) { A.playTone(f, 'triangle', 0.6, 0.25, 0.01, 0.5); });
      chord3.forEach(function (f) { A.playTone(f, 'sine', 1.0, 0.35, 0.0001, 0.85); });
    },

    /* --- Penalty Zone Blood Crimson Klaxon --- */
    penaltyAlert: function () {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var now = c.currentTime;

      for (var pulse = 0; pulse < 3; pulse++) {
        var t = now + pulse * 0.35;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, t);
        osc.frequency.linearRampToValueAtTime(240, t + 0.25);

        gain.gain.setValueAtTime(0.4 * A.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      }
    },

    /* --- Gate Breach / Focus Broken Dissonance --- */
    gateBreach: function () {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var now = c.currentTime;
      var osc1 = c.createOscillator();
      var osc2 = c.createOscillator();
      var gain = c.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(146.83, now); // D3
      osc2.frequency.setValueAtTime(155.56, now); // D#3 (harsh minor 2nd clash)

      gain.gain.setValueAtTime(0.45 * A.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(c.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    },

    /* --- Gate Ping (Entering / Pulse) --- */
    gatePulse: function () {
      if (!A.enabled) return;
      A.playTone(330, 'sine', 0.25, 0.15, 0.001, 0);
      A.playTone(660, 'sine', 0.35, 0.12, 0.0001, 0.08);
    },

    /* --- Loot Box Opening Sequence --- */
    lootOpen: function (rarity) {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var arps = [392, 440, 523.25, 659.25, 783.99, 1046.5];
      arps.forEach(function (f, i) {
        A.playTone(f, 'sine', 0.2, 0.2, 0.01, i * 0.05);
      });
      // Final chord depends on rarity
      var topNote = rarity === 'MYTHIC' ? 1567.98 : rarity === 'LEGENDARY' ? 1318.51 : 1046.5;
      A.playTone(topNote, 'triangle', 0.7, 0.35, 0.0001, 0.35);
      if (rarity === 'MYTHIC' || rarity === 'LEGENDARY') {
        A.playTone(topNote * 1.5, 'sine', 0.9, 0.25, 0.0001, 0.4);
      }
    },

    /* --- [ARISE] Command Shadow Extraction --- */
    arise: function () {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var now = c.currentTime;

      // Deep void rumble
      var sub = c.createOscillator();
      var gain = c.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(65, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 1.8);

      var filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 1.8);

      gain.gain.setValueAtTime(0.7 * A.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

      sub.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      sub.start(now);
      sub.stop(now + 2.0);

      // Monarch Bell
      A.playTone(440, 'sine', 1.2, 0.3, 0.0001, 0.3);
      A.playTone(880, 'sine', 1.5, 0.2, 0.0001, 0.4);
      A.playTone(1320, 'triangle', 1.8, 0.15, 0.0001, 0.5);
    },

    /* --- Full Cinematic Monarch Awakening Intro Sound Suite --- */
    monarchIntro: function () {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var now = c.currentTime;

      // 1. Ominous Shadow Domain Drone (0s - 1.2s)
      try {
        var drone = c.createOscillator();
        var droneGain = c.createGain();
        drone.type = 'sawtooth';
        drone.frequency.setValueAtTime(55, now);
        drone.frequency.exponentialRampToValueAtTime(32, now + 1.2);
        var droneFilter = c.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(120, now);
        droneFilter.frequency.linearRampToValueAtTime(60, now + 1.2);
        droneGain.gain.setValueAtTime(0.001, now);
        droneGain.gain.linearRampToValueAtTime(0.4 * A.volume, now + 0.3);
        droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        drone.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(c.destination);
        drone.start(now);
        drone.stop(now + 1.5);
      } catch (e) {}

      // 2. High-Tech System Holographic Notification Chime (0.8s)
      A.playTone(987.77, 'sine', 0.22, 0.35, 0.001, 0.75); // B5
      A.playTone(1975.53, 'triangle', 0.35, 0.3, 0.0001, 0.82); // B6
      A.playTone(2959.96, 'sine', 0.45, 0.15, 0.0001, 0.90); // F#7

      // 3. Electric Mana Lightning Crackle (1.2s)
      try {
        var zap = c.createOscillator();
        var zapGain = c.createGain();
        zap.type = 'square';
        zap.frequency.setValueAtTime(320, now + 1.15);
        zap.frequency.exponentialRampToValueAtTime(1400, now + 1.35);
        zapGain.gain.setValueAtTime(0.001, now + 1.15);
        zapGain.gain.linearRampToValueAtTime(0.2 * A.volume, now + 1.25);
        zapGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
        zap.connect(zapGain);
        zapGain.connect(c.destination);
        zap.start(now + 1.15);
        zap.stop(now + 1.5);
      } catch (e) {}

      // 4. Epic Seismic [ARISE] Bass Drop & Mana Burst (1.6s)
      try {
        var sub = c.createOscillator();
        var subGain = c.createGain();
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(110, now + 1.55);
        sub.frequency.exponentialRampToValueAtTime(28, now + 3.0);
        var subFilter = c.createBiquadFilter();
        subFilter.type = 'lowpass';
        subFilter.frequency.setValueAtTime(260, now + 1.55);
        subFilter.frequency.exponentialRampToValueAtTime(50, now + 3.0);
        subGain.gain.setValueAtTime(0.8 * A.volume, now + 1.55);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
        sub.connect(subFilter);
        subFilter.connect(subGain);
        subGain.connect(c.destination);
        sub.start(now + 1.55);
        sub.stop(now + 3.3);

        // Resonant Monarch Bells (1.7s)
        A.playTone(523.25, 'sine', 1.8, 0.35, 0.0001, 1.6);
        A.playTone(1046.5, 'sine', 2.0, 0.25, 0.0001, 1.68);
        A.playTone(1567.98, 'triangle', 2.4, 0.2, 0.0001, 1.76);
      } catch (e) {}
    },

    /* --- Twin Dagger Clash & Slash Synthesizer --- */
    daggerWhoosh: function (delay) {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      delay = delay || 0;
      var now = c.currentTime + delay;

      try {
        var osc = c.createOscillator();
        var gain = c.createGain();
        var filter = c.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(350, now + 0.28);
        filter.Q.setValueAtTime(3, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.35 * A.volume, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      } catch (e) {}
    },

    daggerClash: function (delay) {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      delay = delay || 0;
      var now = c.currentTime + delay;

      // 1. High-frequency metallic blade ring (dual overtones)
      A.playTone(2140, 'triangle', 0.65, 0.45, 0.0001, delay);
      A.playTone(2860, 'sine', 0.55, 0.35, 0.0001, delay + 0.005);
      A.playTone(920, 'sine', 0.8, 0.3, 0.0001, delay + 0.01);

      // 2. Kinetic punch / sub thump on collision
      try {
        var sub = c.createOscillator();
        var subGain = c.createGain();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(160, now);
        sub.frequency.exponentialRampToValueAtTime(45, now + 0.25);
        subGain.gain.setValueAtTime(0.7 * A.volume, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        sub.connect(subGain);
        subGain.connect(c.destination);
        sub.start(now);
        sub.stop(now + 0.3);
      } catch (e) {}

      // 3. Spark discharge crackle
      try {
        var zap = c.createOscillator();
        var zapGain = c.createGain();
        zap.type = 'square';
        zap.frequency.setValueAtTime(1200, now + 0.02);
        zap.frequency.exponentialRampToValueAtTime(320, now + 0.18);
        zapGain.gain.setValueAtTime(0.25 * A.volume, now + 0.02);
        zapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        zap.connect(zapGain);
        zapGain.connect(c.destination);
        zap.start(now + 0.02);
        zap.stop(now + 0.22);
      } catch (e) {}
    },

    /* --- Full Cinematic Solo Leveling Dual Dagger Intro Sound Suite --- */
    dualDaggerIntro: function () {
      if (!A.enabled) return;
      var c = getCtx();
      if (!c) return;
      var now = c.currentTime;

      // 0.0s: Ambient Shadow Void Drone
      try {
        var drone = c.createOscillator();
        var droneGain = c.createGain();
        drone.type = 'sawtooth';
        drone.frequency.setValueAtTime(55, now);
        drone.frequency.exponentialRampToValueAtTime(32, now + 1.2);
        var droneFilter = c.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(110, now);
        droneFilter.frequency.linearRampToValueAtTime(50, now + 1.2);
        droneGain.gain.setValueAtTime(0.001, now);
        droneGain.gain.linearRampToValueAtTime(0.35 * A.volume, now + 0.3);
        droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        drone.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(c.destination);
        drone.start(now);
        drone.stop(now + 1.5);
      } catch (e) {}

      // 0.5s: Kasaka's Venom Fang Whoosh (Left Dagger)
      A.daggerWhoosh(0.5);

      // 0.75s: Knight Killer Whoosh (Right Dagger)
      A.daggerWhoosh(0.75);

      // 1.1s: THE X-CLASH IMPACT
      A.daggerClash(1.1);

      // 1.7s: High-Tech System Window Crystal Ping
      A.playTone(1046.5, 'sine', 0.22, 0.35, 0.001, 1.65); // C6
      A.playTone(2093.0, 'triangle', 0.35, 0.3, 0.0001, 1.72); // C7
      A.playTone(3135.96, 'sine', 0.45, 0.15, 0.0001, 1.80); // G7

      // 2.3s: Epic Seismic [ARISE] Sub-Bass Drop & Monarch Chime
      try {
        var sub = c.createOscillator();
        var subGain = c.createGain();
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(115, now + 2.3);
        sub.frequency.exponentialRampToValueAtTime(26, now + 4.0);
        var subFilter = c.createBiquadFilter();
        subFilter.type = 'lowpass';
        subFilter.frequency.setValueAtTime(240, now + 2.3);
        subFilter.frequency.exponentialRampToValueAtTime(45, now + 4.0);
        subGain.gain.setValueAtTime(0.85 * A.volume, now + 2.3);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);
        sub.connect(subFilter);
        subFilter.connect(subGain);
        subGain.connect(c.destination);
        sub.start(now + 2.3);
        sub.stop(now + 4.3);

        // Resonant Monarch Bells
        A.playTone(523.25, 'sine', 2.0, 0.35, 0.0001, 2.35);
        A.playTone(1046.5, 'sine', 2.2, 0.25, 0.0001, 2.42);
        A.playTone(1567.98, 'triangle', 2.5, 0.2, 0.0001, 2.50);
      } catch (e) {}
    },

    stopIntroAudio: function () {
      // Clean stop hook
    }
  };

  // Wire events automatically
  S.on('levelUp', function () { A.levelUp(); });
  S.on('rankUp', function () { A.rankUp(); });
  S.on('penalty', function () { A.penaltyAlert(); });
  S.on('gateBreach', function () { A.gateBreach(); });
  S.on('gateStart', function () { A.gatePulse(); });
  S.on('arise', function () { A.arise(); });
})(window.SYS);

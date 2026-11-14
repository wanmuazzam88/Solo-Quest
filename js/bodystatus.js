/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — 3D Anatomical Body Status & Workout Engine
   Loads assets/models/hunter_anatomy.glb, provides 360° orbit/pinch/snap
   camera, raycast tap selection with hologram rim outline, floating System
   HUD window, and dynamic workout-to-muscle recoloring.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var U = S.util || {
    esc: function (s) {
      return String(s || '').replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
  };

  /* --- 1. 21 Anatomical Muscle Definitions (Matches GLB Mesh Names) --- */
  var ANATOMY_MUSCLES = [
    // Chest & Core
    { id: 'Chest_Upper', name: 'Upper Chest',     group: 'CHEST & CORE',    side: 'front' },
    { id: 'Chest_Mid',   name: 'Mid Chest',       group: 'CHEST & CORE',    side: 'front' },
    { id: 'Chest_Lower', name: 'Lower Chest',     group: 'CHEST & CORE',    side: 'front' },
    { id: 'Abs_Upper',   name: 'Upper Abs',       group: 'CHEST & CORE',    side: 'front' },
    { id: 'Abs_Mid',     name: 'Mid Abs',         group: 'CHEST & CORE',    side: 'front' },
    { id: 'Abs_Lower',   name: 'Lower Abs',       group: 'CHEST & CORE',    side: 'front' },
    { id: 'Obliques',    name: 'Obliques',        group: 'CHEST & CORE',    side: 'front' },
    // Shoulders & Arms
    { id: 'Traps',       name: 'Trapezius',       group: 'SHOULDERS & ARMS', side: 'back' },
    { id: 'Front_Delts', name: 'Front Deltoids',  group: 'SHOULDERS & ARMS', side: 'front' },
    { id: 'Side_Delts',  name: 'Side Deltoids',   group: 'SHOULDERS & ARMS', side: 'both' },
    { id: 'Rear_Delts',  name: 'Rear Deltoids',   group: 'SHOULDERS & ARMS', side: 'back' },
    { id: 'Biceps',      name: 'Biceps',          group: 'SHOULDERS & ARMS', side: 'front' },
    { id: 'Triceps',     name: 'Triceps',         group: 'SHOULDERS & ARMS', side: 'back' },
    { id: 'Forearms',    name: 'Forearms',        group: 'SHOULDERS & ARMS', side: 'both' },
    // Back
    { id: 'Lats',        name: 'Latissimus Dorsi', group: 'BACK',           side: 'back' },
    { id: 'Rhomboids',   name: 'Rhomboids',       group: 'BACK',            side: 'back' },
    { id: 'Lower_Back',  name: 'Lower Back',      group: 'BACK',            side: 'back' },
    // Legs
    { id: 'Quads',       name: 'Quadriceps',      group: 'LEGS',            side: 'front' },
    { id: 'Hamstrings',  name: 'Hamstrings',      group: 'LEGS',            side: 'back' },
    { id: 'Glutes',      name: 'Glutes',          group: 'LEGS',            side: 'back' },
    { id: 'Calves',      name: 'Calves',          group: 'LEGS',            side: 'back' }
  ];

  var MUSCLE_MAP = {};
  ANATOMY_MUSCLES.forEach(function (m) { MUSCLE_MAP[m.id] = m; });
  S.ANATOMY_MUSCLES = ANATOMY_MUSCLES;
  S.ANATOMY_MUSCLE_MAP = MUSCLE_MAP;

  /* --- 2. Hunter Rank Tiers, Trophy Config & Helpers --- */
  var TROPHY_VERSION = 2;

  var RANK_THRESHOLDS = {
    DORMANT: 0,
    E: 5,
    D: 20,
    C: 50,
    B: 110,
    A: 220,
    S: 400
  };

  var MUSCLE_RANKS = [
    { index: 0, key: 'DORMANT', rank: 'Dormant', badge: 'DORMANT', title: 'Unawakened',     minSets: RANK_THRESHOLDS.DORMANT, color: '#0B0E14', emissive: '#000000', emissiveIntensity: 0.00, roughness: 0.85, metalness: 0.30, css: '#6E85A6' },
    { index: 1, key: 'E',       rank: 'E-Rank',  badge: 'E-RANK',  title: 'First Spark',    minSets: RANK_THRESHOLDS.E,       color: '#8C5A3C', emissive: '#FF7A3D', emissiveIntensity: 0.08, roughness: 0.60, metalness: 0.70, css: '#8C5A3C' },
    { index: 2, key: 'D',       rank: 'D-Rank',  badge: 'D-RANK',  title: 'Tempered Iron',  minSets: RANK_THRESHOLDS.D,       color: '#9AA7B8', emissive: '#CFE3FF', emissiveIntensity: 0.12, roughness: 0.40, metalness: 0.85, css: '#9AA7B8' },
    { index: 3, key: 'C',       rank: 'C-Rank',  badge: 'C-RANK',  title: 'Mana-Infused',   minSets: RANK_THRESHOLDS.C,       color: '#00E5FF', emissive: '#00E5FF', emissiveIntensity: 0.35, roughness: 0.28, metalness: 0.55, css: '#00E5FF' },
    { index: 4, key: 'B',       rank: 'B-Rank',  badge: 'B-RANK',  title: 'Awakened',       minSets: RANK_THRESHOLDS.B,       color: '#2962FF', emissive: '#2979FF', emissiveIntensity: 0.50, roughness: 0.22, metalness: 0.50, css: '#2962FF' },
    { index: 5, key: 'A',       rank: 'A-Rank',  badge: 'A-RANK',  title: 'Red Gate Elite', minSets: RANK_THRESHOLDS.A,       color: '#FF1744', emissive: '#FF1744', emissiveIntensity: 0.65, roughness: 0.18, metalness: 0.45, css: '#FF1744' },
    { index: 6, key: 'S',       rank: 'S-Rank',  badge: 'S-RANK',  title: 'Shadow Monarch', minSets: RANK_THRESHOLDS.S,       color: '#9D4EDD', emissive: '#E0AAFF', emissiveIntensity: 0.90, roughness: 0.12, metalness: 0.40, css: '#9D4EDD' }
  ];

  var RANK_BY_KEY = {};
  MUSCLE_RANKS.forEach(function (r) { RANK_BY_KEY[r.key] = r; });

  var ATROPHY_CONFIG = {
    graceDays: 13,
    fadingStartDays: 14,
    atrophyStartDays: 21,
    maxFadingDesat: 0.35,
    maxAtrophyDesat: 0.60,
    atrophyDesatPerDay: 0.01,
    baseDailyDecayRate: 0.015,
    floorPeakRatio: 0.40,
    minRankFloorSets: RANK_THRESHOLDS.E,
    rankDecayMult: { DORMANT: 1.0, E: 1.0, D: 1.0, C: 0.85, B: 0.85, A: 0.70, S: 0.70 },
    memoryMultiplier: 2.0,
    dailySetCap: 15,
    starStepSets: 200,
    maxStars: 3
  };

  S.RANK_THRESHOLDS = RANK_THRESHOLDS;
  S.MUSCLE_RANKS = MUSCLE_RANKS;
  S.ATROPHY_CONFIG = ATROPHY_CONFIG;

  function getRankForSets(sets) {
    var val = Number(sets) || 0;
    var chosen = MUSCLE_RANKS[0];
    for (var i = 0; i < MUSCLE_RANKS.length; i++) {
      if (val >= MUSCLE_RANKS[i].minSets) chosen = MUSCLE_RANKS[i];
    }
    return chosen;
  }

  function getStarsForSets(sets) {
    var val = Number(sets) || 0;
    var sMin = RANK_THRESHOLDS.S;
    if (val < sMin) return 0;
    return Math.min(ATROPHY_CONFIG.maxStars, Math.floor((val - sMin) / ATROPHY_CONFIG.starStepSets));
  }

  function repeatStars(n) {
    var out = '';
    for (var i = 0; i < n; i++) out += '\u2605';
    return out;
  }

  function formatStars(stars) {
    return stars > 0 ? ' ' + repeatStars(stars) : '';
  }

  function getLocalDateKey(ts) {
    var d = new Date(ts || Date.now());
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function toHex2(n) {
    var v = Math.max(0, Math.min(255, Math.round(n)));
    return (v < 16 ? '0' : '') + v.toString(16);
  }

  function desaturateHex(hex, amount) {
    if (!amount || amount <= 0 || !hex || hex.charAt(0) !== '#' || hex.length !== 7) return hex;
    var t = Math.max(0, Math.min(1, amount));
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return '#' + toHex2(r + (lum - r) * t) + toHex2(g + (lum - g) * t) + toHex2(b + (lum - b) * t);
  }

  /* --- 3. Workout Exercise -> Primary & Secondary Muscle Catalogue --- */
  var WORKOUT_EXERCISES = [
    { id: 'incline_bench',   name: 'Incline Bench Press',    cat: 'CHEST',     primary: ['Chest_Upper'],                secondary: ['Front_Delts', 'Triceps'] },
    { id: 'flat_bench',      name: 'Bench Press / Push-ups', cat: 'CHEST',     primary: ['Chest_Mid'],                  secondary: ['Chest_Upper', 'Front_Delts', 'Triceps'] },
    { id: 'chest_dips',      name: 'Decline Press / Dips',   cat: 'CHEST',     primary: ['Chest_Lower'],                secondary: ['Chest_Mid', 'Triceps', 'Front_Delts'] },
    { id: 'overhead_press',  name: 'Overhead Shoulder Press',cat: 'SHOULDERS', primary: ['Front_Delts', 'Side_Delts'],  secondary: ['Triceps', 'Traps', 'Chest_Upper'] },
    { id: 'lateral_raises',  name: 'Lateral Raises',         cat: 'SHOULDERS', primary: ['Side_Delts'],                 secondary: ['Traps', 'Front_Delts'] },
    { id: 'face_pulls',      name: 'Face Pulls / Rear Fly',  cat: 'SHOULDERS', primary: ['Rear_Delts', 'Rhomboids'],    secondary: ['Traps'] },
    { id: 'shrugs',          name: 'Barbell Shrugs',         cat: 'BACK',      primary: ['Traps'],                      secondary: ['Forearms', 'Rhomboids'] },
    { id: 'pullups',         name: 'Pull-ups / Lat Pulldown',cat: 'BACK',      primary: ['Lats'],                       secondary: ['Biceps', 'Rhomboids', 'Rear_Delts', 'Forearms'] },
    { id: 'barbell_rows',    name: 'Barbell Rows',           cat: 'BACK',      primary: ['Rhomboids', 'Lats'],          secondary: ['Rear_Delts', 'Biceps', 'Lower_Back'] },
    { id: 'deadlift',        name: 'Deadlift',               cat: 'BACK',      primary: ['Lower_Back', 'Glutes', 'Hamstrings'], secondary: ['Traps', 'Lats', 'Forearms'] },
    { id: 'bicep_curls',     name: 'Barbell Bicep Curls',    cat: 'ARMS',      primary: ['Biceps'],                     secondary: ['Forearms'] },
    { id: 'tricep_pushdown', name: 'Tricep Pushdowns',       cat: 'ARMS',      primary: ['Triceps'],                    secondary: ['Forearms'] },
    { id: 'wrist_curls',     name: 'Wrist Curls / Carry',    cat: 'ARMS',      primary: ['Forearms'],                   secondary: ['Biceps'] },
    { id: 'situps',          name: 'Sit-ups / Crunches',     cat: 'CORE',      primary: ['Abs_Upper', 'Abs_Mid'],       secondary: ['Abs_Lower'] },
    { id: 'leg_raises',      name: 'Hanging Leg Raises',     cat: 'CORE',      primary: ['Abs_Lower'],                  secondary: ['Abs_Mid', 'Obliques', 'Forearms'] },
    { id: 'russian_twists',  name: 'Oblique Twists / Plank', cat: 'CORE',      primary: ['Obliques', 'Abs_Mid'],        secondary: ['Abs_Upper', 'Abs_Lower', 'Lower_Back'] },
    { id: 'squats',          name: 'Barbell / Body Squats',  cat: 'LEGS',      primary: ['Quads', 'Glutes'],            secondary: ['Hamstrings', 'Lower_Back', 'Calves'] },
    { id: 'rdl',             name: 'Romanian Deadlifts',     cat: 'LEGS',      primary: ['Hamstrings', 'Glutes'],       secondary: ['Lower_Back', 'Forearms'] },
    { id: 'hip_thrusts',     name: 'Hip Thrusts',            cat: 'LEGS',      primary: ['Glutes'],                     secondary: ['Hamstrings', 'Quads'] },
    { id: 'calf_raises',     name: 'Standing Calf Raises',   cat: 'LEGS',      primary: ['Calves'],                     secondary: [] },
    { id: 'burpees',         name: 'Burpees Conditioning',   cat: 'FULL BODY', primary: ['Chest_Mid', 'Quads', 'Abs_Mid'], secondary: ['Front_Delts', 'Triceps', 'Glutes', 'Calves'] }
  ];
  S.WORKOUT_EXERCISES = WORKOUT_EXERCISES;

  var KEYWORD_RULES = [
    { re: /incline/i,                                     primary: ['Chest_Upper'],                secondary: ['Front_Delts', 'Triceps'] },
    { re: /decline|dip/i,                                 primary: ['Chest_Lower'],                secondary: ['Chest_Mid', 'Triceps', 'Front_Delts'] },
    { re: /push[\s-]*up|bench|chest|pec|fly/i,            primary: ['Chest_Mid'],                  secondary: ['Chest_Upper', 'Front_Delts', 'Triceps'] },
    { re: /lateral\s*raise/i,                             primary: ['Side_Delts'],                 secondary: ['Traps'] },
    { re: /face\s*pull|rear\s*delt|reverse\s*fly/i,       primary: ['Rear_Delts', 'Rhomboids'],    secondary: ['Traps'] },
    { re: /overhead|shoulder\s*press|arnold|military/i,   primary: ['Front_Delts', 'Side_Delts'],  secondary: ['Triceps', 'Traps'] },
    { re: /shrug|trap/i,                                  primary: ['Traps'],                      secondary: ['Forearms'] },
    { re: /pull[\s-]*up|chin[\s-]*up|lat\s*pulldown/i,    primary: ['Lats'],                       secondary: ['Biceps', 'Rhomboids', 'Forearms'] },
    { re: /row/i,                                         primary: ['Rhomboids', 'Lats'],          secondary: ['Rear_Delts', 'Biceps'] },
    { re: /rdl|romanian|leg\s*curl|hamstring/i,           primary: ['Hamstrings'],                 secondary: ['Glutes', 'Lower_Back'] },
    { re: /deadlift|back\s*ext|hyperext/i,                primary: ['Lower_Back', 'Glutes', 'Hamstrings'], secondary: ['Traps', 'Forearms'] },
    { re: /bicep|curl/i,                                  primary: ['Biceps'],                     secondary: ['Forearms'] },
    { re: /tricep|skull|pushdown|extension/i,             primary: ['Triceps'],                    secondary: [] },
    { re: /forearm|wrist|grip|farmer/i,                   primary: ['Forearms'],                   secondary: ['Biceps'] },
    { re: /leg\s*raise|reverse\s*crunch/i,                primary: ['Abs_Lower'],                  secondary: ['Abs_Mid', 'Obliques'] },
    { re: /oblique|twist|side\s*plank|plank/i,            primary: ['Obliques', 'Abs_Mid'],        secondary: ['Abs_Upper', 'Lower_Back'] },
    { re: /sit[\s-]*up|crunch|core|ab/i,                  primary: ['Abs_Upper', 'Abs_Mid'],       secondary: ['Abs_Lower'] },
    { re: /hip\s*thrust|glute|bridge/i,                   primary: ['Glutes'],                     secondary: ['Hamstrings'] },
    { re: /calf|calves/i,                                 primary: ['Calves'],                     secondary: [] },
    { re: /squat|lunge|leg\s*press|quad/i,                primary: ['Quads', 'Glutes'],            secondary: ['Hamstrings', 'Calves'] },
    { re: /burpee|conditioning|circuit|jumping\s*jack/i,  primary: ['Chest_Mid', 'Quads', 'Abs_Mid'], secondary: ['Front_Delts', 'Triceps', 'Calves'] }
  ];

  S.inferAnatomyMuscles = function (quest) {
    if (!quest) return { primary: [], secondary: [] };
    if (quest.preset === 'pushups') return { primary: ['Chest_Mid'], secondary: ['Chest_Upper', 'Front_Delts', 'Triceps'] };
    if (quest.preset === 'situps')  return { primary: ['Abs_Upper', 'Abs_Mid'], secondary: ['Abs_Lower', 'Obliques'] };
    if (quest.preset === 'squats')  return { primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Calves'] };
    var title = String(quest.title || '');
    for (var i = 0; i < KEYWORD_RULES.length; i++) {
      if (KEYWORD_RULES[i].re.test(title)) {
        return {
          primary: KEYWORD_RULES[i].primary.slice(),
          secondary: KEYWORD_RULES[i].secondary.slice()
        };
      }
    }
    if (quest.category === 'CALISTHENICS' || quest.category === 'GYM' || quest.category === 'PENALTY') {
      return { primary: ['Chest_Mid', 'Quads'], secondary: ['Abs_Mid', 'Front_Delts'] };
    }
    return { primary: [], secondary: [] };
  };

  /* --- 4. Persistent State Manager --- */
  var MS_PER_DAY = 86400000;
  var lastAtrophyCheckTs = 0;
  var pendingAtrophyWarnings = [];

  function createEmptyMuscleRecord() {
    return {
      sets: 0,
      primarySets: 0,
      secondarySets: 0,
      lastTrainedAt: null,
      peakSets: 0,
      peakRank: 'DORMANT',
      peakStars: 0,
      lastDecayAt: null,
      dailyCredit: { date: '', sets: 0, warned: false }
    };
  }

  function createEmptyMuscles() {
    var out = {};
    ANATOMY_MUSCLES.forEach(function (m) {
      out[m.id] = createEmptyMuscleRecord();
    });
    return out;
  }

  function ensureMuscleRecordFields(rec) {
    if (!rec || typeof rec !== 'object') return createEmptyMuscleRecord();
    if (typeof rec.sets !== 'number' || isNaN(rec.sets)) rec.sets = Number(rec.sets) || 0;
    if (typeof rec.primarySets !== 'number' || isNaN(rec.primarySets)) rec.primarySets = Number(rec.primarySets) || 0;
    if (typeof rec.secondarySets !== 'number' || isNaN(rec.secondarySets)) rec.secondarySets = Number(rec.secondarySets) || 0;
    if (rec.lastTrainedAt === undefined) rec.lastTrainedAt = null;
    if (typeof rec.peakSets !== 'number' || isNaN(rec.peakSets)) rec.peakSets = Math.max(0, rec.sets);
    if (!rec.peakRank || !RANK_BY_KEY[rec.peakRank]) rec.peakRank = getRankForSets(rec.peakSets).key;
    if (typeof rec.peakStars !== 'number' || isNaN(rec.peakStars)) rec.peakStars = getStarsForSets(rec.peakSets);
    if (rec.lastDecayAt === undefined) rec.lastDecayAt = null;
    if (!rec.dailyCredit || typeof rec.dailyCredit !== 'object') {
      rec.dailyCredit = { date: '', sets: 0, warned: false };
    } else {
      if (typeof rec.dailyCredit.date !== 'string') rec.dailyCredit.date = '';
      if (typeof rec.dailyCredit.sets !== 'number' || isNaN(rec.dailyCredit.sets)) rec.dailyCredit.sets = 0;
      rec.dailyCredit.warned = Boolean(rec.dailyCredit.warned);
    }
    return rec;
  }

  function applyAtrophy(rec, nowTs) {
    if (!rec || !rec.lastTrainedAt || !(rec.sets > 0)) {
      return { changed: false, rankDropped: false };
    }
    var atrophyStartTs = rec.lastTrainedAt + ATROPHY_CONFIG.atrophyStartDays * MS_PER_DAY;
    if (nowTs < atrophyStartTs) {
      return { changed: false, rankDropped: false };
    }
    var refTs = Math.max(rec.lastDecayAt || 0, atrophyStartTs);
    var days = Math.floor((nowTs - refTs) / MS_PER_DAY);
    if (days <= 0) {
      return { changed: false, rankDropped: false };
    }

    var oldSets = rec.sets;
    var prevRank = getRankForSets(oldSets);
    var mult = ATROPHY_CONFIG.rankDecayMult[prevRank.key];
    if (typeof mult !== 'number') mult = 1.0;
    var rate = ATROPHY_CONFIG.baseDailyDecayRate * mult;
    var decayed = oldSets * Math.pow(1 - rate, days);

    var peakSets = Math.max(rec.peakSets || 0, oldSets);
    var peakFloor = peakSets * ATROPHY_CONFIG.floorPeakRatio;
    var everERank = peakSets >= ATROPHY_CONFIG.minRankFloorSets || (rec.peakRank && rec.peakRank !== 'DORMANT');
    var minFloor = everERank ? Math.max(ATROPHY_CONFIG.minRankFloorSets, peakFloor) : peakFloor;
    var newSets = Math.min(oldSets, Math.max(minFloor, Math.round(decayed * 100) / 100));
    newSets = Math.round(newSets * 100) / 100;

    rec.lastDecayAt = nowTs;
    if (newSets === oldSets) {
      return { changed: false, rankDropped: false };
    }

    var ratio = oldSets > 0 ? (newSets / oldSets) : 1;
    rec.sets = newSets;
    rec.primarySets = Math.round((rec.primarySets || 0) * ratio * 100) / 100;
    rec.secondarySets = Math.round((rec.secondarySets || 0) * ratio * 100) / 100;

    var newRank = getRankForSets(newSets);
    var peakRankObj = RANK_BY_KEY[rec.peakRank] || getRankForSets(peakSets);
    return {
      changed: true,
      rankDropped: newRank.index < prevRank.index,
      fromRank: prevRank,
      toRank: newRank,
      peakRank: peakRankObj
    };
  }

  function flushAtrophyWarnings() {
    if (!pendingAtrophyWarnings.length) return;
    if (!S.ui || typeof S.ui.showToast !== 'function') return;
    var msg;
    if (pendingAtrophyWarnings.length === 1) {
      var w = pendingAtrophyWarnings[0];
      msg = w.name + ' has atrophied to ' + w.toRank.rank + '. Muscle memory active: 2\u00d7 growth until you reclaim ' + w.peakRank.rank + '.';
    } else {
      msg = pendingAtrophyWarnings.map(function (w) {
        return w.name + ' \u2192 ' + w.toRank.rank + ' (Peak ' + w.peakRank.rank + ')';
      }).join(', ') + '. Muscle memory active: 2\u00d7 growth to reclaim your peaks.';
    }
    pendingAtrophyWarnings = [];
    S.ui.showToast('[SYSTEM WARNING]', msg, 'info');
  }

  S.ensureAnatomyTracker = function () {
    if (!S.state) S.state = {};
    var nowTs = Date.now();
    var t = S.state.anatomyTracker;
    if (!t || typeof t !== 'object') {
      t = S.state.anatomyTracker = {
        muscles: createEmptyMuscles(),
        workoutHistory: [],
        questCredits: {},
        selectedMuscle: null,
        trophyVersion: TROPHY_VERSION,
        updatedAt: nowTs
      };
    }
    if (!t.muscles || typeof t.muscles !== 'object') t.muscles = createEmptyMuscles();
    ANATOMY_MUSCLES.forEach(function (m) {
      if (!t.muscles[m.id]) {
        t.muscles[m.id] = createEmptyMuscleRecord();
      } else {
        t.muscles[m.id] = ensureMuscleRecordFields(t.muscles[m.id]);
      }
    });
    if (!Array.isArray(t.workoutHistory)) t.workoutHistory = [];
    if (!t.questCredits || typeof t.questCredits !== 'object') t.questCredits = {};
    if (t.selectedMuscle && !MUSCLE_MAP[t.selectedMuscle]) t.selectedMuscle = null;

    // One-time silent migration from v1 ranks to Trophy v2
    if (t.trophyVersion !== TROPHY_VERSION) {
      ANATOMY_MUSCLES.forEach(function (m) {
        var rec = t.muscles[m.id];
        var setsVal = Math.max(0, Number(rec.sets) || 0);
        var r = getRankForSets(setsVal);
        rec.peakSets = setsVal;
        rec.peakRank = r.key;
        rec.peakStars = getStarsForSets(setsVal);
        rec.lastDecayAt = nowTs;
      });
      t.trophyVersion = TROPHY_VERSION;
      lastAtrophyCheckTs = nowTs;
      if (S.save) S.save();
      return t;
    }

    // Lazy atrophy check (throttled across 1s UI ticks, immediate on day jumps)
    if (!lastAtrophyCheckTs || Math.abs(nowTs - lastAtrophyCheckTs) >= 60000) {
      lastAtrophyCheckTs = nowTs;
      var anyChanged = false;
      ANATOMY_MUSCLES.forEach(function (m) {
        var rec = t.muscles[m.id];
        var res = applyAtrophy(rec, nowTs);
        if (res.changed) anyChanged = true;
        if (res.rankDropped) {
          pendingAtrophyWarnings.push({
            id: m.id,
            name: m.name,
            toRank: res.toRank,
            peakRank: res.peakRank
          });
        }
      });
      if (anyChanged && S.save) S.save();
    }

    flushAtrophyWarnings();
    return t;
  };

  function computeRecoveryPct(rec) {
    if (!rec || !rec.sets || rec.sets <= 0) return 100;
    var hours = 0;
    if (rec.lastTrainedAt) {
      hours = Math.max(0, (Date.now() - rec.lastTrainedAt) / 3600000);
    }
    // Fatigue drops with logged sets and recovers ~2.2% per hour
    var pct = Math.round(100 - rec.sets * 5.2 + hours * 2.2);
    return Math.max(15, Math.min(100, pct));
  }

  S.getMuscleStatus = function (muscleId) {
    var t = S.ensureAnatomyTracker();
    var def = MUSCLE_MAP[muscleId] || ANATOMY_MUSCLES[0];
    var rec = t.muscles[def.id] || createEmptyMuscleRecord();
    var sets = Math.round((rec.sets || 0) * 10) / 10;
    var rank = getRankForSets(sets);
    var stars = getStarsForSets(sets);
    var recoveryPct = computeRecoveryPct(rec);

    var peakSets = Math.round((rec.peakSets || sets) * 10) / 10;
    var peakRank = RANK_BY_KEY[rec.peakRank] || getRankForSets(peakSets);
    var peakStars = rec.peakStars || 0;

    var daysUntrained = (rec.lastTrainedAt && sets > 0)
      ? Math.max(0, Math.floor((Date.now() - rec.lastTrainedAt) / MS_PER_DAY))
      : 0;
    var condition = 'active';
    var fadingDaysLeft = 0;
    var desaturation = 0;
    if (rec.lastTrainedAt && sets > 0) {
      if (daysUntrained >= ATROPHY_CONFIG.atrophyStartDays) {
        condition = 'atrophy';
        desaturation = Math.min(
          ATROPHY_CONFIG.maxAtrophyDesat,
          Math.round((ATROPHY_CONFIG.maxFadingDesat + (daysUntrained - 20) * ATROPHY_CONFIG.atrophyDesatPerDay) * 1000) / 1000
        );
      } else if (daysUntrained >= ATROPHY_CONFIG.fadingStartDays) {
        condition = 'fading';
        fadingDaysLeft = Math.max(1, ATROPHY_CONFIG.atrophyStartDays - daysUntrained);
        desaturation = Math.round(((daysUntrained - 13) / 7) * ATROPHY_CONFIG.maxFadingDesat * 1000) / 1000;
      }
    }

    var nextRank = null;
    var nextRankObj = null;
    var curThreshold = rank.minSets;
    var nextThreshold = rank.minSets;
    var progressPct = 100;
    var setsToNext = 0;

    if (rank.key !== 'S') {
      var nextTier = MUSCLE_RANKS[rank.index + 1];
      nextRank = nextTier.rank;
      nextRankObj = nextTier;
      nextThreshold = nextTier.minSets;
      var span = Math.max(1, nextThreshold - curThreshold);
      progressPct = Math.min(100, Math.max(0, Math.round(((sets - curThreshold) / span) * 100)));
      setsToNext = Math.max(0, Math.round((nextThreshold - sets) * 10) / 10);
    } else if (stars < ATROPHY_CONFIG.maxStars) {
      curThreshold = RANK_THRESHOLDS.S + stars * ATROPHY_CONFIG.starStepSets;
      nextThreshold = curThreshold + ATROPHY_CONFIG.starStepSets;
      nextRank = 'S ' + repeatStars(stars + 1);
      nextRankObj = rank;
      progressPct = Math.min(100, Math.max(0, Math.round(((sets - curThreshold) / ATROPHY_CONFIG.starStepSets) * 100)));
      setsToNext = Math.max(0, Math.round((nextThreshold - sets) * 10) / 10);
    }

    var nearBreakthrough = Boolean(nextRank && progressPct >= 80 && condition === 'active');
    var memoryActive = sets < (rec.peakSets || 0);

    return {
      id: def.id,
      name: def.name,
      group: def.group,
      side: def.side,
      sets: sets,
      primarySets: Math.round((rec.primarySets || 0) * 10) / 10,
      secondarySets: Math.round((rec.secondarySets || 0) * 10) / 10,
      lastTrainedAt: rec.lastTrainedAt,
      rank: rank,
      recoveryPct: recoveryPct,
      title: rank.title,
      stars: stars,
      nextRank: nextRank,
      nextRankObj: nextRankObj,
      curThreshold: curThreshold,
      nextThreshold: nextThreshold,
      progressPct: progressPct,
      setsToNext: setsToNext,
      nearBreakthrough: nearBreakthrough,
      peakSets: peakSets,
      peakRank: peakRank,
      peakStars: peakStars,
      condition: condition,
      fadingDaysLeft: fadingDaysLeft,
      daysUntrained: daysUntrained,
      desaturation: desaturation,
      memoryActive: memoryActive
    };
  };

  function creditMuscle(id, delta, isPrimary, nowTs, opts) {
    var t = S.ensureAnatomyTracker();
    var rec = t.muscles[id];
    if (!rec) return null;
    var silent = Boolean(opts && opts.silent);

    if (delta < 0) {
      rec.sets = Math.max(0, Math.round((rec.sets + delta) * 100) / 100);
      if (isPrimary) rec.primarySets = Math.max(0, Math.round((rec.primarySets + delta) * 100) / 100);
      else rec.secondarySets = Math.max(0, Math.round((rec.secondarySets + delta) * 100) / 100);
      var curDay = getLocalDateKey(nowTs);
      if (rec.dailyCredit && rec.dailyCredit.date === curDay) {
        rec.dailyCredit.sets = Math.max(0, Math.round((rec.dailyCredit.sets + delta) * 100) / 100);
      }
      if (rec.sets === 0) rec.lastTrainedAt = null;
      return null;
    }

    if (delta === 0) return null;

    var atrophyRes = applyAtrophy(rec, nowTs);
    if (atrophyRes.rankDropped && !silent) {
      pendingAtrophyWarnings.push({
        id: id,
        name: MUSCLE_MAP[id] ? MUSCLE_MAP[id].name : id,
        toRank: atrophyRes.toRank,
        peakRank: atrophyRes.peakRank
      });
      flushAtrophyWarnings();
    }

    var beforeRank = getRankForSets(rec.sets);
    var beforeStars = getStarsForSets(rec.sets);
    var prevPeakRankObj = RANK_BY_KEY[rec.peakRank] || getRankForSets(rec.peakSets || rec.sets);
    var prevPeakRankIdx = prevPeakRankObj.index;
    var prevPeakStars = rec.peakStars || 0;

    var todayKey = getLocalDateKey(nowTs);
    if (!rec.dailyCredit || rec.dailyCredit.date !== todayKey) {
      rec.dailyCredit = { date: todayKey, sets: 0, warned: false };
    }
    var remainingCap = Math.max(0, ATROPHY_CONFIG.dailySetCap - rec.dailyCredit.sets);
    var raw = Math.min(delta, remainingCap);
    if (raw < delta && !rec.dailyCredit.warned) {
      rec.dailyCredit.warned = true;
      if (!silent && S.ui && typeof S.ui.showToast === 'function') {
        var mName = MUSCLE_MAP[id] ? MUSCLE_MAP[id].name : id;
        S.ui.showToast('[SYSTEM]', mName + " has reached today's growth limit. Recover and return stronger.", 'info');
      }
    }
    rec.dailyCredit.sets = Math.round((rec.dailyCredit.sets + raw) * 100) / 100;
    rec.lastTrainedAt = nowTs;
    rec.lastDecayAt = nowTs;

    if (raw <= 0) return null;

    var peakSets = rec.peakSets || 0;
    var headroom = Math.max(0, peakSets - rec.sets);
    var memoryRaw = Math.min(raw, headroom / ATROPHY_CONFIG.memoryMultiplier);
    var effective = Math.round((memoryRaw * ATROPHY_CONFIG.memoryMultiplier + (raw - memoryRaw)) * 100) / 100;

    rec.sets = Math.round((rec.sets + effective) * 100) / 100;
    if (isPrimary) rec.primarySets = Math.round((rec.primarySets + effective) * 100) / 100;
    else rec.secondarySets = Math.round((rec.secondarySets + effective) * 100) / 100;

    var afterRank = getRankForSets(rec.sets);
    var afterStars = getStarsForSets(rec.sets);
    if (rec.sets > peakSets) rec.peakSets = rec.sets;
    var isNewAllTimePeak = (afterRank.index > prevPeakRankIdx) || (afterRank.index === prevPeakRankIdx && afterStars > prevPeakStars);
    if (afterRank.index > prevPeakRankIdx) rec.peakRank = afterRank.key;
    if (afterStars > prevPeakStars) rec.peakStars = afterStars;

    if (afterRank.index > beforeRank.index || (afterRank.key === 'S' && afterStars > beforeStars)) {
      return {
        id: id,
        name: MUSCLE_MAP[id] ? MUSCLE_MAP[id].name : id,
        rank: afterRank,
        stars: afterStars,
        reclaimed: !isNewAllTimePeak
      };
    }
    return null;
  }

  function handleRankUpBatch(events, silent) {
    if (silent || !events || !events.length) return;
    if (S.save) S.save();
    if (S.audio && typeof S.audio.rankUp === 'function') {
      try { S.audio.rankUp(); } catch (e) {}
    }

    var hasNewPeak = events.some(function (ev) { return !ev.reclaimed; });
    var toastTitle = hasNewPeak ? '[MUSCLE AWAKENED]' : '[RANK RECLAIMED]';
    var toastBody;
    if (events.length === 1) {
      var ev = events[0];
      toastBody = ev.name + ' \u2192 ' + ev.rank.badge + formatStars(ev.stars) + ' \u00b7 ' + ev.rank.title;
    } else {
      toastBody = events.map(function (e) {
        return e.name + ' \u2192 ' + e.rank.rank + formatStars(e.stars);
      }).join(', ');
    }
    if (S.ui && typeof S.ui.showToast === 'function') {
      S.ui.showToast(toastTitle, toastBody, 'gold');
    }

    var best = events[0];
    for (var i = 1; i < events.length; i++) {
      var cur = events[i];
      if (cur.rank.index > best.rank.index || (cur.rank.index === best.rank.index && cur.stars > best.stars)) {
        best = cur;
      }
    }
    if (best) {
      var nowPerf = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      threeCtx.flashMap[best.id] = { startTs: nowPerf, duration: 1500 };
      if (typeof document !== 'undefined' && document.getElementById('bodystatus-canvas-mount')) {
        selectMuscle(best.id, false);
      }
    }
  }

  S.logWorkoutExercise = function (exerciseIdOrObj, setsCount) {
    var t = S.ensureAnatomyTracker();
    var ex = typeof exerciseIdOrObj === 'string'
      ? WORKOUT_EXERCISES.find(function (e) { return e.id === exerciseIdOrObj; })
      : exerciseIdOrObj;
    if (!ex) return false;
    var sets = Math.max(1, Math.min(20, Number(setsCount) || 3));
    var nowTs = Date.now();
    var rankEvents = [];

    (ex.primary || []).forEach(function (mId) {
      var ev = creditMuscle(mId, sets, true, nowTs, { silent: false });
      if (ev) rankEvents.push(ev);
    });
    (ex.secondary || []).forEach(function (mId) {
      var ev = creditMuscle(mId, sets * 0.5, false, nowTs, { silent: false });
      if (ev) rankEvents.push(ev);
    });

    t.workoutHistory.unshift({
      id: 'wk_' + nowTs + '_' + Math.floor(Math.random() * 1000),
      exerciseId: ex.id || 'custom',
      exerciseName: ex.name || 'Training Set',
      sets: sets,
      primary: (ex.primary || []).slice(),
      secondary: (ex.secondary || []).slice(),
      timestamp: nowTs
    });
    if (t.workoutHistory.length > 40) t.workoutHistory.length = 40;
    if (ex.primary && ex.primary[0] && MUSCLE_MAP[ex.primary[0]]) {
      t.selectedMuscle = ex.primary[0];
    }
    t.updatedAt = nowTs;

    if (S.applyMuscleColorsTo3D) S.applyMuscleColorsTo3D();
    handleRankUpBatch(rankEvents, false);
    if (S.save) S.save();
    updateHudWindowDOM();
    updateSidePanelsDOM();
    return true;
  };

  S.adjustMuscleSets = function (muscleId, delta) {
    var t = S.ensureAnatomyTracker();
    if (!MUSCLE_MAP[muscleId]) return;
    var rankEvents = [];
    var ev = creditMuscle(muscleId, delta, true, Date.now(), { silent: false });
    if (ev) rankEvents.push(ev);
    t.selectedMuscle = muscleId;
    t.updatedAt = Date.now();
    if (S.applyMuscleColorsTo3D) S.applyMuscleColorsTo3D();
    handleRankUpBatch(rankEvents, false);
    if (S.save) S.save();
    updateHudWindowDOM();
    updateSidePanelsDOM();
  };

  S.resetAnatomyTracker = function () {
    var t = S.ensureAnatomyTracker();
    t.muscles = createEmptyMuscles();
    t.workoutHistory = [];
    t.questCredits = {};
    t.trophyVersion = TROPHY_VERSION;
    t.updatedAt = Date.now();
    lastAtrophyCheckTs = 0;
    pendingAtrophyWarnings = [];
    threeCtx.flashMap = {};
    if (S.applyMuscleColorsTo3D) S.applyMuscleColorsTo3D();
    if (S.save) S.save();
    updateHudWindowDOM();
    updateSidePanelsDOM();
  };

  /* Hook called from js/engine.js when quests gain progress or reset */
  S.syncQuestMuscleCredit = function (quest, silent) {
    if (!quest) return;
    var cat = S.CATS && S.CATS[quest.category];
    if (!cat || !cat.physical) return;
    var mapping = S.inferAnatomyMuscles(quest);
    if (!mapping.primary.length && !mapping.secondary.length) return;

    var t = S.ensureAnatomyTracker();
    var dateKey = quest.createdDate || (S.state && S.state.currentDate) || 'today';
    var key = quest.id + '_' + dateKey;
    var prev = t.questCredits[key] || 0;

    // Convert quest progress ratio into equivalent sets scaled by difficulty/unit
    var diffScale = { E: 3, D: 4, C: 5, B: 6, A: 8, S: 10 };
    var target = Math.max(1, Number(quest.targetProgress) || 1);
    var prog = Math.max(0, Math.min(target, Number(quest.currentProgress) || 0));
    var targetSets = quest.unit === 'SETS'
      ? Math.min(14, target)
      : (diffScale[quest.difficulty] || 4);
    var nowSets = quest.isCompleted ? targetSets : Math.round((prog / target) * targetSets * 100) / 100;
    var delta = Math.round((nowSets - prev) * 100) / 100;
    if (Math.abs(delta) < 0.05) return;

    var nowTs = Date.now();
    var rankEvents = [];
    mapping.primary.forEach(function (mId) {
      var ev = creditMuscle(mId, delta, true, nowTs, { silent: Boolean(silent) });
      if (ev) rankEvents.push(ev);
    });
    mapping.secondary.forEach(function (mId) {
      var ev = creditMuscle(mId, delta * 0.5, false, nowTs, { silent: Boolean(silent) });
      if (ev) rankEvents.push(ev);
    });
    t.questCredits[key] = nowSets;
    t.updatedAt = nowTs;

    // Upsert quest activation in workoutHistory so recent activations reflect quests automatically
    var histIdx = t.workoutHistory.findIndex(function (h) { return h.questKey === key; });
    if (nowSets > 0) {
      var entry = {
        id: 'qwk_' + key,
        questKey: key,
        exerciseId: quest.preset || 'quest',
        exerciseName: quest.title + (quest.isCompleted ? ' [CLEAR]' : ' (' + prog + '/' + target + ')'),
        sets: Math.round(nowSets * 10) / 10,
        primary: mapping.primary.slice(),
        secondary: mapping.secondary.slice(),
        timestamp: nowTs
      };
      if (histIdx >= 0) t.workoutHistory[histIdx] = entry;
      else t.workoutHistory.unshift(entry);
      if (t.workoutHistory.length > 40) t.workoutHistory.length = 40;
    } else if (histIdx >= 0) {
      t.workoutHistory.splice(histIdx, 1);
    }

    if (S.applyMuscleColorsTo3D) S.applyMuscleColorsTo3D();
    handleRankUpBatch(rankEvents, Boolean(silent));
    if (!silent) {
      updateHudWindowDOM();
      updateSidePanelsDOM();
    }
  };

  /* Sync every physical quest currently in S.state.quests (catches already-completed or synced quests) */
  S.syncAllQuestsToBody = function () {
    if (!S.state || !Array.isArray(S.state.quests)) return;
    S.ensureAnatomyTracker();
    S.state.quests.forEach(function (q) {
      if (q && (q.currentProgress > 0 || q.isCompleted)) {
        S.syncQuestMuscleCredit(q, true);
      }
    });
    if (S.applyMuscleColorsTo3D) S.applyMuscleColorsTo3D();
  };

  /* --- 5. Persistent Three.js 3D Viewport & Recoloring Engine --- */
  var threeCtx = {
    initialized: false,
    loading: false,
    loaded: false,
    error: null,
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    modelRoot: null,
    muscleMeshes: {},
    rimMesh: null,
    raycaster: null,
    rafId: null,
    // Spherical orbit camera
    targetTheta: 0.25,
    currentTheta: 0.25,
    targetPhi: 1.48,
    currentPhi: 1.48,
    targetRadius: 2.55,
    currentRadius: 2.55,
    lookTarget: null,
    // Interaction state
    isDragging: false,
    pointerDownPos: { x: 0, y: 0 },
    lastPointerPos: { x: 0, y: 0 },
    pinchDist: 0,
    pulsePhase: 0,
    animTime: 0,
    lastFrameTs: 0,
    animList: [],
    flashMap: {},
    resizeObserver: null
  };

  function ensureThreeCtx() {
    if (threeCtx.initialized) return true;
    if (!window.THREE || !THREE.GLTFLoader) return false;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070B14);

    var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
    threeCtx.lookTarget = new THREE.Vector3(0, 0.94, 0);

    var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';

    // Solo Leveling System Studio Lighting (sculptural contrast for muscle tone)
    var hemi = new THREE.HemisphereLight(0x9bc4ff, 0x050811, 0.68);
    scene.add(hemi);

    var topSculpt = new THREE.DirectionalLight(0xffffff, 1.45);
    topSculpt.position.set(0.35, 4.4, 1.6);
    scene.add(topSculpt);

    var keyLight = new THREE.DirectionalLight(0xeef6ff, 1.25);
    keyLight.position.set(2.2, 2.8, 2.5);
    scene.add(keyLight);

    var backKey = new THREE.DirectionalLight(0xdbeafe, 1.15);
    backKey.position.set(-1.6, 3.0, -2.6);
    scene.add(backKey);

    var cyanRimL = new THREE.DirectionalLight(0x00e5ff, 1.05);
    cyanRimL.position.set(-3.0, 1.6, 0.4);
    scene.add(cyanRimL);

    var cobaltRimR = new THREE.DirectionalLight(0x2979ff, 0.85);
    cobaltRimR.position.set(3.0, 1.4, -0.4);
    scene.add(cobaltRimR);

    // Subtle Holographic Floor Grid & Scanner Rings at Y=0
    var grid = new THREE.GridHelper(3.4, 22, 0x00e5ff, 0x0e2a45);
    grid.position.y = 0.001;
    if (Array.isArray(grid.material)) {
      grid.material.forEach(function (m) { m.transparent = true; m.opacity = 0.22; });
    } else {
      grid.material.transparent = true;
      grid.material.opacity = 0.22;
    }
    scene.add(grid);

    var ringGeo1 = new THREE.RingGeometry(0.56, 0.585, 72);
    ringGeo1.rotateX(-Math.PI / 2);
    var ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.42, side: THREE.DoubleSide });
    var ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.position.y = 0.003;
    scene.add(ring1);

    var ringGeo2 = new THREE.RingGeometry(0.76, 0.775, 72);
    ringGeo2.rotateX(-Math.PI / 2);
    var ringMat2 = new THREE.MeshBasicMaterial({ color: 0x2979ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
    var ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.position.y = 0.002;
    scene.add(ring2);

    // Hologram rim outline helper mesh (clones geometry of selected muscle)
    var rimMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var rimMesh = new THREE.Mesh(new THREE.BufferGeometry(), rimMat);
    rimMesh.visible = false;
    rimMesh.renderOrder = 2;
    scene.add(rimMesh);

    threeCtx.scene = scene;
    threeCtx.camera = camera;
    threeCtx.renderer = renderer;
    threeCtx.rimMesh = rimMesh;
    threeCtx.raycaster = new THREE.Raycaster();
    threeCtx.initialized = true;

    bindViewportInteractions(renderer.domElement);
    loadHunterModel();
    return true;
  }

  function loadHunterModel() {
    if (threeCtx.loading || threeCtx.loaded) return;
    threeCtx.loading = true;
    var loader = new THREE.GLTFLoader();
    loader.load(
      'assets/models/hunter_anatomy.glb?v=3.49',
      function (gltf) {
        threeCtx.loading = false;
        threeCtx.loaded = true;
        var root = gltf.scene;
        threeCtx.modelRoot = root;

        // Ground & center safety check
        var box = new THREE.Box3().setFromObject(root);
        var size = new THREE.Vector3();
        var center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        root.position.x -= center.x;
        root.position.z -= center.z;
        root.position.y -= box.min.y;
        threeCtx.lookTarget.set(0, size.y * 0.51, 0);

        root.traverse(function (obj) {
          if (!obj.isMesh) return;
          var name = obj.name || '';
          if (MUSCLE_MAP[name]) {
            // Ensure unique independent material per muscle
            obj.material = new THREE.MeshStandardMaterial({
              name: 'Mat_' + name,
              color: new THREE.Color(0x111622),
              metalness: 0.62,
              roughness: 0.25,
              emissive: new THREE.Color(0x000000),
              emissiveIntensity: 0.0
            });
            threeCtx.muscleMeshes[name] = obj;
          } else if (name === 'Head_Shadow') {
            obj.material = new THREE.MeshBasicMaterial({
              name: 'Mat_Head_Shadow',
              color: new THREE.Color(0x030407)
            });
          } else if (name === 'Eyes_Glow') {
            obj.material = new THREE.MeshStandardMaterial({
              name: 'Mat_Eyes_Glow',
              color: new THREE.Color(0x00e5ff),
              emissive: new THREE.Color(0x00e5ff),
              emissiveIntensity: 4.0,
              roughness: 0.1,
              metalness: 0.0,
              side: THREE.DoubleSide,
              toneMapped: false
            });
          } else if (name === 'Body_Core') {
            obj.material = new THREE.MeshStandardMaterial({
              name: 'Mat_Body_Shell',
              color: new THREE.Color(0x04060b),
              roughness: 0.45,
              metalness: 0.25
            });
          }
        });

        threeCtx.scene.add(root);
        if (S.syncAllQuestsToBody) S.syncAllQuestsToBody();
        S.applyMuscleColorsTo3D();
        updateSelectionRim();

        var loaderBadge = document.getElementById('bodystatus-loading-overlay');
        if (loaderBadge) loaderBadge.classList.add('hidden');
      },
      null,
      function (err) {
        threeCtx.loading = false;
        threeCtx.error = err ? err.message : 'Failed to load 3D model';
        console.error('[BodyStatus GLB Load Error]', err);
        var loaderBadge = document.getElementById('bodystatus-loading-overlay');
        if (loaderBadge) {
          loaderBadge.innerHTML = '<div class="font-mono text-danger">[MODEL LOAD ERROR] ' + U.esc(threeCtx.error) + '</div>';
        }
      }
    );
  }

  /* Push muscle colors, physical finishes, desaturation & animation state to Three.js materials */
  S.applyMuscleColorsTo3D = function () {
    if (!threeCtx.loaded) return;
    var t = S.ensureAnatomyTracker();
    var nextAnimList = [];

    ANATOMY_MUSCLES.forEach(function (def) {
      var mesh = threeCtx.muscleMeshes[def.id];
      if (!mesh || !mesh.material) return;
      var st = S.getMuscleStatus(def.id);
      var r = st.rank;

      var colorHex = desaturateHex(r.color, st.desaturation);
      var emissiveHex = desaturateHex(r.emissive, st.desaturation);
      var baseEmissive = (r.emissiveIntensity + (r.key === 'S' ? st.stars * 0.10 : 0)) * (1 - st.desaturation);

      mesh.material.color.set(colorHex);
      mesh.material.roughness = r.roughness;
      mesh.material.metalness = r.metalness;

      if (st.nearBreakthrough && r.key === 'DORMANT') {
        mesh.material.emissive.set(MUSCLE_RANKS[1].emissive);
        baseEmissive = 0.08;
      } else if (t.selectedMuscle === def.id && r.key === 'DORMANT') {
        mesh.material.emissive.set('#00E5FF');
        baseEmissive = 0.22;
      } else {
        mesh.material.emissive.set(emissiveHex);
      }

      if (!threeCtx.flashMap[def.id]) {
        mesh.material.emissiveIntensity = baseEmissive;
      }

      var mode = 'none';
      if (st.condition === 'active') {
        if (r.key === 'S') mode = 's_aura';
        else if (st.nearBreakthrough) mode = 'shimmer';
      }

      nextAnimList.push({
        id: def.id,
        mesh: mesh,
        baseIntensity: baseEmissive,
        mode: mode,
        stars: st.stars
      });
    });

    threeCtx.animList = nextAnimList;
  };

  function updateSelectionRim() {
    if (!threeCtx.rimMesh || !threeCtx.loaded) return;
    var t = S.ensureAnatomyTracker();
    var selMesh = threeCtx.muscleMeshes[t.selectedMuscle];
    if (!selMesh) {
      threeCtx.rimMesh.visible = false;
      return;
    }

    // Build extruded hologram rim shell along vertex normals
    var srcGeo = selMesh.geometry;
    var posAttr = srcGeo.attributes.position;
    var normAttr = srcGeo.attributes.normal;
    if (!posAttr || !normAttr) {
      threeCtx.rimMesh.visible = false;
      return;
    }
    var rimGeo = srcGeo.clone();
    var rimPos = rimGeo.attributes.position;
    for (var i = 0; i < rimPos.count; i++) {
      rimPos.setXYZ(
        i,
        posAttr.getX(i) + normAttr.getX(i) * 0.0045,
        posAttr.getY(i) + normAttr.getY(i) * 0.0045,
        posAttr.getZ(i) + normAttr.getZ(i) * 0.0045
      );
    }
    rimPos.needsUpdate = true;

    if (threeCtx.rimMesh.geometry) threeCtx.rimMesh.geometry.dispose();
    threeCtx.rimMesh.geometry = rimGeo;
    selMesh.updateWorldMatrix(true, false);
    threeCtx.rimMesh.position.setFromMatrixPosition(selMesh.matrixWorld);
    threeCtx.rimMesh.quaternion.setFromRotationMatrix(selMesh.matrixWorld);
    threeCtx.rimMesh.scale.setFromMatrixScale(selMesh.matrixWorld);
    threeCtx.rimMesh.visible = true;
    S.applyMuscleColorsTo3D();
  }

  function bindViewportInteractions(dom) {
    var activePointers = {};

    function getPinchDistance() {
      var keys = Object.keys(activePointers);
      if (keys.length < 2) return 0;
      var p1 = activePointers[keys[0]];
      var p2 = activePointers[keys[1]];
      var dx = p1.x - p2.x;
      var dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    dom.addEventListener('pointerdown', function (e) {
      activePointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (dom.setPointerCapture) {
        try { dom.setPointerCapture(e.pointerId); } catch (err) {}
      }
      var count = Object.keys(activePointers).length;
      if (count === 1) {
        threeCtx.isDragging = true;
        threeCtx.pointerDownPos = { x: e.clientX, y: e.clientY };
        threeCtx.lastPointerPos = { x: e.clientX, y: e.clientY };
        dom.style.cursor = 'grabbing';
      } else if (count === 2) {
        threeCtx.isDragging = false;
        threeCtx.pinchDist = getPinchDistance();
      }
    });

    dom.addEventListener('pointermove', function (e) {
      if (!activePointers[e.pointerId]) return;
      activePointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var count = Object.keys(activePointers).length;
      if (count >= 2) {
        var newDist = getPinchDistance();
        if (threeCtx.pinchDist > 0 && newDist > 0) {
          var delta = (threeCtx.pinchDist - newDist) * 0.008;
          threeCtx.targetRadius = Math.max(1.25, Math.min(3.8, threeCtx.targetRadius + delta));
        }
        threeCtx.pinchDist = newDist;
        return;
      }
      if (!threeCtx.isDragging) return;
      var dx = e.clientX - threeCtx.lastPointerPos.x;
      var dy = e.clientY - threeCtx.lastPointerPos.y;
      threeCtx.lastPointerPos = { x: e.clientX, y: e.clientY };
      threeCtx.targetTheta -= dx * 0.011;
      threeCtx.targetPhi = Math.max(0.42, Math.min(2.45, threeCtx.targetPhi - dy * 0.008));
    });

    function onPointerUp(e) {
      var wasSingle = Object.keys(activePointers).length === 1;
      delete activePointers[e.pointerId];
      if (Object.keys(activePointers).length < 2) threeCtx.pinchDist = 0;

      if (wasSingle && threeCtx.isDragging) {
        threeCtx.isDragging = false;
        dom.style.cursor = 'grab';
        var distMoved = Math.hypot(
          e.clientX - threeCtx.pointerDownPos.x,
          e.clientY - threeCtx.pointerDownPos.y
        );
        if (distMoved < 6) {
          handleTapSelect(e.clientX, e.clientY, dom);
        }
      }
    }

    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);

    dom.addEventListener('wheel', function (e) {
      e.preventDefault();
      threeCtx.targetRadius = Math.max(1.25, Math.min(3.8, threeCtx.targetRadius + e.deltaY * 0.0018));
    }, { passive: false });
  }

  function handleTapSelect(clientX, clientY, dom) {
    if (!threeCtx.loaded || !threeCtx.raycaster) return;
    var rect = dom.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    var ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    threeCtx.raycaster.setFromCamera(ndc, threeCtx.camera);

    var targets = Object.keys(threeCtx.muscleMeshes).map(function (k) {
      return threeCtx.muscleMeshes[k];
    });
    var hits = threeCtx.raycaster.intersectObjects(targets, false);
    if (hits && hits.length > 0) {
      var hitName = hits[0].object.name;
      if (MUSCLE_MAP[hitName]) {
        selectMuscle(hitName, true);
      }
    }
  }

  function selectMuscle(muscleId, playSound) {
    if (!MUSCLE_MAP[muscleId]) return;
    var t = S.ensureAnatomyTracker();
    t.selectedMuscle = muscleId;
    if (playSound && S.audio) {
      try { S.audio.tap(); } catch (e) {}
    }
    updateSelectionRim();
    updateHudWindowDOM(true);
    updateSidePanelsDOM();
  }

  function getResponsiveRadius(baseRadius) {
    var aspect = threeCtx.camera ? threeCtx.camera.aspect : 1;
    if (aspect < 0.95) {
      return baseRadius * (1 + (0.95 - aspect) * 0.55);
    }
    return baseRadius;
  }

  function snapCamera(preset) {
    if (S.audio) {
      try { S.audio.tap(); } catch (e) {}
    }
    // Shortest angular path modulo 2*PI
    function nearestAngle(target) {
      var cur = threeCtx.targetTheta;
      var twoPi = Math.PI * 2;
      var diff = ((target - cur + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
      return cur + diff;
    }
    var rSnap = getResponsiveRadius(2.45);
    switch (preset) {
      case 'FRONT':
        threeCtx.targetTheta = nearestAngle(0);
        threeCtx.targetPhi = Math.PI / 2;
        threeCtx.targetRadius = rSnap;
        break;
      case 'BACK':
        threeCtx.targetTheta = nearestAngle(Math.PI);
        threeCtx.targetPhi = Math.PI / 2;
        threeCtx.targetRadius = rSnap;
        break;
      case 'LEFT':
        threeCtx.targetTheta = nearestAngle(-Math.PI / 2);
        threeCtx.targetPhi = Math.PI / 2;
        threeCtx.targetRadius = rSnap;
        break;
      case 'RIGHT':
        threeCtx.targetTheta = nearestAngle(Math.PI / 2);
        threeCtx.targetPhi = Math.PI / 2;
        threeCtx.targetRadius = rSnap;
        break;
      case 'RESET':
      default:
        threeCtx.targetTheta = nearestAngle(0.25);
        threeCtx.targetPhi = 1.48;
        threeCtx.targetRadius = getResponsiveRadius(2.55);
        break;
    }
    document.querySelectorAll('[data-cam-snap]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-cam-snap') === preset);
    });
  }

  function resizeRenderer() {
    var mount = document.getElementById('bodystatus-canvas-mount');
    if (!mount || !threeCtx.renderer || !threeCtx.camera) return;
    var w = mount.clientWidth || 320;
    var h = mount.clientHeight || 480;
    var aspect = w / h;
    threeCtx.camera.aspect = aspect;
    // Widen FOV slightly on narrow portrait screens so full arm span fits comfortably
    threeCtx.camera.fov = aspect < 0.85 ? 46 : 40;
    threeCtx.camera.updateProjectionMatrix();
    threeCtx.renderer.setSize(w, h, false);
  }

  function startAnimLoop() {
    if (threeCtx.rafId) return;
    threeCtx.active = true;
    function tick() {
      var mount = document.getElementById('bodystatus-canvas-mount');
      if (!mount || !document.body.contains(mount)) {
        threeCtx.rafId = null;
        threeCtx.active = false;
        return;
      }
      threeCtx.rafId = requestAnimationFrame(tick);

      // Damped spherical orbit
      threeCtx.currentTheta += (threeCtx.targetTheta - threeCtx.currentTheta) * 0.14;
      threeCtx.currentPhi += (threeCtx.targetPhi - threeCtx.currentPhi) * 0.14;
      threeCtx.currentRadius += (threeCtx.targetRadius - threeCtx.currentRadius) * 0.14;

      var r = threeCtx.currentRadius;
      var sinPhi = Math.sin(threeCtx.currentPhi);
      var cx = r * sinPhi * Math.sin(threeCtx.currentTheta);
      var cy = threeCtx.lookTarget.y + r * Math.cos(threeCtx.currentPhi);
      var cz = r * sinPhi * Math.cos(threeCtx.currentTheta);

      threeCtx.camera.position.set(cx, cy, cz);
      threeCtx.camera.lookAt(threeCtx.lookTarget);

      // Pulse hologram rim outline
      if (threeCtx.rimMesh && threeCtx.rimMesh.visible) {
        threeCtx.pulsePhase += 0.06;
        threeCtx.rimMesh.material.opacity = 0.62 + Math.sin(threeCtx.pulsePhase) * 0.25;
      }

      // Muscle trophy animations (near-breakthrough shimmer, S-Rank aura, rank-up flash)
      var nowPerf = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      var dt = threeCtx.lastFrameTs ? Math.min(0.05, Math.max(0.001, (nowPerf - threeCtx.lastFrameTs) / 1000)) : 0.016;
      threeCtx.lastFrameTs = nowPerf;
      threeCtx.animTime += dt;
      var tSec = threeCtx.animTime;
      var animList = threeCtx.animList;
      for (var ai = 0; ai < animList.length; ai++) {
        var entry = animList[ai];
        var flash = threeCtx.flashMap[entry.id];
        if (entry.mode === 'none' && !flash) continue;

        var intensity = entry.baseIntensity;
        if (entry.mode === 'shimmer') {
          intensity = entry.baseIntensity + Math.sin(tSec * 2.5) * 0.08;
        } else if (entry.mode === 's_aura') {
          intensity = entry.baseIntensity + Math.sin(tSec * 1.2 * (1 + 0.25 * entry.stars)) * 0.15;
        }

        if (flash) {
          var elapsed = nowPerf - flash.startTs;
          if (elapsed < flash.duration) {
            var k = 1 - (elapsed / flash.duration);
            var flashVal = Math.max(0.4, entry.baseIntensity) * (1 + k);
            if (flashVal > intensity) intensity = flashVal;
          } else {
            delete threeCtx.flashMap[entry.id];
          }
        }

        entry.mesh.material.emissiveIntensity = intensity > 0 ? intensity : 0;
      }

      threeCtx.renderer.render(threeCtx.scene, threeCtx.camera);
    }
    threeCtx.rafId = requestAnimationFrame(tick);
  }

  /* --- 6. DOM Updaters (Floating System Window & Workout Panel) --- */
  function renderFloatingHudHtml() {
    var t = S.ensureAnatomyTracker();
    var st = S.getMuscleStatus(t.selectedMuscle);
    var r = st.rank;
    var recColor = st.recoveryPct >= 75 ? '#00E676' : (st.recoveryPct >= 45 ? '#FFB703' : '#FF2A4B');
    var starText = formatStars(st.stars);
    var xpLabel = st.nextRank
      ? (st.sets + ' / ' + st.nextThreshold + ' sets to ' + st.nextRank)
      : ('MAX MASTERY \u00b7 ' + st.sets + ' sets');

    var peakMarkerHtml = '';
    if (st.memoryActive) {
      var span = Math.max(1, st.nextThreshold - st.curThreshold);
      var peakPct = st.nextRank
        ? Math.min(100, Math.max(0, Math.round(((st.peakSets - st.curThreshold) / span) * 100)))
        : 100;
      peakMarkerHtml = '<span style="position:absolute; top:-2px; bottom:-2px; left:' + peakPct + '%; width:2px; background:#FFFFFF; opacity:0.75; transform:translateX(-1px);" title="Peak: ' + U.esc(st.peakRank.rank + formatStars(st.peakStars)) + '"></span>';
    }

    var condColor = st.condition === 'atrophy' ? '#FF2A4B' : (st.condition === 'fading' ? '#FFB703' : '#00E676');
    var condText = st.condition === 'atrophy'
      ? 'ATROPHYING'
      : (st.condition === 'fading'
        ? ('FADING (' + st.fadingDaysLeft + ' day' + (st.fadingDaysLeft === 1 ? '' : 's') + ' left)')
        : 'ACTIVE');
    var lastTrainedText = (!st.lastTrainedAt || st.sets <= 0)
      ? 'Untrained'
      : (st.daysUntrained === 0 ? 'Trained today' : (st.daysUntrained + 'd ago'));

    return '<div class="bs-hud-header">' +
        '<div>' +
          '<div class="bs-hud-kicker font-mono">[SYSTEM // MUSCLE TELEMETRY]</div>' +
          '<div class="bs-hud-title">' + U.esc(st.name.toUpperCase()) + '</div>' +
        '</div>' +
        '<button type="button" class="bs-hud-close" id="btn-hud-close" title="Close Telemetry Window">&times;</button>' +
      '</div>' +
      '<div class="bs-hud-meta-row">' +
        '<span class="bs-rank-pill" style="color:' + r.css + '; border-color:' + r.css + '; background:' + r.css + '1A;">' + U.esc(r.badge + starText + ' \u00b7 ' + st.title) + '</span>' +
        '<span class="bs-group-pill font-mono">' + U.esc(st.group) + '</span>' +
      '</div>' +
      (st.nearBreakthrough && st.nextRankObj
        ? '<div class="font-mono" style="font-size:10px; font-weight:700; color:' + st.nextRankObj.css + '; letter-spacing:0.06em; margin-bottom:6px;">[BREAKTHROUGH IMMINENT]</div>'
        : '') +
      '<div style="margin-bottom:8px;">' +
        '<div class="font-mono" style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-secondary); margin-bottom:4px;">' +
          '<span>' + U.esc(xpLabel) + '</span>' +
          '<span>' + st.progressPct + '%</span>' +
        '</div>' +
        '<div style="position:relative; height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:visible;">' +
          '<div style="height:100%; width:' + st.progressPct + '%; background:' + r.css + '; border-radius:3px; transition:width 0.25s ease;"></div>' +
          peakMarkerHtml +
        '</div>' +
        (st.memoryActive
          ? '<div class="font-mono" style="font-size:10px; color:#00E5FF; margin-top:4px;">Peak: ' + U.esc(st.peakRank.rank + formatStars(st.peakStars)) + ' \u00b7 Muscle Memory 2\u00d7 active</div>'
          : '') +
      '</div>' +
      '<div class="font-mono" style="display:flex; justify-content:space-between; align-items:center; font-size:10px; margin-bottom:6px;">' +
        '<span style="color:' + condColor + '; font-weight:700;">' + U.esc(condText) + '</span>' +
        '<span style="color:var(--text-muted);">' + U.esc(lastTrainedText) + '</span>' +
      '</div>' +
      (st.condition === 'fading'
        ? '<div class="font-mono" style="font-size:10px; color:#FFB703; margin-bottom:6px;">[FADING] Train within ' + st.fadingDaysLeft + ' day' + (st.fadingDaysLeft === 1 ? '' : 's') + ' to prevent atrophy</div>'
        : '') +
      '<div class="bs-hud-stats">' +
        '<div class="bs-stat-cell">' +
          '<span class="bs-stat-lbl font-mono">SETS LOGGED</span>' +
          '<span class="bs-stat-val font-mono">' + st.sets + ' <small style="font-size:10px; opacity:.65;">SETS</small></span>' +
        '</div>' +
        '<div class="bs-stat-cell">' +
          '<span class="bs-stat-lbl font-mono">RECOVERY</span>' +
          '<span class="bs-stat-val font-mono" style="color:' + recColor + ';">' + st.recoveryPct + '%</span>' +
        '</div>' +
      '</div>' +
      '<div class="bs-rec-bar-wrap">' +
        '<div class="bs-rec-bar-fill" style="width:' + st.recoveryPct + '%; background:' + recColor + ';"></div>' +
      '</div>' +
      '<div class="bs-hud-breakdown font-mono">' +
        '<span>PRIMARY: ' + st.primarySets + 's</span>' +
        '<span>SECONDARY: ' + st.secondarySets + 's</span>' +
      '</div>';
  }

  function updateHudWindowDOM(forceShow) {
    var hud = document.getElementById('bodystatus-floating-hud');
    if (!hud) return;
    var t = S.ensureAnatomyTracker();
    if (!t.selectedMuscle || !MUSCLE_MAP[t.selectedMuscle]) {
      hud.classList.add('hidden');
      hud.innerHTML = '';
      return;
    }
    if (forceShow) hud.classList.remove('hidden');
    hud.innerHTML = renderFloatingHudHtml();

    var closeBtn = document.getElementById('btn-hud-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        t.selectedMuscle = null;
        hud.classList.add('hidden');
        hud.innerHTML = '';
        updateSelectionRim();
        S.applyMuscleColorsTo3D();
        updateSidePanelsDOM();
        if (S.saveState) S.saveState();
      });
    }
  }

  function updateSidePanelsDOM() {
    var listEl = document.getElementById('bs-muscle-roster');
    if (listEl) {
      var t = S.ensureAnatomyTracker();
      listEl.innerHTML = ANATOMY_MUSCLES.map(function (m) {
        var st = S.getMuscleStatus(m.id);
        var isSel = t.selectedMuscle === m.id;
        var dotColor = desaturateHex(st.rank.css, st.desaturation);
        var warnIcon = (st.condition === 'fading' || st.condition === 'atrophy')
          ? '<span style="color:' + (st.condition === 'atrophy' ? '#FF2A4B' : '#FFB703') + '; font-size:10px; flex-shrink:0;" title="' + U.esc(st.condition.toUpperCase()) + '">\u26a0</span>'
          : '';
        var rankShort = st.rank.rank === 'Dormant' ? '\u2014' : (st.rank.rank.split('-')[0] + formatStars(st.stars));
        return '<button type="button" class="bs-roster-chip' + (isSel ? ' active' : '') + '" data-select-muscle="' + m.id + '" style="flex-direction:column; align-items:stretch; gap:4px;">' +
          '<span style="display:flex; align-items:center; gap:6px; width:100%;">' +
            '<span class="bs-roster-dot" style="background:' + dotColor + '; box-shadow:0 0 8px ' + dotColor + ';"></span>' +
            '<span class="bs-roster-name">' + U.esc(m.name) + '</span>' +
            warnIcon +
            '<span class="bs-roster-rank font-mono" style="color:' + st.rank.css + ';">' + U.esc(rankShort) + ' \u00b7 ' + st.sets + 's</span>' +
          '</span>' +
          '<span style="display:block; width:100%; height:2px; background:rgba(255,255,255,0.08); border-radius:1px; overflow:hidden;">' +
            '<span style="display:block; height:100%; width:' + st.progressPct + '%; background:' + st.rank.css + ';"></span>' +
          '</span>' +
        '</button>';
      }).join('');
      listEl.querySelectorAll('[data-select-muscle]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectMuscle(btn.getAttribute('data-select-muscle'), true);
        });
      });
    }

    var questsEl = document.getElementById('bs-quest-sync-list');
    if (questsEl) {
      var physQuests = (S.state && Array.isArray(S.state.quests))
        ? S.state.quests.filter(function (q) {
            var cat = S.CATS && S.CATS[q.category];
            return cat && cat.physical;
          })
        : [];
      if (!physQuests.length) {
        questsEl.innerHTML = '<div class="font-mono" style="font-size:11px; color:var(--text-muted); padding:6px 0;">No physical quests active today. Add workout quests in the Quests tab to automatically color your body.</div>';
      } else {
        questsEl.innerHTML = physQuests.map(function (q) {
          var map = S.inferAnatomyMuscles(q);
          var pct = Math.min(100, Math.round(((q.currentProgress || 0) / Math.max(1, q.targetProgress || 1)) * 100));
          var primLabel = map.primary.map(function (id) { return (MUSCLE_MAP[id] && MUSCLE_MAP[id].name) || id; }).join(', ');
          var firstId = map.primary[0] || map.secondary[0] || '';
          return '<button type="button" class="bs-quest-sync-item' + (q.isCompleted ? ' completed' : '') + '" data-focus-muscle="' + U.esc(firstId) + '">' +
            '<div class="bs-qsync-top">' +
              '<span class="bs-qsync-title">' + U.esc(q.title) + '</span>' +
              '<span class="bs-qsync-prog font-mono">' + (q.isCompleted ? 'CLEAR' : q.currentProgress + '/' + q.targetProgress) + '</span>' +
            '</div>' +
            '<div class="bs-qsync-muscles font-mono">' + (primLabel ? 'Target: ' + U.esc(primLabel) : 'Physical Conditioning') + '</div>' +
            '<div class="bs-qsync-bar"><div class="bs-qsync-fill" style="width:' + pct + '%;"></div></div>' +
          '</button>';
        }).join('');
        questsEl.querySelectorAll('[data-focus-muscle]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var mid = btn.getAttribute('data-focus-muscle');
            if (mid) selectMuscle(mid, true);
          });
        });
      }
    }

    var logEl = document.getElementById('bs-workout-history');
    if (logEl) {
      var hist = S.ensureAnatomyTracker().workoutHistory;
      if (!hist.length) {
        logEl.innerHTML = '<div class="font-mono" style="font-size:11px; color:var(--text-muted); padding:8px 0;">Complete or log progress on physical quests in the Quests tab to activate muscles automatically.</div>';
      } else {
        logEl.innerHTML = hist.slice(0, 6).map(function (h) {
          return '<div class="bs-history-row">' +
            '<div><strong style="color:var(--text-primary);">' + U.esc(h.exerciseName) + '</strong>' +
            '<div class="font-mono" style="font-size:10px; color:var(--text-muted);">Primary: ' + U.esc(h.primary.join(', ')) + (h.secondary.length ? ' · Sec: ' + U.esc(h.secondary.join(', ')) : '') + '</div></div>' +
            '<span class="bs-history-sets font-mono">+' + h.sets + ' SETS</span>' +
          '</div>';
        }).join('');
      }
    }
  }

  /* --- 7. Main View Renderer --- */
  S.renderBodyStatusView = function (container) {
    if (!container) return;
    S.ensureAnatomyTracker();
    if (S.syncAllQuestsToBody) S.syncAllQuestsToBody();

    // Preserve canvas element across UI.render() re-mounts
    var prevMount = document.getElementById('bodystatus-canvas-mount');
    var canvasAlreadyMounted = prevMount && threeCtx.renderer && prevMount.contains(threeCtx.renderer.domElement);

    // If this container already holds our bodystatus shell (e.g. background 1s tick), just refresh telemetry without wiping WebGL DOM!
    if (canvasAlreadyMounted && container.querySelector('#bodystatus-shell')) {
      updateHudWindowDOM();
      updateSidePanelsDOM();
      return;
    }

    // Start with no muscle pre-selected when opening the Body view
    S.ensureAnatomyTracker().selectedMuscle = null;

    container.innerHTML =
      '<div class="bodystatus-shell" id="bodystatus-shell">' +
        '<div class="bodystatus-stage-panel">' +
          '<div class="panel-header" style="margin-bottom:10px;">' +
            '<div class="panel-title">' + (S.icon ? S.icon('status', 18) : '') + ' BODY STATUS</div>' +
          '</div>' +

          '<div class="bs-viewport-wrap" id="bs-viewport-wrap">' +
            '<div class="bs-grid-overlay" aria-hidden="true"></div>' +
            '<div id="bodystatus-canvas-mount" class="bs-canvas-mount"></div>' +

            '<div id="bodystatus-loading-overlay" class="bs-loading-overlay' + (threeCtx.loaded ? ' hidden' : '') + '">' +
              '<div class="font-mono" style="color:#00E5FF; font-size:12px; letter-spacing:0.1em;">[INITIALIZING HUNTER ANATOMY MESH...]</div>' +
            '</div>' +

            '<div class="bs-cam-bar" role="group" aria-label="Camera Snap Controls">' +
              '<button type="button" class="bs-snap-btn" data-cam-snap="FRONT">FRONT</button>' +
              '<button type="button" class="bs-snap-btn" data-cam-snap="BACK">BACK</button>' +
              '<button type="button" class="bs-snap-btn" data-cam-snap="LEFT">LEFT</button>' +
              '<button type="button" class="bs-snap-btn" data-cam-snap="RIGHT">RIGHT</button>' +
              '<button type="button" class="bs-snap-btn active" data-cam-snap="RESET">RESET</button>' +
            '</div>' +

            '<div class="bs-drag-hint font-mono">DRAG TO ORBIT 360° · PINCH / SCROLL TO ZOOM · TAP MUSCLE</div>' +
          '</div>' +

          '<div id="bodystatus-floating-hud" class="bs-floating-hud hidden"></div>' +
        '</div>' +

        '<div class="bodystatus-side-col">' +
          '<div class="system-panel bs-logger-panel">' +
            '<div class="panel-header" style="margin-bottom:10px;">' +
              '<div class="panel-title" style="font-size:13px;">[QUEST-SYNCED MUSCLE ENGINE]</div>' +
              '<div style="display:flex; gap:6px;">' +
                '<button type="button" class="sys-btn sm primary" id="btn-bs-go-quests">QUESTS</button>' +
                '<button type="button" class="sys-btn sm danger" id="btn-bs-reset">RESET</button>' +
              '</div>' +
            '</div>' +
            '<div class="font-mono" style="font-size:10.5px; color:var(--text-secondary); margin-bottom:10px; line-height:1.45;">' +
              'Every muscle is a trophy. Colors are earned through sustained effort. Neglect a muscle for weeks and it will fade, but muscle memory never forgets your peak.' +
            '</div>' +
            '<div class="bs-history-title font-mono">ACTIVE PHYSICAL QUESTS</div>' +
            '<div id="bs-quest-sync-list" class="bs-quest-sync-list"></div>' +
            '<div class="bs-history-title font-mono" style="margin-top:10px;">RECENT QUEST ACTIVATIONS</div>' +
            '<div id="bs-workout-history" class="bs-history-list"></div>' +
          '</div>' +

          '<div class="system-panel bs-roster-panel">' +
            '<div class="panel-header" style="margin-bottom:8px;">' +
              '<div class="panel-title" style="font-size:13px;">[21 ANATOMICAL MUSCLE GROUPS]</div>' +
            '</div>' +
            '<div id="bs-muscle-roster" class="bs-muscle-roster"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Initialize Three.js & attach canvas
    if (ensureThreeCtx()) {
      var mount = document.getElementById('bodystatus-canvas-mount');
      if (mount && threeCtx.renderer) {
        mount.innerHTML = '';
        mount.appendChild(threeCtx.renderer.domElement);
        resizeRenderer();
        if (!threeCtx.hasSizedOnce) {
          threeCtx.hasSizedOnce = true;
          threeCtx.targetRadius = threeCtx.currentRadius = getResponsiveRadius(2.55);
        }
        startAnimLoop();
        if (threeCtx.loaded) {
          S.applyMuscleColorsTo3D();
          updateSelectionRim();
        }
      }
    }

    // Bind camera snap buttons
    container.querySelectorAll('[data-cam-snap]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        snapCamera(btn.getAttribute('data-cam-snap'));
      });
    });

    // Bind quest & reset controls
    var goQuestsBtn = document.getElementById('btn-bs-go-quests');
    if (goQuestsBtn) {
      goQuestsBtn.addEventListener('click', function () {
        if (S.ui && S.ui.setView) S.ui.setView('quests');
      });
    }

    var resetBtn = document.getElementById('btn-bs-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (S.audio) { try { S.audio.tap(); } catch (e) {} }
        S.resetAnatomyTracker();
      });
    }

    if (!threeCtx.resizeObserver && window.ResizeObserver) {
      threeCtx.resizeObserver = new ResizeObserver(function () {
        resizeRenderer();
      });
      var vpWrap = document.getElementById('bs-viewport-wrap');
      if (vpWrap) threeCtx.resizeObserver.observe(vpWrap);
    }
    window.addEventListener('resize', resizeRenderer);

    updateHudWindowDOM();
    updateSidePanelsDOM();
  };

})(window.SYS);

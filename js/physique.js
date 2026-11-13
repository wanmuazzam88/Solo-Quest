/* ============================================================================
   THE SYSTEM // PROJECT: ARISE — PLAYER VESSEL & 3D MUSCLE ACTIVATION MATRIX
   Three.js 3D Interactive Anatomical Muscle Scanner & Luminescence Overdrive
   ============================================================================ */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var U = S.util;
  var I = S.icon;

  /* ============================================================================
      15 ANATOMICAL MUSCLE GROUPS (ANTERIOR, LATERAL & POSTERIOR 3D MAPPING)
     ============================================================================ */
  var MUSCLES = S.MUSCLES = [
    {
      id: 'chest',
      name: 'Pectoralis (Chest)',
      short: 'CHEST',
      side: 'FRONT',
      preferredYaw: 0,
      focusPos: [0, 0.88, 0.28],
      subgroups: 'Upper Chest • Mid Chest • Lower Chest',
      primaryStat: 'STR',
      exercises: ['Push-Ups', 'Bench Press', 'Incline Press', 'Chest Dips']
    },
    {
      id: 'shoulders',
      name: 'Deltoids (Shoulders)',
      short: 'DELTS',
      side: 'BOTH',
      preferredYaw: 0.45,
      focusPos: [0.58, 1.06, 0.05],
      subgroups: 'Front Delt • Lateral Delt • Rear Delt',
      primaryStat: 'STR',
      exercises: ['Overhead Press', 'Lateral Raises', 'Pike Push-Ups', 'Face Pulls']
    },
    {
      id: 'traps',
      name: 'Trapezius (Yoke)',
      short: 'TRAPS',
      side: 'BACK',
      preferredYaw: 2.75,
      focusPos: [0, 1.15, -0.18],
      subgroups: 'Upper Traps • Mid Traps • Lower Traps',
      primaryStat: 'VIT',
      exercises: ['Barbell Shrugs', 'Farmer Carries', 'Rack Pulls', 'Upright Rows']
    },
    {
      id: 'biceps',
      name: 'Biceps Brachii',
      short: 'BICEPS',
      side: 'FRONT',
      preferredYaw: 0.35,
      focusPos: [0.68, 0.66, 0.14],
      subgroups: 'Long Head • Short Head • Brachialis',
      primaryStat: 'STR',
      exercises: ['Barbell Curls', 'Hammer Curls', 'Chin-Ups', 'Incline Curls']
    },
    {
      id: 'triceps',
      name: 'Triceps Brachii',
      short: 'TRICEPS',
      side: 'BACK',
      preferredYaw: 2.55,
      focusPos: [0.70, 0.66, -0.14],
      subgroups: 'Lateral Head • Long Head • Medial Head',
      primaryStat: 'STR',
      exercises: ['Diamond Push-Ups', 'Tricep Dips', 'Skullcrushers', 'Rope Pushdowns']
    },
    {
      id: 'forearms',
      name: 'Forearms & Grip',
      short: 'FOREARMS',
      side: 'BOTH',
      preferredYaw: 0.55,
      focusPos: [0.80, 0.18, 0.08],
      subgroups: 'Brachioradialis • Wrist Flexors • Extensors',
      primaryStat: 'STR',
      exercises: ['Dead Hangs', 'Wrist Curls', 'Reverse Curls', 'Farmer Hold']
    },
    {
      id: 'abs',
      name: 'Rectus Abdominis (Core)',
      short: 'ABS',
      side: 'FRONT',
      preferredYaw: 0,
      focusPos: [0, 0.32, 0.26],
      subgroups: 'Upper Abs • Mid 6-Pack • Lower Core',
      primaryStat: 'VIT',
      exercises: ['Sit-Ups', 'Hanging Leg Raises', 'Ab Wheel Rollouts', 'Crunches']
    },
    {
      id: 'obliques',
      name: 'Obliques & Serratus',
      short: 'OBLIQUES',
      side: 'FRONT',
      preferredYaw: 0.78,
      focusPos: [0.34, 0.34, 0.16],
      subgroups: 'External Obliques • Serratus Anterior • Transverse',
      primaryStat: 'AGI',
      exercises: ['Russian Twists', 'Side Planks', 'Woodchoppers', 'Bicycle Crunches']
    },
    {
      id: 'lats',
      name: 'Lats (V-Taper Wings)',
      short: 'LATS',
      side: 'BACK',
      preferredYaw: 2.85,
      focusPos: [0.38, 0.64, -0.22],
      subgroups: 'Latissimus Dorsi • Teres Major',
      primaryStat: 'STR',
      exercises: ['Pull-Ups', 'Lat Pulldowns', 'Barbell Rows', 'Single-Arm Rows']
    },
    {
      id: 'upper_back',
      name: 'Upper Back (Rhomboids)',
      short: 'UPPER BACK',
      side: 'BACK',
      preferredYaw: 3.14,
      focusPos: [0, 0.88, -0.25],
      subgroups: 'Rhomboids • Infraspinatus • Rear Scapula',
      primaryStat: 'VIT',
      exercises: ['Chest-Supported Rows', 'Seated Cable Rows', 'Pull-Aparts', 'Inverted Rows']
    },
    {
      id: 'lower_back',
      name: 'Lower Back (Erectors)',
      short: 'LOWER BACK',
      side: 'BACK',
      preferredYaw: 3.14,
      focusPos: [0, 0.25, -0.22],
      subgroups: 'Erector Spinae • Lumbar Posterior Chain',
      primaryStat: 'VIT',
      exercises: ['Deadlifts', 'Back Extensions', 'Good Mornings', 'Superman Holds']
    },
    {
      id: 'quads',
      name: 'Quadriceps (Front Legs)',
      short: 'QUADS',
      side: 'FRONT',
      preferredYaw: 0.15,
      focusPos: [0.26, -0.62, 0.20],
      subgroups: 'Rectus Femoris • Vastus Lateralis • Vastus Medialis',
      primaryStat: 'STR',
      exercises: ['Squats', 'Bulgarian Split Squats', 'Leg Press', 'Lunges']
    },
    {
      id: 'hamstrings',
      name: 'Hamstrings (Rear Thighs)',
      short: 'HAMSTRINGS',
      side: 'BACK',
      preferredYaw: 3.14,
      focusPos: [0.26, -0.68, -0.20],
      subgroups: 'Biceps Femoris • Semitendinosus • Semimembranosus',
      primaryStat: 'AGI',
      exercises: ['Romanian Deadlifts', 'Hamstring Curls', 'Nordic Curls', 'Glute-Ham Raise']
    },
    {
      id: 'glutes',
      name: 'Glutes (Posterior Chain)',
      short: 'GLUTES',
      side: 'BACK',
      preferredYaw: 3.0,
      focusPos: [0.22, -0.14, -0.25],
      subgroups: 'Gluteus Maximus • Gluteus Medius',
      primaryStat: 'STR',
      exercises: ['Hip Thrusts', 'Deep Squats', 'Step-Ups', 'Kettlebell Swings']
    },
    {
      id: 'calves',
      name: 'Calves (Lower Legs)',
      short: 'CALVES',
      side: 'BOTH',
      preferredYaw: 2.75,
      focusPos: [0.28, -1.42, -0.16],
      subgroups: 'Gastrocnemius • Soleus • Tibialis',
      primaryStat: 'AGI',
      exercises: ['Standing Calf Raises', 'Seated Calf Raises', 'Jump Rope', 'Plyo Jumps']
    }
  ];

  var MUSCLE_MAP = S.MUSCLE_MAP = {};
  MUSCLES.forEach(function (m) { MUSCLE_MAP[m.id] = m; });

  /* ============================================================================
      SOLO LEVELING MUSCLE OVERDRIVE TIERS (COLOR + BRIGHTNESS + GLOW)
     ============================================================================ */
  var TIERS = S.OVERDRIVE_TIERS = [
    {
      rank: 'DORMANT',
      code: 'UNAWAKENED',
      minSets: 0,
      maxSets: 0,
      spectrum: { base: '#2D3545', hi: '#3B4559', stroke: '#4A5568', text: '#94A3B8', glow: 'rgba(148,163,184,0)' },
      neon:     { base: '#252F3F', hi: '#334155', stroke: '#475569', text: '#94A3B8', glow: 'rgba(0,229,255,0)' },
      crimson:  { base: '#2A2633', hi: '#3B3345', stroke: '#524763', text: '#94A3B8', glow: 'rgba(255,42,75,0)' }
    },
    {
      rank: 'E-RANK',
      code: 'AWAKENED',
      minSets: 1,
      maxSets: 3,
      spectrum: { base: '#1D4ED8', hi: '#3B82F6', stroke: '#60A5FA', text: '#60A5FA', glow: 'rgba(59,130,246,0.45)' },
      neon:     { base: '#0369A1', hi: '#0284C7', stroke: '#38BDF8', text: '#38BDF8', glow: 'rgba(56,189,248,0.45)' },
      crimson:  { base: '#6D28D9', hi: '#8B5CF6', stroke: '#A78BFA', text: '#A78BFA', glow: 'rgba(139,92,246,0.45)' }
    },
    {
      rank: 'C-RANK',
      code: 'CHARGED',
      minSets: 4,
      maxSets: 7,
      spectrum: { base: '#15803D', hi: '#22C55E', stroke: '#4ADE80', text: '#4ADE80', glow: 'rgba(34,197,94,0.55)' },
      neon:     { base: '#0E7490', hi: '#06B6D4', stroke: '#22D3EE', text: '#22D3EE', glow: 'rgba(6,182,212,0.58)' },
      crimson:  { base: '#BE185D', hi: '#EC4899', stroke: '#F472B6', text: '#F472B6', glow: 'rgba(236,72,153,0.55)' }
    },
    {
      rank: 'B-RANK',
      code: 'SURGING',
      minSets: 8,
      maxSets: 12,
      spectrum: { base: '#00B4D8', hi: '#22D3EE', stroke: '#67E8F9', text: '#00E5FF', glow: 'rgba(0,229,255,0.70)' },
      neon:     { base: '#00B4D8', hi: '#00F0FF', stroke: '#A5F3FC', text: '#00F0FF', glow: 'rgba(0,240,255,0.78)' },
      crimson:  { base: '#B91C1C', hi: '#EF4444', stroke: '#F87171', text: '#F87171', glow: 'rgba(239,68,68,0.68)' }
    },
    {
      rank: 'A-RANK',
      code: 'OVERDRIVE',
      minSets: 13,
      maxSets: 19,
      spectrum: { base: '#DC2626', hi: '#FF2A4B', stroke: '#FDA4AF', text: '#FF4D6D', glow: 'rgba(255,30,66,0.82)' },
      neon:     { base: '#7C3AED', hi: '#A855F7', stroke: '#E9D5FF', text: '#C084FC', glow: 'rgba(168,85,247,0.85)' },
      crimson:  { base: '#E11D48', hi: '#FF1E42', stroke: '#FECDD3', text: '#FF4D6D', glow: 'rgba(255,30,66,0.85)' }
    },
    {
      rank: 'S-RANK',
      code: 'MONARCH',
      minSets: 20,
      maxSets: 999,
      spectrum: { base: '#F59E0B', hi: '#FFD166', stroke: '#FEF08A', text: '#FFB703', glow: 'rgba(255,183,3,0.95)' },
      neon:     { base: '#00F0FF', hi: '#E0F2FE', stroke: '#FFFFFF', text: '#00F0FF', glow: 'rgba(0,240,255,0.98)' },
      crimson:  { base: '#F97316', hi: '#FACC15', stroke: '#FEF08A', text: '#FBBF24', glow: 'rgba(250,204,21,0.95)' }
    }
  ];

  function hexToRgb(hex) {
    var clean = String(hex || '#2D3545').replace('#', '');
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    var num = parseInt(clean, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function lerpColor(hexA, hexB, t) {
    t = Math.max(0, Math.min(1, Number(t) || 0));
    var a = hexToRgb(hexA);
    var b = hexToRgb(hexB);
    var r = Math.round(a.r + (b.r - a.r) * t);
    var g = Math.round(a.g + (b.g - a.g) * t);
    var bl = Math.round(a.b + (b.b - a.b) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1).toUpperCase();
  }

  S.getMuscleVisuals = function (sets, paletteMode) {
    var s = Math.max(0, Math.round((Number(sets) || 0) * 10) / 10);
    var mode = paletteMode || (S.state && S.state.muscleLog && S.state.muscleLog.palette) || 'spectrum';
    if (!TIERS[0][mode]) mode = 'spectrum';

    var tierIdx = 0;
    for (var i = TIERS.length - 1; i >= 1; i--) {
      if (s >= TIERS[i].minSets) {
        tierIdx = i;
        break;
      }
    }
    var tier = TIERS[tierIdx];
    var pal = tier[mode];

    var subRatio = 0;
    if (tierIdx > 0) {
      var span = Math.max(1, (tierIdx === TIERS.length - 1 ? 10 : (tier.maxSets - tier.minSets + 1)));
      subRatio = Math.min(1, (s - tier.minSets) / span);
    }

    var fill = tierIdx === 0 ? pal.base : lerpColor(pal.base, pal.hi, 0.35 + subRatio * 0.65);
    var brightness = tierIdx === 0 ? 0.78 : (0.96 + tierIdx * 0.055 + subRatio * 0.06);
    var glowRadius = tierIdx === 0 ? 0 : Math.round(4 + tierIdx * 3 + subRatio * 4);
    var opacity = tierIdx === 0 ? 0.72 : Math.min(1, 0.86 + tierIdx * 0.025 + subRatio * 0.02);
    var emissiveIntensity = tierIdx === 0 ? 0.05 : Math.min(0.92, 0.18 + tierIdx * 0.12 + subRatio * 0.14);

    return {
      sets: s,
      tierIdx: tierIdx,
      rank: tier.rank,
      code: tier.code,
      fill: fill,
      baseColor: pal.base,
      hiColor: pal.hi,
      stroke: pal.stroke,
      textColor: pal.text,
      glowColor: pal.glow,
      glow: glowRadius > 0 ? ('drop-shadow(0 0 ' + glowRadius + 'px ' + pal.glow + ')') : 'none',
      brightness: Math.round(brightness * 100) / 100,
      opacity: Math.round(opacity * 100) / 100,
      emissiveIntensity: Math.round(emissiveIntensity * 100) / 100,
      subRatio: subRatio,
      nextTierSets: tierIdx < TIERS.length - 1 ? TIERS[tierIdx + 1].minSets : null,
      overallPct: Math.min(100, Math.round((s / 20) * 100))
    };
  };

  /* ============================================================================
      AUTOMATIC QUEST -> MUSCLE INFERENCE & STATE LOGGING ENGINE
     ============================================================================ */
  var KEYWORD_RULES = [
    { rx: /push[\s-]*up|bench|chest|pec|fly|dip/i, muscles: ['chest', 'triceps', 'shoulders'] },
    { rx: /incline\s*(press|bench|push)/i, muscles: ['chest', 'shoulders', 'triceps'] },
    { rx: /pull[\s-]*up|chin[\s-]*up|lat|pulldown|muscle[\s-]*up/i, muscles: ['lats', 'biceps', 'upper_back', 'forearms'] },
    { rx: /row|rhomboid|rear\s*delt|face\s*pull/i, muscles: ['upper_back', 'lats', 'biceps', 'traps'] },
    { rx: /shoulder|overhead|military|ohp|deltoid|lateral\s*raise|pike|handstand/i, muscles: ['shoulders', 'traps', 'triceps'] },
    { rx: /shrug|trap|yoke|farmer/i, muscles: ['traps', 'forearms'] },
    { rx: /curl|bicep/i, muscles: ['biceps', 'forearms'] },
    { rx: /tricep|skullcrusher|pushdown|extension|diamond\s*push/i, muscles: ['triceps', 'chest'] },
    { rx: /forearm|grip|hang|wrist/i, muscles: ['forearms', 'biceps'] },
    { rx: /sit[\s-]*up|crunch|ab|core|plank|leg\s*raise|hollow|l[\s-]*sit|v[\s-]*up/i, muscles: ['abs', 'obliques'] },
    { rx: /oblique|twist|side\s*plank|woodchop/i, muscles: ['obliques', 'abs'] },
    { rx: /squat|lunge|split\s*squat|leg\s*press|step[\s-]*up|wall\s*sit|pistol/i, muscles: ['quads', 'glutes', 'hamstrings', 'calves'] },
    { rx: /deadlift|rdl|romanian|good\s*morning|back\s*extension|hinge/i, muscles: ['hamstrings', 'glutes', 'lower_back', 'traps', 'forearms'] },
    { rx: /hip\s*thrust|glute|bridge|kickback/i, muscles: ['glutes', 'hamstrings'] },
    { rx: /hamstring|leg\s*curl|nordic/i, muscles: ['hamstrings', 'glutes', 'calves'] },
    { rx: /calf|calves|jump\s*rope|skip|box\s*jump|plyo/i, muscles: ['calves', 'quads'] },
    { rx: /burpee|full\s*body|hiit|thruster|clean|snatch|kettlebell|circuit/i, muscles: ['chest', 'shoulders', 'abs', 'quads', 'glutes', 'calves'] }
  ];

  S.inferMusclesFromQuest = function (q) {
    if (!q) return [];
    if (Array.isArray(q.muscles) && q.muscles.length) {
      return q.muscles.filter(function (id) { return !!MUSCLE_MAP[id]; });
    }
    var preset = String(q.preset || '').toLowerCase();
    if (preset === 'pushups') return ['chest', 'triceps', 'shoulders'];
    if (preset === 'situps') return ['abs', 'obliques'];
    if (preset === 'squats') return ['quads', 'glutes', 'hamstrings', 'calves'];

    var title = String(q.title || '');
    var found = [];
    KEYWORD_RULES.forEach(function (rule) {
      if (rule.rx.test(title)) {
        rule.muscles.forEach(function (mId) {
          if (found.indexOf(mId) === -1) found.push(mId);
        });
      }
    });
    if (found.length) return found;

    var cat = String(q.category || '').toUpperCase();
    if (cat === 'STRENGTH' || cat === 'GYM') {
      return ['chest', 'shoulders', 'lats', 'biceps', 'triceps'];
    }
    if (cat === 'CALISTHENICS') {
      return ['chest', 'abs', 'shoulders', 'triceps', 'lats'];
    }
    if (cat === 'MOBILITY') {
      return ['lower_back', 'hamstrings', 'glutes', 'shoulders'];
    }
    return [];
  };

  S.ensureMuscleLog = function () {
    if (!S.state) return null;
    var s = S.state;
    if (!s.muscleLog || typeof s.muscleLog !== 'object') {
      s.muscleLog = {
        days: {},
        allTime: {},
        lastTrained: {},
        questCredited: {},
        palette: 'spectrum',
        timeframe: '7D',
        updatedAt: Date.now()
      };
    }
    if (!s.muscleLog.days) s.muscleLog.days = {};
    if (!s.muscleLog.allTime) s.muscleLog.allTime = {};
    if (!s.muscleLog.lastTrained) s.muscleLog.lastTrained = {};
    if (!s.muscleLog.questCredited) s.muscleLog.questCredited = {};
    if (!s.muscleLog.palette) s.muscleLog.palette = 'spectrum';
    if (!s.muscleLog.timeframe) s.muscleLog.timeframe = '7D';

    if (Array.isArray(s.quests)) {
      var changed = false;
      s.quests.forEach(function (q) {
        if (q && (q.currentProgress > 0 || q.isCompleted)) {
          if (S.syncQuestMuscleCredit(q, true)) changed = true;
        }
      });
      if (changed) S.save();
    }
    return s.muscleLog;
  };

  function computeQuestEffectiveSets(q) {
    if (!q) return 0;
    var prog = Number(q.currentProgress) || 0;
    var targ = Math.max(1, Number(q.targetProgress) || 1);
    var ratio = Math.min(1.5, prog / targ);
    if (ratio <= 0) return 0;

    var fullSets = 3;
    if (q.unit === 'SETS') {
      fullSets = Math.max(1, Math.min(10, targ));
    } else if (q.unit === 'REPS') {
      fullSets = Math.max(2, Math.min(6, Math.round(targ / 25) + 1));
    } else if (q.unit === 'MINS') {
      fullSets = Math.max(2, Math.min(5, Math.round(targ / 15) + 1));
    } else {
      fullSets = 2;
    }
    return Math.round(fullSets * ratio * 10) / 10;
  }

  S.syncQuestMuscleCredit = function (q, silent) {
    if (!q || !S.state) return false;
    var muscles = S.inferMusclesFromQuest(q);
    if (!muscles || !muscles.length) return false;

    var ml = S.ensureMuscleLog();
    var dateKey = q.createdDate || S.state.currentDate || S.today();
    var creditKey = (q.id || q.title) + '_' + dateKey;
    var prevCredited = ml.questCredited[creditKey] || {};
    var totalSets = computeQuestEffectiveSets(q);

    var dayBucket = ml.days[dateKey] || (ml.days[dateKey] = {});
    var anyDiff = false;

    muscles.forEach(function (mId, idx) {
      var weight = idx === 0 ? 1 : (idx === 1 ? 0.85 : 0.65);
      var newVal = Math.round(totalSets * weight * 10) / 10;
      var oldVal = Number(prevCredited[mId]) || 0;
      var delta = Math.round((newVal - oldVal) * 10) / 10;
      if (Math.abs(delta) >= 0.1) {
        dayBucket[mId] = Math.max(0, Math.round(((Number(dayBucket[mId]) || 0) + delta) * 10) / 10);
        ml.allTime[mId] = Math.max(0, Math.round(((Number(ml.allTime[mId]) || 0) + delta) * 10) / 10);
        if (delta > 0) ml.lastTrained[mId] = dateKey;
        prevCredited[mId] = newVal;
        anyDiff = true;
      }
    });

    if (anyDiff) {
      ml.questCredited[creditKey] = prevCredited;
      ml.updatedAt = Date.now();
      if (!silent) S.commit();
    }
    return anyDiff;
  };

  S.logMuscleSets = function (muscleId, deltaSets, exerciseName) {
    if (!MUSCLE_MAP[muscleId]) return false;
    var ml = S.ensureMuscleLog();
    var dateKey = (S.state && S.state.currentDate) || S.today();
    var dayBucket = ml.days[dateKey] || (ml.days[dateKey] = {});

    var before = Number(dayBucket[muscleId]) || 0;
    var after = Math.max(0, Math.round((before + deltaSets) * 10) / 10);
    var actualDelta = Math.round((after - before) * 10) / 10;
    if (actualDelta === 0 && deltaSets < 0) {
      var allBefore = Number(ml.allTime[muscleId]) || 0;
      ml.allTime[muscleId] = Math.max(0, Math.round((allBefore + deltaSets) * 10) / 10);
      ml.updatedAt = Date.now();
      S.commit();
      return true;
    }

    dayBucket[muscleId] = after;
    ml.allTime[muscleId] = Math.max(0, Math.round(((Number(ml.allTime[muscleId]) || 0) + actualDelta) * 10) / 10);
    if (actualDelta > 0) {
      ml.lastTrained[muscleId] = dateKey;
      if (S.state && S.state.profile && !S.isFrozen()) {
        var xpGain = Math.round(actualDelta * 12);
        S.state.profile.currentXp = (S.state.profile.currentXp || 0) + xpGain;
        if (S.state.records) S.state.records.totalXp = (S.state.records.totalXp || 0) + xpGain;
      }
    }
    ml.updatedAt = Date.now();
    S.commit();
    return true;
  };

  S.resetMuscleProgress = function (muscleId) {
    var ml = S.ensureMuscleLog();
    if (!ml) return;
    if (muscleId) {
      Object.keys(ml.days).forEach(function (d) {
        if (ml.days[d]) delete ml.days[d][muscleId];
      });
      delete ml.allTime[muscleId];
      delete ml.lastTrained[muscleId];
      Object.keys(ml.questCredited || {}).forEach(function (k) {
        if (ml.questCredited[k]) delete ml.questCredited[k][muscleId];
      });
    } else {
      ml.days = {};
      ml.allTime = {};
      ml.lastTrained = {};
      ml.questCredited = {};
    }
    ml.updatedAt = Date.now();
    S.commit();
  };

  S.getMuscleScores = function (timeframe) {
    var ml = S.ensureMuscleLog();
    timeframe = timeframe || (ml && ml.timeframe) || '7D';
    var scores = {};
    MUSCLES.forEach(function (m) { scores[m.id] = 0; });
    if (!ml) return scores;

    if (timeframe === 'ALL') {
      MUSCLES.forEach(function (m) {
        scores[m.id] = Math.round((Number(ml.allTime[m.id]) || 0) * 10) / 10;
      });
      return scores;
    }

    var maxDays = timeframe === 'TODAY' ? 1 : (timeframe === '30D' ? 30 : 7);
    var todayStr = (S.state && S.state.currentDate) || S.today();

    Object.keys(ml.days || {}).forEach(function (dStr) {
      var diffDays = U.daysBetween(dStr, todayStr);
      if (diffDays >= 0 && diffDays < maxDays) {
        var bucket = ml.days[dStr] || {};
        Object.keys(bucket).forEach(function (mId) {
          if (scores[mId] !== undefined) {
            scores[mId] = Math.round((scores[mId] + (Number(bucket[mId]) || 0)) * 10) / 10;
          }
        });
      }
    });

    return scores;
  };

  /* ============================================================================
      THREE.JS 3D INTERACTIVE ANATOMICAL HUNTER ENGINE
      Full 360° rotatable 3D muscular body with raycast selection, dynamic
      emissive overdrive lighting, anatomical fiber wireframes & HUD callout
     ============================================================================ */
  var selectedMuscleId = 'chest';
  var threeCtx = null; // Persistent singleton 3D context

  // Helper to sculpt an anatomical 3D muscle mesh with custom tapering/contouring
  function createSculptedMesh(THREE, opts, mat, wireMat) {
    var segW = opts.segW || 22;
    var segH = opts.segH || 16;
    var geo;
    if (opts.type === 'cylinder') {
      geo = new THREE.CylinderGeometry(
        opts.rTop !== undefined ? opts.rTop : 1,
        opts.rBot !== undefined ? opts.rBot : 1,
        opts.height || 1,
        segW,
        segH
      );
    } else {
      geo = new THREE.SphereGeometry(1, segW, segH);
    }

    var pos = geo.attributes.position;
    var sx = opts.sx || 0.1;
    var sy = opts.sy || 0.1;
    var sz = opts.sz || 0.1;
    var shapeFn = opts.shapeFn || null;

    for (var i = 0; i < pos.count; i++) {
      var vx = pos.getX(i);
      var vy = pos.getY(i);
      var vz = pos.getZ(i);

      if (shapeFn) {
        var mod = shapeFn(vx, vy, vz);
        vx = mod[0];
        vy = mod[1];
        vz = mod[2];
      }

      pos.setXYZ(i, vx * sx, vy * sy, vz * sz);
    }
    geo.computeVertexNormals();

    var mesh = new THREE.Mesh(geo, mat);
    if (opts.pos) mesh.position.set(opts.pos[0], opts.pos[1], opts.pos[2]);
    if (opts.rot) mesh.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);

    if (wireMat) {
      var edgesGeo = new THREE.EdgesGeometry(geo, 16);
      var wire = new THREE.LineSegments(edgesGeo, wireMat);
      mesh.add(wire);
    }

    return mesh;
  }

  function buildThreeHunterScene() {
    var THREE = window.THREE;
    if (!THREE) return null;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.12, 6.2);

    // Tactical Multi-Point Studio Lighting (Front, Back, Rim, Core)
    var ambient = new THREE.AmbientLight(0x88A4C8, 0.72);
    scene.add(ambient);

    var keyLight = new THREE.DirectionalLight(0xE2F1FF, 0.95);
    keyLight.position.set(2.8, 4.2, 4.5);
    scene.add(keyLight);

    var backLight = new THREE.DirectionalLight(0x90E0EF, 0.78);
    backLight.position.set(-2.5, 3.2, -4.5);
    scene.add(backLight);

    var rimCyan = new THREE.PointLight(0x00F0FF, 0.75, 12);
    rimCyan.position.set(0, -1.6, 2.2);
    scene.add(rimCyan);

    var topFill = new THREE.DirectionalLight(0x38BDF8, 0.42);
    topFill.position.set(0, 5.5, 0);
    scene.add(topFill);

    var rootGroup = new THREE.Group();
    var bodyGroup = new THREE.Group();
    rootGroup.add(bodyGroup);
    scene.add(rootGroup);

    // Base Non-Muscle Structural Materials (Head, Hair, Neck, Hands, Feet, Spine Core)
    var baseBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1F2737,
      roughness: 0.55,
      metalness: 0.28,
      emissive: 0x09101D,
      emissiveIntensity: 0.25
    });
    var darkCoreMat = new THREE.MeshStandardMaterial({
      color: 0x141B26,
      roughness: 0.65,
      metalness: 0.35
    });
    var hairMat = new THREE.MeshStandardMaterial({
      color: 0x101622,
      roughness: 0.45,
      metalness: 0.35,
      emissive: 0x061528,
      emissiveIntensity: 0.2
    });
    var eyeGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00F0FF
    });
    var jointRingMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });

    // --- 1. HOLOGRAPHIC SYSTEM PEDESTAL ---
    var pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -2.14, 0);

    var outerRingGeo = new THREE.RingGeometry(0.95, 1.02, 48);
    var outerRingMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    var outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    pedestalGroup.add(outerRing);

    var innerRingGeo = new THREE.RingGeometry(0.62, 0.65, 36);
    var innerRingMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    var innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    pedestalGroup.add(innerRing);

    var discGeo = new THREE.CircleGeometry(0.95, 48);
    var discMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
    var disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -0.01;
    pedestalGroup.add(disc);

    rootGroup.add(pedestalGroup);

    // --- 2. BASE SKELETAL / MANNEQUIN CORE (Head, Spiky Hair, Glowing Eyes, Torso Core, Joints, Hands, Feet) ---
    // Head sculpted cranium + jaw
    var headMesh = createSculptedMesh(THREE, {
      sx: 0.21, sy: 0.27, sz: 0.23,
      pos: [0, 1.66, 0.02],
      shapeFn: function (x, y, z) {
        // Taper chin on lower half
        var jawTaper = y < 0 ? (1 + y * 0.38) : (1 - y * 0.06);
        var frontBrow = (z > 0 && y > -0.1 && y < 0.35) ? 1.06 : 1.0;
        return [x * jawTaper, y, z * jawTaper * frontBrow];
      }
    }, baseBodyMat);
    bodyGroup.add(headMesh);

    // Sung Jin-Woo style glowing Hunter eyes (Front of face: z > 0)
    [-1, 1].forEach(function (s) {
      var eyeGeo = new THREE.BoxGeometry(0.065, 0.016, 0.02);
      var eye = new THREE.Mesh(eyeGeo, eyeGlowMat);
      eye.position.set(s * 0.072, 1.66, 0.235);
      eye.rotation.z = s * -0.14;
      eye.rotation.y = s * 0.22;
      bodyGroup.add(eye);
    });

    // Stylized Manhwa Spiky Hair Crown
    var hairCrown = createSculptedMesh(THREE, {
      sx: 0.235, sy: 0.19, sz: 0.25,
      pos: [0, 1.77, -0.01],
      shapeFn: function (x, y, z) {
        var spike = 1 + 0.12 * Math.sin(x * 9) * Math.cos(z * 9);
        return [x * spike, y * spike, z * spike];
      }
    }, hairMat);
    bodyGroup.add(hairCrown);

    // Individual hair spikes around crown & bangs
    var spikeSpecs = [
      [0, 1.94, 0.08, 0.3, 0, 0],
      [-0.10, 1.92, 0.06, 0.25, 0, 0.35],
      [0.10, 1.92, 0.06, 0.25, 0, -0.35],
      [-0.17, 1.84, 0.02, 0.15, 0, 0.65],
      [0.17, 1.84, 0.02, 0.15, 0, -0.65],
      [0, 1.91, -0.12, -0.35, 0, 0],
      [-0.12, 1.85, -0.14, -0.35, 0, 0.4],
      [0.12, 1.85, -0.14, -0.35, 0, -0.4],
      [-0.06, 1.76, 0.22, 0.65, 0, 0.15],
      [0.05, 1.77, 0.22, 0.65, 0, -0.12]
    ];
    spikeSpecs.forEach(function (sp) {
      var coneGeo = new THREE.ConeGeometry(0.055, 0.18, 6);
      var cone = new THREE.Mesh(coneGeo, hairMat);
      cone.position.set(sp[0], sp[1], sp[2]);
      cone.rotation.set(sp[3], sp[4], sp[5]);
      bodyGroup.add(cone);
    });

    // Neck cylinder
    var neckMesh = createSculptedMesh(THREE, {
      type: 'cylinder', rTop: 0.115, rBot: 0.14, height: 0.26,
      sx: 1, sy: 1, sz: 0.92,
      pos: [0, 1.36, 0]
    }, baseBodyMat);
    bodyGroup.add(neckMesh);

    // Inner Thoracic & Lumbar Core (fills gaps between front & back muscle plates)
    var torsoCore = createSculptedMesh(THREE, {
      type: 'cylinder', rTop: 0.38, rBot: 0.27, height: 1.18,
      sx: 1.0, sy: 1.0, sz: 0.62,
      pos: [0, 0.62, 0]
    }, darkCoreMat);
    bodyGroup.add(torsoCore);

    // Pelvis / Hip Core
    var pelvisCore = createSculptedMesh(THREE, {
      sx: 0.33, sy: 0.20, sz: 0.20,
      pos: [0, -0.06, 0]
    }, darkCoreMat);
    bodyGroup.add(pelvisCore);

    // Symmetrical Arm Cores, Elbows, Wrists, Hands, Knees, Shins, Ankles & Feet
    [-1, 1].forEach(function (s) {
      // Humerus / Forearm inner bone core
      var upperArmCore = createSculptedMesh(THREE, {
        type: 'cylinder', rTop: 0.085, rBot: 0.075, height: 0.56,
        sx: 1, sy: 1, sz: 1,
        pos: [s * 0.65, 0.68, -0.01],
        rot: [0, 0, s * -0.17]
      }, darkCoreMat);
      bodyGroup.add(upperArmCore);

      // Elbow joint
      var elbow = createSculptedMesh(THREE, {
        sx: 0.095, sy: 0.085, sz: 0.09,
        pos: [s * 0.72, 0.40, -0.01]
      }, baseBodyMat);
      bodyGroup.add(elbow);

      // Hand & Fingers
      var hand = createSculptedMesh(THREE, {
        sx: 0.068, sy: 0.135, sz: 0.042,
        pos: [s * 0.87, -0.15, 0.05],
        rot: [0.08, 0, s * -0.12]
      }, baseBodyMat);
      bodyGroup.add(hand);

      // Knee patella & joint
      var knee = createSculptedMesh(THREE, {
        sx: 0.125, sy: 0.115, sz: 0.125,
        pos: [s * 0.255, -1.04, 0.02]
      }, baseBodyMat);
      bodyGroup.add(knee);

      // Anterior Shin (Tibialis bone crest)
      var shinBone = createSculptedMesh(THREE, {
        type: 'cylinder', rTop: 0.095, rBot: 0.068, height: 0.76,
        sx: 0.9, sy: 1, sz: 0.92,
        pos: [s * 0.265, -1.48, 0.01]
      }, darkCoreMat);
      bodyGroup.add(shinBone);

      // Foot / Tactical Boot silhouette
      var foot = createSculptedMesh(THREE, {
        sx: 0.115, sy: 0.085, sz: 0.23,
        pos: [s * 0.27, -2.04, 0.07],
        rot: [0, s * -0.08, 0],
        shapeFn: function (x, y, z) {
          var fy = y < 0 ? y * 0.45 : y;
          var fz = z > 0 ? z * 1.15 : z * 0.75;
          return [x, fy, fz];
        }
      }, baseBodyMat);
      bodyGroup.add(foot);
    });

    // --- 3. CREATE MATERIALS & REGISTRY FOR ALL 15 ANATOMICAL MUSCLE GROUPS ---
    var muscleMaterials = {};
    var muscleWireMaterials = {};
    var muscleMeshes = {};
    var pickableMeshes = [];

    MUSCLES.forEach(function (m) {
      var mat = new THREE.MeshStandardMaterial({
        color: 0x2D3545,
        emissive: 0x1E293B,
        emissiveIntensity: 0.08,
        roughness: 0.36,
        metalness: 0.22
      });
      var wireMat = new THREE.LineBasicMaterial({
        color: 0x4A5568,
        transparent: true,
        opacity: 0.28
      });
      muscleMaterials[m.id] = mat;
      muscleWireMaterials[m.id] = wireMat;
      muscleMeshes[m.id] = [];
    });

    function addMusclePart(muscleId, opts) {
      var mat = muscleMaterials[muscleId];
      var wireMat = muscleWireMaterials[muscleId];
      var mesh = createSculptedMesh(THREE, opts, mat, wireMat);
      mesh.userData.muscleId = muscleId;
      mesh.userData.baseScale = mesh.scale.clone();
      bodyGroup.add(mesh);
      muscleMeshes[muscleId].push(mesh);
      pickableMeshes.push(mesh);
      return mesh;
    }

    // =========================================================================
    // SCULPTING THE 15 ANATOMICAL MUSCLE REGIONS IN 3D
    // =========================================================================

    // 1. CHEST (Pectoralis Major: Upper Clavicular, Mid Sternal, Lower Costal)
    [-1, 1].forEach(function (s) {
      // Upper Clavicular Pectoral
      addMusclePart('chest', {
        sx: 0.21, sy: 0.095, sz: 0.115,
        pos: [s * 0.20, 1.03, 0.19],
        rot: [-0.18, s * 0.16, s * -0.08],
        shapeFn: function (x, y, z) {
          var flatZ = z > 0 ? Math.pow(z, 0.75) : z * 0.5;
          return [x, y, flatZ];
        }
      });
      // Mid Sternal Pectoral (Main chest plate)
      addMusclePart('chest', {
        sx: 0.225, sy: 0.135, sz: 0.135,
        pos: [s * 0.205, 0.87, 0.215],
        rot: [0.02, s * 0.14, s * -0.03],
        shapeFn: function (x, y, z) {
          // Squared inner sternal border, rounded outer sweep
          var flatZ = z > 0 ? Math.pow(z, 0.68) : z * 0.45;
          var syMod = 1 - 0.12 * Math.pow(x, 2);
          return [x, y * syMod, flatZ];
        }
      });
      // Lower Costal Pectoral
      addMusclePart('chest', {
        sx: 0.20, sy: 0.068, sz: 0.11,
        pos: [s * 0.20, 0.74, 0.20],
        rot: [0.22, s * 0.14, s * 0.08]
      });
    });

    // 2. SHOULDERS (Deltoids: Anterior, Lateral Cap, Posterior)
    [-1, 1].forEach(function (s) {
      // Lateral Deltoid Cap (Outer 3D Teardrop)
      addMusclePart('shoulders', {
        sx: 0.155, sy: 0.21, sz: 0.165,
        pos: [s * 0.54, 1.02, 0.0],
        rot: [0, 0, s * -0.22],
        shapeFn: function (x, y, z) {
          // Teardrop taper toward the humerus insertion at y < 0
          var taper = y < 0 ? (1 + y * 0.45) : 1.05;
          return [x * taper, y, z * taper];
        }
      });
      // Anterior Deltoid Head (Front)
      addMusclePart('shoulders', {
        sx: 0.125, sy: 0.18, sz: 0.125,
        pos: [s * 0.46, 1.03, 0.11],
        rot: [0.15, s * 0.25, s * -0.28]
      });
      // Posterior Deltoid Head (Back)
      addMusclePart('shoulders', {
        sx: 0.13, sy: 0.17, sz: 0.12,
        pos: [s * 0.46, 1.02, -0.11],
        rot: [-0.15, s * -0.25, s * -0.28]
      });
    });

    // 3. TRAPS (Trapezius: Upper Collar Sweeps + Posterior Diamond Yoke)
    [-1, 1].forEach(function (s) {
      // Upper Traps (visible from both Front & Back)
      addMusclePart('traps', {
        sx: 0.22, sy: 0.11, sz: 0.13,
        pos: [s * 0.24, 1.22, -0.02],
        rot: [0.08, 0, s * -0.42]
      });
      // Mid/Lower Diamond Traps on Upper-Mid Back
      addMusclePart('traps', {
        sx: 0.14, sy: 0.28, sz: 0.095,
        pos: [s * 0.09, 0.96, -0.20],
        rot: [0.06, s * -0.1, s * 0.16],
        shapeFn: function (x, y, z) {
          var diamond = 1 - Math.abs(y) * 0.35;
          return [x * diamond, y, z];
        }
      });
    });

    // 4. BICEPS (Biceps Brachii: Anterior Upper Arm)
    [-1, 1].forEach(function (s) {
      addMusclePart('biceps', {
        sx: 0.105, sy: 0.23, sz: 0.11,
        pos: [s * 0.63, 0.67, 0.075],
        rot: [0.06, s * 0.15, s * -0.17],
        shapeFn: function (x, y, z) {
          var peak = 1 + 0.18 * Math.cos(y * 1.5);
          return [x * peak, y, z * peak];
        }
      });
    });

    // 5. TRICEPS (Triceps Brachii: Posterior & Outer Horseshoe Upper Arm)
    [-1, 1].forEach(function (s) {
      // Long & Medial Head (Back of arm)
      addMusclePart('triceps', {
        sx: 0.11, sy: 0.24, sz: 0.11,
        pos: [s * 0.65, 0.68, -0.075],
        rot: [-0.05, 0, s * -0.17]
      });
      // Outer Lateral Horseshoe Head (Visible from Front, Side & Back!)
      addMusclePart('triceps', {
        sx: 0.075, sy: 0.20, sz: 0.095,
        pos: [s * 0.71, 0.70, -0.01],
        rot: [0, 0, s * -0.18]
      });
    });

    // 6. FOREARMS (Brachioradialis, Flexors & Extensors)
    [-1, 1].forEach(function (s) {
      // Anterior/Lateral Brachioradialis & Flexors
      addMusclePart('forearms', {
        sx: 0.10, sy: 0.27, sz: 0.095,
        pos: [s * 0.79, 0.14, 0.03],
        rot: [0.09, 0, s * -0.14],
        shapeFn: function (x, y, z) {
          // Thick near elbow (y > 0), tapered toward wrist (y < 0)
          var wristTaper = 0.78 + (y + 1) * 0.22;
          return [x * wristTaper, y, z * wristTaper];
        }
      });
      // Posterior Extensors
      addMusclePart('forearms', {
        sx: 0.085, sy: 0.25, sz: 0.085,
        pos: [s * 0.80, 0.15, -0.025],
        rot: [0.09, 0, s * -0.14],
        shapeFn: function (x, y, z) {
          var wristTaper = 0.75 + (y + 1) * 0.23;
          return [x * wristTaper, y, z * wristTaper];
        }
      });
    });

    // 7. ABS (Rectus Abdominis: 8-Pack Segmented Bellies)
    var abRows = [
      { y: 0.60, sx: 0.105, sy: 0.068, sz: 0.085, z: 0.205 },
      { y: 0.44, sx: 0.110, sy: 0.070, sz: 0.090, z: 0.215 },
      { y: 0.28, sx: 0.105, sy: 0.068, sz: 0.088, z: 0.210 },
      { y: 0.09, sx: 0.098, sy: 0.105, sz: 0.082, z: 0.195 }
    ];
    abRows.forEach(function (row, rIdx) {
      [-1, 1].forEach(function (s) {
        addMusclePart('abs', {
          sx: row.sx, sy: row.sy, sz: row.sz,
          pos: [s * 0.098, row.y, row.z],
          rot: [rIdx === 3 ? 0.12 : 0, s * 0.08, 0],
          shapeFn: function (x, y, z) {
            var blockZ = z > 0 ? Math.pow(z, 0.72) : z * 0.4;
            return [x, y, blockZ];
          }
        });
      });
    });

    // 8. OBLIQUES & SERRATUS (Flanks framing the core)
    [-1, 1].forEach(function (s) {
      // Serratus Anterior (Upper Ribcage Fingers)
      addMusclePart('obliques', {
        sx: 0.11, sy: 0.16, sz: 0.13,
        pos: [s * 0.31, 0.56, 0.11],
        rot: [0.05, s * 0.45, s * 0.12]
      });
      // External Oblique V-Taper Flank
      addMusclePart('obliques', {
        sx: 0.115, sy: 0.24, sz: 0.145,
        pos: [s * 0.27, 0.26, 0.09],
        rot: [0.06, s * 0.42, s * 0.16],
        shapeFn: function (x, y, z) {
          var taper = 0.85 + (y + 1) * 0.12;
          return [x * taper, y, z];
        }
      });
    });

    // 9. LATS (Latissimus Dorsi: Sweeping V-Taper Wings visible Back & Front)
    [-1, 1].forEach(function (s) {
      // Main Posterior Lat Wing
      addMusclePart('lats', {
        sx: 0.21, sy: 0.34, sz: 0.13,
        pos: [s * 0.27, 0.62, -0.15],
        rot: [-0.08, s * -0.28, s * -0.26],
        shapeFn: function (x, y, z) {
          // Wide at top (y > 0), tapering toward waist (y < 0)
          var vTaper = 0.68 + (y + 1) * 0.32;
          return [x * vTaper, y, z];
        }
      });
      // Lateral Lat Flare (Visible from Front & Side under armpit!)
      addMusclePart('lats', {
        sx: 0.10, sy: 0.24, sz: 0.12,
        pos: [s * 0.39, 0.72, -0.02],
        rot: [0, 0, s * -0.24]
      });
    });

    // 10. UPPER BACK (Rhomboids, Infraspinatus & Teres Major)
    [-1, 1].forEach(function (s) {
      addMusclePart('upper_back', {
        sx: 0.185, sy: 0.175, sz: 0.11,
        pos: [s * 0.24, 0.94, -0.18],
        rot: [-0.08, s * -0.22, s * -0.18]
      });
    });

    // 11. LOWER BACK (Erector Spinae Lumbar Columns)
    [-1, 1].forEach(function (s) {
      addMusclePart('lower_back', {
        sx: 0.105, sy: 0.28, sz: 0.095,
        pos: [s * 0.11, 0.28, -0.17],
        rot: [0.04, s * -0.08, s * 0.06]
      });
    });

    // 12. GLUTES (Gluteus Maximus & Medius)
    [-1, 1].forEach(function (s) {
      addMusclePart('glutes', {
        sx: 0.195, sy: 0.215, sz: 0.175,
        pos: [s * 0.19, -0.14, -0.17],
        rot: [0.08, s * -0.12, s * -0.05],
        shapeFn: function (x, y, z) {
          var roundZ = z < 0 ? Math.pow(Math.abs(z), 0.82) * -1.12 : z * 0.5;
          return [x, y, roundZ];
        }
      });
    });

    // 13. QUADS (Quadriceps: Rectus Femoris, Vastus Lateralis Sweep, Vastus Medialis Teardrop)
    [-1, 1].forEach(function (s) {
      // Rectus Femoris (Center Front Thigh)
      addMusclePart('quads', {
        sx: 0.115, sy: 0.42, sz: 0.135,
        pos: [s * 0.245, -0.56, 0.115],
        rot: [-0.04, 0, s * -0.03],
        shapeFn: function (x, y, z) {
          var taper = 1 - Math.abs(y) * 0.18;
          return [x * taper, y, z * taper];
        }
      });
      // Vastus Lateralis (Outer Quad Sweep)
      addMusclePart('quads', {
        sx: 0.125, sy: 0.43, sz: 0.145,
        pos: [s * 0.335, -0.54, 0.03],
        rot: [0, 0, s * -0.06],
        shapeFn: function (x, y, z) {
          var sweep = 1 + 0.18 * Math.cos(y * 1.4);
          return [x * sweep, y, z];
        }
      });
      // Vastus Medialis (Inner Quad Teardrop above Knee)
      addMusclePart('quads', {
        sx: 0.11, sy: 0.36, sz: 0.12,
        pos: [s * 0.175, -0.62, 0.08],
        rot: [0, 0, s * 0.04],
        shapeFn: function (x, y, z) {
          // Bulges lower near the knee (y < 0)
          var teardrop = y < 0 ? 1.14 : 0.85;
          return [x * teardrop, y, z * teardrop];
        }
      });
    });

    // 14. HAMSTRINGS (Biceps Femoris & Semitendinosus: Posterior Thigh)
    [-1, 1].forEach(function (s) {
      // Lateral Biceps Femoris
      addMusclePart('hamstrings', {
        sx: 0.115, sy: 0.39, sz: 0.125,
        pos: [s * 0.295, -0.60, -0.105],
        rot: [0.03, 0, s * -0.03]
      });
      // Medial Semitendinosus
      addMusclePart('hamstrings', {
        sx: 0.11, sy: 0.39, sz: 0.12,
        pos: [s * 0.195, -0.60, -0.105],
        rot: [0.03, 0, s * 0.02]
      });
    });

    // 15. CALVES (Gastrocnemius Medial/Lateral Diamond Heads & Soleus)
    [-1, 1].forEach(function (s) {
      // Upper Gastrocnemius Medial & Lateral Diamond Heads
      addMusclePart('calves', {
        sx: 0.088, sy: 0.26, sz: 0.115,
        pos: [s * 0.22, -1.36, -0.075],
        rot: [-0.04, 0, s * 0.02],
        shapeFn: function (x, y, z) {
          // Diamond bulge in upper half (y > -0.2)
          var gastroc = y > -0.2 ? 1.15 : 0.72;
          return [x * gastroc, y, z * gastroc];
        }
      });
      addMusclePart('calves', {
        sx: 0.092, sy: 0.27, sz: 0.115,
        pos: [s * 0.31, -1.37, -0.065],
        rot: [-0.04, 0, s * -0.03],
        shapeFn: function (x, y, z) {
          var gastroc = y > -0.2 ? 1.15 : 0.72;
          return [x * gastroc, y, z * gastroc];
        }
      });
      // Lower Soleus & Anterior Tibialis sweep (visible from Front & Back)
      addMusclePart('calves', {
        sx: 0.115, sy: 0.38, sz: 0.105,
        pos: [s * 0.268, -1.48, 0.015],
        rot: [0, 0, 0],
        shapeFn: function (x, y, z) {
          var ankleTaper = 0.72 + (y + 1) * 0.24;
          return [x * ankleTaper, y, z * ankleTaper];
        }
      });
    });

    return {
      THREE: THREE,
      renderer: renderer,
      scene: scene,
      camera: camera,
      rootGroup: rootGroup,
      bodyGroup: bodyGroup,
      pedestalGroup: pedestalGroup,
      outerRing: outerRing,
      innerRing: innerRing,
      muscleMaterials: muscleMaterials,
      muscleWireMaterials: muscleWireMaterials,
      muscleMeshes: muscleMeshes,
      pickableMeshes: pickableMeshes,
      raycaster: new THREE.Raycaster(),
      pointerNdc: new THREE.Vector2(),
      currentYaw: 0,
      targetYaw: 0,
      currentPitch: 0.06,
      targetPitch: 0.06,
      cameraDist: 6.05,
      targetDist: 6.05,
      autoSpin: false,
      wireframeOverlay: true,
      isDragging: false,
      dragMoved: 0,
      lastX: 0,
      lastY: 0,
      rafId: null,
      mountEl: null,
      calloutEl: null,
      angleBadgeEl: null,
      onSelectMuscle: null
    };
  }

  // Shortest-path angle interpolation so rotating between 0 and PI is always smooth
  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function setTargetYawShortest(ctx, desiredYaw) {
    var diff = normalizeAngle(desiredYaw - ctx.currentYaw);
    ctx.targetYaw = ctx.currentYaw + diff;
  }

  // Update 3D materials, emissive brightness, wireframe glow, and hypertrophy pump scale
  function syncThreeMuscleVisuals(ctx, visualsMap, selId) {
    if (!ctx) return;
    var THREE = ctx.THREE;

    MUSCLES.forEach(function (m) {
      var v = visualsMap[m.id] || S.getMuscleVisuals(0);
      var isSel = m.id === selId;
      var mat = ctx.muscleMaterials[m.id];
      var wireMat = ctx.muscleWireMaterials[m.id];
      if (!mat || !wireMat) return;

      mat.color.set(v.fill);
      if (isSel) {
        mat.emissive.set(v.tierIdx > 0 ? v.hiColor : '#00E5FF');
        mat.emissiveIntensity = Math.max(0.42, v.emissiveIntensity + 0.25);
        mat.roughness = 0.24;
      } else {
        mat.emissive.set(v.tierIdx > 0 ? v.fill : '#111827');
        mat.emissiveIntensity = v.emissiveIntensity;
        mat.roughness = v.tierIdx > 0 ? 0.28 : 0.48;
      }

      if (isSel) {
        wireMat.color.set('#FFFFFF');
        wireMat.opacity = 0.92;
      } else if (v.tierIdx > 0) {
        wireMat.color.set(v.stroke);
        wireMat.opacity = ctx.wireframeOverlay ? Math.min(0.82, 0.32 + v.tierIdx * 0.1) : 0.12;
      } else {
        wireMat.color.set('#475569');
        wireMat.opacity = ctx.wireframeOverlay ? 0.24 : 0.06;
      }

      // Subtle 3D hypertrophy pump scale as muscle sets increase
      var pump = 1 + (v.tierIdx * 0.012) + (isSel ? 0.025 : 0);
      var meshes = ctx.muscleMeshes[m.id] || [];
      for (var i = 0; i < meshes.length; i++) {
        var mesh = meshes[i];
        var bs = mesh.userData.baseScale;
        if (bs) {
          mesh.scale.set(bs.x * pump, bs.y * pump, bs.z * pump);
        }
      }
    });
  }

  function startThreeLoop(ctx) {
    if (!ctx || ctx.rafId) return;
    var clockStart = performance.now();

    function animate(now) {
      if (!ctx.mountEl || !document.body.contains(ctx.mountEl)) {
        ctx.rafId = null;
        return;
      }
      ctx.rafId = requestAnimationFrame(animate);

      var elapsed = (now - clockStart) * 0.001;

      if (ctx.autoSpin && !ctx.isDragging) {
        ctx.targetYaw += 0.0065;
      }

      // Smooth damping for 360° rotation and zoom
      ctx.currentYaw += (ctx.targetYaw - ctx.currentYaw) * 0.14;
      ctx.currentPitch += (ctx.targetPitch - ctx.currentPitch) * 0.14;
      ctx.cameraDist += (ctx.targetDist - ctx.cameraDist) * 0.16;

      ctx.bodyGroup.rotation.y = ctx.currentYaw;
      ctx.bodyGroup.rotation.x = ctx.currentPitch;

      // Subtle breathing idle animation on the Hunter body
      ctx.bodyGroup.position.y = Math.sin(elapsed * 2.1) * 0.022;

      // Rotate holographic pedestal rings
      if (ctx.outerRing) ctx.outerRing.rotation.z = elapsed * 0.45;
      if (ctx.innerRing) ctx.innerRing.rotation.z = -elapsed * 0.7;

      // Pulse the currently selected muscle's emissive glow
      var selMat = ctx.muscleMaterials[selectedMuscleId];
      if (selMat) {
        var pulse = 0.5 + 0.5 * Math.sin(elapsed * 5.0);
        selMat.emissiveIntensity = 0.34 + pulse * 0.34;
      }

      ctx.camera.position.z = ctx.cameraDist;
      ctx.renderer.render(ctx.scene, ctx.camera);

      // Update live compass angle badge
      if (ctx.angleBadgeEl) {
        var deg = ((Math.round((ctx.currentYaw * 180) / Math.PI) % 360) + 360) % 360;
        var facing = (deg >= 315 || deg < 45) ? 'ANTERIOR // FRONT'
          : (deg >= 135 && deg < 225) ? 'POSTERIOR // BACK'
          : (deg >= 45 && deg < 135) ? 'LATERAL // LEFT'
          : 'LATERAL // RIGHT';
        ctx.angleBadgeEl.textContent = facing + ' (' + deg + '°)';
      }

      // Project selected muscle 3D focus point to 2D HUD Callout Pin
      if (ctx.calloutEl && MUSCLE_MAP[selectedMuscleId]) {
        var selM = MUSCLE_MAP[selectedMuscleId];
        var fp = selM.focusPos || [0, 0.5, 0];
        var worldVec = new ctx.THREE.Vector3(fp[0], fp[1], fp[2]);
        worldVec.applyEuler(ctx.bodyGroup.rotation);
        worldVec.y += ctx.bodyGroup.position.y;
        worldVec.project(ctx.camera);

        var rect = ctx.mountEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          var sx = (worldVec.x * 0.5 + 0.5) * rect.width;
          var sy = (-worldVec.y * 0.5 + 0.5) * rect.height;
          sx = Math.max(76, Math.min(rect.width - 76, sx));
          sy = Math.max(48, Math.min(rect.height - 62, sy));
          ctx.calloutEl.style.transform = 'translate3d(' + Math.round(sx) + 'px, ' + Math.round(sy) + 'px, 0)';
        }
      }
    }

    ctx.rafId = requestAnimationFrame(animate);
  }

  function mountThreeViewport(mountEl, visualsMap, onSelectMuscle) {
    if (!window.THREE) {
      mountEl.innerHTML = '<div class="font-mono text-muted" style="padding:40px; text-align:center;">[3D ENGINE INITIALIZING...]</div>';
      return;
    }

    if (!threeCtx) {
      threeCtx = buildThreeHunterScene();
      if (threeCtx) {
        var dom = threeCtx.renderer.domElement;
        dom.className = 'vessel-3d-canvas';
        dom.style.touchAction = 'none';

        // Pointer / Touch Drag-to-Rotate + Tap-to-Select Raycasting
        var onPointerDown = function (e) {
          threeCtx.isDragging = true;
          threeCtx.dragMoved = 0;
          threeCtx.lastX = e.clientX;
          threeCtx.lastY = e.clientY;
          if (dom.setPointerCapture && e.pointerId !== undefined) {
            try { dom.setPointerCapture(e.pointerId); } catch (err) {}
          }
        };

        var onPointerMove = function (e) {
          if (!threeCtx.isDragging) return;
          var dx = e.clientX - threeCtx.lastX;
          var dy = e.clientY - threeCtx.lastY;
          threeCtx.lastX = e.clientX;
          threeCtx.lastY = e.clientY;
          threeCtx.dragMoved += Math.abs(dx) + Math.abs(dy);

          threeCtx.targetYaw += dx * 0.0115;
          threeCtx.targetPitch = Math.max(-0.42, Math.min(0.48, threeCtx.targetPitch + dy * 0.0065));
        };

        var onPointerUp = function (e) {
          if (!threeCtx.isDragging) return;
          threeCtx.isDragging = false;

          // If pointer barely moved (< 7px), treat as a 3D Raycast Tap to select a muscle!
          if (threeCtx.dragMoved < 7 && threeCtx.mountEl) {
            var rect = dom.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              threeCtx.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              threeCtx.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
              threeCtx.raycaster.setFromCamera(threeCtx.pointerNdc, threeCtx.camera);
              var hits = threeCtx.raycaster.intersectObjects(threeCtx.pickableMeshes, false);
              if (hits && hits.length > 0) {
                var hitMuscle = hits[0].object && hits[0].object.userData && hits[0].object.userData.muscleId;
                if (hitMuscle && MUSCLE_MAP[hitMuscle] && threeCtx.onSelectMuscle) {
                  threeCtx.onSelectMuscle(hitMuscle, false);
                }
              }
            }
          }
        };

        dom.addEventListener('pointerdown', onPointerDown);
        dom.addEventListener('pointermove', onPointerMove);
        dom.addEventListener('pointerup', onPointerUp);
        dom.addEventListener('pointercancel', function () { threeCtx.isDragging = false; });

        // Mouse wheel zoom
        dom.addEventListener('wheel', function (e) {
          e.preventDefault();
          var delta = e.deltaY > 0 ? 0.35 : -0.35;
          threeCtx.targetDist = Math.max(4.3, Math.min(8.0, threeCtx.targetDist + delta));
        }, { passive: false });

        window.addEventListener('resize', function () {
          if (threeCtx && threeCtx.mountEl) {
            resizeThreeViewport(threeCtx);
          }
        });
      }
    }

    if (!threeCtx) {
      mountEl.innerHTML = '<div class="font-mono text-muted" style="padding:40px; text-align:center;">[WEBGL 3D CONTEXT UNAVAILABLE]</div>';
      return;
    }

    threeCtx.mountEl = mountEl;
    threeCtx.onSelectMuscle = onSelectMuscle;
    mountEl.insertBefore(threeCtx.renderer.domElement, mountEl.firstChild);

    resizeThreeViewport(threeCtx);
    syncThreeMuscleVisuals(threeCtx, visualsMap, selectedMuscleId);
    startThreeLoop(threeCtx);
  }

  function resizeThreeViewport(ctx) {
    if (!ctx || !ctx.mountEl) return;
    var w = Math.max(260, ctx.mountEl.clientWidth || 360);
    var h = Math.max(380, ctx.mountEl.clientHeight || 480);
    ctx.camera.aspect = w / h;
    ctx.camera.updateProjectionMatrix();
    ctx.renderer.setSize(w, h, false);
  }

  /* ============================================================================
      FULL PHYSIQUE / 3D MUSCLE ANATOMY VIEW RENDERER
     ============================================================================ */
  S.renderPhysiqueView = function (container) {
    var ml = S.ensureMuscleLog();
    if (ml.selectedMuscle && MUSCLE_MAP[ml.selectedMuscle]) {
      selectedMuscleId = ml.selectedMuscle;
      delete ml.selectedMuscle;
    }
    var tf = ml.timeframe || '7D';
    var pal = ml.palette || 'spectrum';
    var scores = S.getMuscleScores(tf);

    var visualsMap = {};
    var activeCount = 0;
    var totalSets = 0;
    MUSCLES.forEach(function (m) {
      var sVal = scores[m.id] || 0;
      totalSets += sVal;
      if (sVal > 0) activeCount++;
      visualsMap[m.id] = S.getMuscleVisuals(sVal, pal);
    });
    totalSets = Math.round(totalSets * 10) / 10;

    if (!MUSCLE_MAP[selectedMuscleId]) selectedMuscleId = 'chest';
    var selM = MUSCLE_MAP[selectedMuscleId];
    var selV = visualsMap[selectedMuscleId];
    var lastDate = (ml.lastTrained && ml.lastTrained[selectedMuscleId]) || 'Never';
    var syncPct = Math.round((activeCount / MUSCLES.length) * 100);

    var legendHtml = TIERS.map(function (t, idx) {
      var p = t[pal] || t.spectrum;
      var rangeTxt = idx === 0 ? '0' : (t.maxSets >= 999 ? (t.minSets + '+') : (t.minSets + '–' + t.maxSets));
      return '<div class="vessel-legend-pill">' +
        '<span class="vessel-legend-dot" style="background:' + p.hi + '; box-shadow:0 0 8px ' + p.glow + ';"></span>' +
        '<span class="font-mono" style="font-size:10px; color:' + p.text + '; font-weight:700;">' + t.rank + '</span>' +
        '<span class="font-mono" style="font-size:9.5px; color:var(--text-muted);">(' + rangeTxt + ' sets)</span>' +
      '</div>';
    }).join('');

    var isAutoSpin = !!(threeCtx && threeCtx.autoSpin);

    container.innerHTML =
      '<div class="vessel-layout">' +
        // Top Header Banner
        '<div class="system-panel" style="margin-bottom:14px;">' +
          '<div class="panel-header" style="flex-wrap:wrap; gap:10px; margin-bottom:10px;">' +
            '<div class="panel-title">' + I('str', 20) + ' [PLAYER VESSEL // 3D MUSCLE ACTIVATION MATRIX]</div>' +
            '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">' +
              '<div class="vessel-seg-group" role="group" aria-label="Timeframe">' +
                '<button type="button" class="vessel-seg-btn' + (tf === 'TODAY' ? ' active' : '') + '" data-tf="TODAY">TODAY</button>' +
                '<button type="button" class="vessel-seg-btn' + (tf === '7D' ? ' active' : '') + '" data-tf="7D">7 DAYS</button>' +
                '<button type="button" class="vessel-seg-btn' + (tf === '30D' ? ' active' : '') + '" data-tf="30D">30 DAYS</button>' +
                '<button type="button" class="vessel-seg-btn' + (tf === 'ALL' ? ' active' : '') + '" data-tf="ALL">ALL-TIME</button>' +
              '</div>' +
              '<select class="sys-select" id="vessel-palette-select" style="width:auto; height:28px; padding:2px 8px; font-size:10.5px; font-family:var(--font-mono);">' +
                '<option value="spectrum"' + (pal === 'spectrum' ? ' selected' : '') + '>COLOR: TACTICAL SPECTRUM</option>' +
                '<option value="neon"' + (pal === 'neon' ? ' selected' : '') + '>COLOR: SYSTEM CYAN NEON</option>' +
                '<option value="crimson"' + (pal === 'crimson' ? ' selected' : '') + '>COLOR: BLOOD OVERDRIVE</option>' +
              '</select>' +
            '</div>' +
          '</div>' +

          // Summary Stats Row
          '<div class="vessel-kpi-row">' +
            '<div class="vessel-kpi-card">' +
              '<div class="vessel-kpi-lbl">MUSCLES AWAKENED</div>' +
              '<div class="vessel-kpi-val text-accent">' + activeCount + ' / ' + MUSCLES.length + ' (' + syncPct + '%)</div>' +
            '</div>' +
            '<div class="vessel-kpi-card">' +
              '<div class="vessel-kpi-lbl">VOLUME LOGGED (' + tf + ')</div>' +
              '<div class="vessel-kpi-val text-gold">' + totalSets + ' SETS</div>' +
            '</div>' +
            '<div class="vessel-kpi-card">' +
              '<div class="vessel-kpi-lbl">SELECTED REGION</div>' +
              '<div class="vessel-kpi-val" style="font-size:16px; color:' + selV.textColor + ';">' + selM.short + ' // ' + selV.rank + '</div>' +
            '</div>' +
            '<div class="vessel-kpi-card">' +
              '<div class="vessel-kpi-lbl">LUMINESCENCE</div>' +
              '<div class="vessel-kpi-val" style="font-size:16px; color:' + selV.textColor + ';">' + Math.round(selV.brightness * 100) + '% BRIGHTNESS</div>' +
            '</div>' +
          '</div>' +

          // Color & Brightness Legend Bar
          '<div class="vessel-legend-bar" style="margin-top:10px;">' + legendHtml + '</div>' +
        '</div>' +

        // Main 2-Column Interactive Grid (3D WebGL Scanner Stage + Muscle Dossier & Roster)
        '<div class="vessel-main-grid">' +
          // LEFT: 3D Three.js Holographic Body Scanner
          '<div class="system-panel vessel-scanner-panel">' +
            '<div class="flex-between" style="margin-bottom:10px; flex-wrap:wrap; gap:8px;">' +
              '<span class="font-mono text-accent" style="font-size:11px; letter-spacing:0.06em;">' + I('radar', 14) + ' DRAG TO ROTATE 360° // TAP ANY 3D MUSCLE</span>' +
              '<div class="vessel-seg-group">' +
                '<button type="button" class="vessel-view-btn" data-cam-yaw="0">FRONT</button>' +
                '<button type="button" class="vessel-view-btn" data-cam-yaw="0.65">3/4</button>' +
                '<button type="button" class="vessel-view-btn" data-cam-yaw="1.57">SIDE</button>' +
                '<button type="button" class="vessel-view-btn" data-cam-yaw="3.1416">BACK</button>' +
                '<button type="button" class="vessel-view-btn' + (isAutoSpin ? ' active' : '') + '" id="btn-vessel-autospin">SPIN</button>' +
              '</div>' +
            '</div>' +

            // 3D WebGL Stage Container
            '<div class="vessel-3d-stage" id="vessel-3d-mount">' +
              // Top-left Live Orientation Telemetry Badge
              '<div class="vessel-3d-telemetry">' +
                '<span class="vessel-3d-angle" id="vessel-3d-angle-badge">ANTERIOR // FRONT (0°)</span>' +
                '<span class="vessel-3d-hint">SWIPE LEFT/RIGHT TO SEE BACK • PINCH/SCROLL TO ZOOM</span>' +
              '</div>' +

              // Top-right Zoom & Reset Controls
              '<div class="vessel-3d-zoom-bar">' +
                '<button type="button" class="vessel-zoom-btn" id="btn-vessel-zoom-in" title="Zoom In">+</button>' +
                '<button type="button" class="vessel-zoom-btn" id="btn-vessel-zoom-out" title="Zoom Out">-</button>' +
                '<button type="button" class="vessel-zoom-btn" id="btn-vessel-cam-reset" title="Reset Camera">RST</button>' +
              '</div>' +

              // Floating 3D-Projected Target Muscle Callout Tag
              '<div class="vessel-3d-callout" id="vessel-3d-callout" style="border-color:' + selV.fill + ';">' +
                '<span class="vessel-3d-callout-dot" style="background:' + selV.fill + '; box-shadow:0 0 8px ' + selV.fill + ';"></span>' +
                '<div>' +
                  '<div class="vessel-3d-callout-title">' + U.esc(selM.short) + ' <span style="color:' + selV.textColor + ';">// ' + selV.rank + '</span></div>' +
                  '<div class="vessel-3d-callout-sub">' + selV.sets + ' SETS • ' + Math.round(selV.brightness * 100) + '% LUMEN</div>' +
                '</div>' +
              '</div>' +

              // Bottom Quick Rotate & Quick Charge Bar inside 3D Viewport
              '<div class="vessel-3d-bottom-hud">' +
                '<button type="button" class="sys-btn sm" id="btn-vessel-flip-180">' + I('reroll', 12) + ' ROTATE 180° (FRONT / BACK)</button>' +
                '<button type="button" class="sys-btn sm primary btn-log-muscle" data-delta="1">+1 SET (' + selM.short + ')</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // RIGHT: Selected Muscle Dossier + Direct Training & Full 15-Muscle Matrix
          '<div class="vessel-control-col">' +
            // Selected Muscle Card
            '<div class="system-panel" style="margin-bottom:14px; border-color:' + selV.fill + '88;">' +
              '<div class="flex-between" style="margin-bottom:6px; gap:8px; flex-wrap:wrap;">' +
                '<div>' +
                  '<div class="font-display" style="font-size:17px; font-weight:700; color:var(--text-primary);">' + U.esc(selM.name.toUpperCase()) + '</div>' +
                  '<div class="font-mono" style="font-size:10.5px; color:var(--text-muted);">' + U.esc(selM.subgroups) + '</div>' +
                '</div>' +
                '<span class="sys-badge font-mono" style="color:' + selV.textColor + '; border-color:' + selV.fill + '; background:rgba(0,0,0,0.4);">' +
                  selV.rank + ' // ' + selV.code +
                '</span>' +
              '</div>' +

              // Brightness / Overdrive Bar
              '<div style="margin:10px 0;">' +
                '<div class="flex-between font-mono" style="font-size:10.5px; margin-bottom:4px;">' +
                  '<span style="color:var(--text-secondary);">LUMINESCENCE &amp; OVERDRIVE: <strong style="color:' + selV.textColor + ';">' + selV.sets + ' SETS</strong></span>' +
                  '<span style="color:var(--text-muted);">' + (selV.nextTierSets ? ('NEXT TIER AT ' + selV.nextTierSets + ' SETS') : 'MAX MONARCH TIER') + '</span>' +
                '</div>' +
                '<div class="progress-bar-wrap" style="height:10px;">' +
                  '<div class="progress-bar-fill" style="width:' + selV.overallPct + '%; background:' + selV.fill + '; box-shadow:0 0 10px ' + selV.fill + ';"></div>' +
                '</div>' +
                '<div class="flex-between font-mono" style="font-size:10px; color:var(--text-muted); margin-top:4px;">' +
                  '<span>BRIGHTNESS: ' + Math.round(selV.brightness * 100) + '%</span>' +
                  '<span>LAST TRAINED: ' + lastDate + '</span>' +
                '</div>' +
              '</div>' +

              // Fast Set Logging Buttons
              '<div style="margin-bottom:10px;">' +
                '<div class="font-mono" style="font-size:10px; color:var(--accent-core); letter-spacing:0.06em; margin-bottom:6px;">DIRECT MUSCLE CHARGE (LOG SETS)</div>' +
                '<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">' +
                  '<button type="button" class="sys-btn sm primary btn-log-muscle" data-delta="1">+1 SET</button>' +
                  '<button type="button" class="sys-btn sm primary btn-log-muscle" data-delta="3">+3 SETS</button>' +
                  '<button type="button" class="sys-btn sm gold btn-log-muscle" data-delta="5">+5 SETS</button>' +
                  '<button type="button" class="sys-btn sm danger btn-log-muscle" data-delta="-1">-1 SET</button>' +
                '</div>' +
              '</div>' +

              // Specific Exercises for Selected Muscle
              '<div>' +
                '<div class="font-mono" style="font-size:10px; color:var(--text-muted); letter-spacing:0.06em; margin-bottom:6px;">TAP EXERCISE TO LOG +3 SETS FOR ' + selM.short + ':</div>' +
                '<div style="display:flex; flex-wrap:wrap; gap:6px;">' +
                  selM.exercises.map(function (ex) {
                    return '<button type="button" class="forge-tpl-chip btn-quick-exercise" data-ex="' + U.esc(ex) + '">' +
                      '+ ' + U.esc(ex) +
                    '</button>';
                  }).join('') +
                '</div>' +
              '</div>' +
            '</div>' +

            // All 15 Muscle Regions Roster
            '<div class="system-panel">' +
              '<div class="flex-between" style="margin-bottom:8px;">' +
                '<div class="panel-title" style="font-size:13px;">' + I('layers', 15) + ' ALL 15 ANATOMICAL REGIONS</div>' +
                '<button type="button" class="sys-btn sm danger" id="btn-reset-all-muscles" style="padding:2px 8px; font-size:10px;">RESET MAP</button>' +
              '</div>' +
              '<div class="vessel-muscle-list">' +
                MUSCLES.map(function (m) {
                  var v = visualsMap[m.id];
                  var isSel = m.id === selectedMuscleId;
                  return '<button type="button" class="vessel-muscle-row' + (isSel ? ' active' : '') + '" data-select-muscle="' + m.id + '">' +
                    '<div style="display:flex; align-items:center; gap:8px;">' +
                      '<span class="vessel-legend-dot" style="background:' + v.fill + '; box-shadow:0 0 6px ' + v.fill + '; filter:brightness(' + v.brightness + ');"></span>' +
                      '<span class="font-mono" style="font-size:11.5px; font-weight:700; color:var(--text-primary);">' + U.esc(m.name) + '</span>' +
                    '</div>' +
                    '<div style="display:flex; align-items:center; gap:8px;">' +
                      '<span class="font-mono" style="font-size:10px; color:' + v.textColor + ';">' + v.rank + '</span>' +
                      '<span class="sys-badge font-mono" style="font-size:10px; min-width:52px; text-align:right; color:' + v.textColor + '; border-color:' + v.fill + '66;">' + v.sets + ' S</span>' +
                    '</div>' +
                  '</button>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Mount the 3D WebGL Viewport
    var mountEl = container.querySelector('#vessel-3d-mount');
    if (mountEl) {
      mountThreeViewport(mountEl, visualsMap, function (clickedMuscleId, rotateToPreferred) {
        selectedMuscleId = clickedMuscleId;
        if (rotateToPreferred && threeCtx && MUSCLE_MAP[clickedMuscleId]) {
          var pref = MUSCLE_MAP[clickedMuscleId].preferredYaw;
          if (typeof pref === 'number') setTargetYawShortest(threeCtx, pref);
        }
        if (S.audio) S.audio.tap();
        S.renderPhysiqueView(container);
      });
      if (threeCtx) {
        threeCtx.calloutEl = container.querySelector('#vessel-3d-callout');
        threeCtx.angleBadgeEl = container.querySelector('#vessel-3d-angle-badge');
      }
    }

    // Bind camera orientation buttons
    container.querySelectorAll('[data-cam-yaw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var yaw = Number(btn.getAttribute('data-cam-yaw'));
        if (threeCtx && !isNaN(yaw)) {
          threeCtx.autoSpin = false;
          setTargetYawShortest(threeCtx, yaw);
          threeCtx.targetPitch = 0.06;
          if (S.audio) S.audio.tap();
          var spinBtn = container.querySelector('#btn-vessel-autospin');
          if (spinBtn) spinBtn.classList.remove('active');
        }
      });
    });

    var flipBtn = container.querySelector('#btn-vessel-flip-180');
    if (flipBtn) {
      flipBtn.addEventListener('click', function () {
        if (threeCtx) {
          threeCtx.autoSpin = false;
          threeCtx.targetYaw += Math.PI;
          if (S.audio) S.audio.tap();
        }
      });
    }

    var spinBtn = container.querySelector('#btn-vessel-autospin');
    if (spinBtn) {
      spinBtn.addEventListener('click', function () {
        if (threeCtx) {
          threeCtx.autoSpin = !threeCtx.autoSpin;
          spinBtn.classList.toggle('active', threeCtx.autoSpin);
          if (S.audio) S.audio.tap();
        }
      });
    }

    var zoomInBtn = container.querySelector('#btn-vessel-zoom-in');
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', function () {
        if (threeCtx) threeCtx.targetDist = Math.max(4.3, threeCtx.targetDist - 0.55);
      });
    }

    var zoomOutBtn = container.querySelector('#btn-vessel-zoom-out');
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', function () {
        if (threeCtx) threeCtx.targetDist = Math.min(8.0, threeCtx.targetDist + 0.55);
      });
    }

    var camResetBtn = container.querySelector('#btn-vessel-cam-reset');
    if (camResetBtn) {
      camResetBtn.addEventListener('click', function () {
        if (threeCtx) {
          threeCtx.autoSpin = false;
          setTargetYawShortest(threeCtx, 0);
          threeCtx.targetPitch = 0.06;
          threeCtx.targetDist = 6.05;
        }
      });
    }

    // Bind roster muscle selection (rotates 3D model to show the chosen muscle!)
    container.querySelectorAll('[data-select-muscle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mId = btn.getAttribute('data-select-muscle');
        if (mId && MUSCLE_MAP[mId]) {
          selectedMuscleId = mId;
          if (threeCtx && typeof MUSCLE_MAP[mId].preferredYaw === 'number') {
            threeCtx.autoSpin = false;
            setTargetYawShortest(threeCtx, MUSCLE_MAP[mId].preferredYaw);
          }
          if (S.audio) S.audio.tap();
          S.renderPhysiqueView(container);
        }
      });
    });

    container.querySelectorAll('.vessel-seg-btn[data-tf]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var newTf = btn.getAttribute('data-tf');
        if (newTf) {
          ml.timeframe = newTf;
          S.save();
          if (S.audio) S.audio.tap();
          S.renderPhysiqueView(container);
        }
      });
    });

    var palSel = container.querySelector('#vessel-palette-select');
    if (palSel) {
      palSel.addEventListener('change', function () {
        ml.palette = palSel.value;
        S.save();
        if (S.audio) S.audio.tap();
        S.renderPhysiqueView(container);
      });
    }

    container.querySelectorAll('.btn-log-muscle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var delta = Number(btn.getAttribute('data-delta')) || 0;
        if (!delta) return;
        S.logMuscleSets(selectedMuscleId, delta);
        if (S.audio) {
          if (delta > 0) S.audio.questClear();
          else S.audio.tap();
        }
        var updatedV = S.getMuscleVisuals(S.getMuscleScores(ml.timeframe)[selectedMuscleId], ml.palette);
        if (delta > 0 && S.ui) {
          S.ui.showToast(
            '[VESSEL OVERDRIVE // ' + selM.short + ']',
            '+' + delta + (delta === 1 ? ' Set' : ' Sets') + ' logged -> ' + updatedV.rank + ' (' + updatedV.code + ')',
            'cyan'
          );
        }
        S.renderPhysiqueView(container);
      });
    });

    container.querySelectorAll('.btn-quick-exercise').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ex = btn.getAttribute('data-ex') || selM.name;
        var inferred = S.inferMusclesFromQuest({ title: ex, category: 'GYM' });
        S.logMuscleSets(selectedMuscleId, 3, ex);
        inferred.forEach(function (secId) {
          if (secId !== selectedMuscleId) {
            S.logMuscleSets(secId, 1.5, ex);
          }
        });
        if (S.audio) S.audio.questClear();
        var updatedV = S.getMuscleVisuals(S.getMuscleScores(ml.timeframe)[selectedMuscleId], ml.palette);
        if (S.ui) {
          S.ui.showToast(
            '[' + ex.toUpperCase() + ' LOGGED]',
            selM.short + ' charged (+3 Sets) -> ' + updatedV.rank,
            'gold'
          );
        }
        S.renderPhysiqueView(container);
      });
    });

    var btnReset = container.querySelector('#btn-reset-all-muscles');
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        S.resetMuscleProgress(null);
        if (S.audio) S.audio.tap();
        if (S.ui) S.ui.showToast('[VESSEL MATRIX RESET]', 'All muscle luminescence reset to Dormant state.', 'info');
        S.renderPhysiqueView(container);
      });
    }
  };
})(window.SYS);

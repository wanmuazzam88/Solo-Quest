/* ==============================================================================
   THE SYSTEM // PROJECT: ARISE — Player Vessel & Muscle Anatomy Matrix
   Interactive Solo Leveling anatomical muscle tracker with multi-tier color &
   brightness progression, automatic quest integration, and front/back SVG HUD.
   ============================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var U = S.util;
  var I = S.icon;

  // 15 Anatomical Muscle Groups
  var MUSCLES = [
    {
      id: 'chest',
      name: 'Chest (Pectorals)',
      short: 'CHEST',
      subgroups: 'Upper Clavicular · Mid Sternal · Lower Costal',
      side: 'FRONT',
      stat: 'STR',
      exercises: ['Push-ups', 'Barbell Bench Press', 'Incline Dumbbell Press', 'Weighted Chest Dips', 'Cable Flyes']
    },
    {
      id: 'shoulders',
      name: 'Shoulders (Deltoids)',
      short: 'DELTS',
      subgroups: 'Front Delt · Lateral Delt · Rear Delt',
      side: 'BOTH',
      stat: 'STR',
      exercises: ['Overhead Press', 'Lateral Raises', 'Pike Push-ups', 'Face Pulls', 'Arnold Press']
    },
    {
      id: 'traps',
      name: 'Trapezius (Upper / Mid)',
      short: 'TRAPS',
      subgroups: 'Upper Collar Traps · Mid Scapular Traps',
      side: 'BOTH',
      stat: 'STR',
      exercises: ['Barbell Shrugs', 'Farmer Walks', 'Upright Rows', 'Rack Pulls']
    },
    {
      id: 'biceps',
      name: 'Biceps Brachii',
      short: 'BICEPS',
      subgroups: 'Long Head · Short Head · Brachialis',
      side: 'FRONT',
      stat: 'STR',
      exercises: ['Barbell Curls', 'Hammer Curls', 'Chin-ups', 'Incline Dumbbell Curls', 'Preacher Curls']
    },
    {
      id: 'triceps',
      name: 'Triceps Brachii',
      short: 'TRICEPS',
      subgroups: 'Lateral Head · Long Head · Medial Head',
      side: 'BOTH',
      stat: 'STR',
      exercises: ['Diamond Push-ups', 'Tricep Rope Pushdowns', 'Skullcrushers', 'Overhead Extensions', 'Bench Dips']
    },
    {
      id: 'forearms',
      name: 'Forearms & Grip',
      short: 'FOREARMS',
      subgroups: 'Brachioradialis · Wrist Flexors · Extensors',
      side: 'BOTH',
      stat: 'STR',
      exercises: ['Dead Hangs', 'Reverse Curls', 'Wrist Curls', 'Farmer Carries']
    },
    {
      id: 'abs',
      name: 'Abdominals (6-Pack)',
      short: 'ABS',
      subgroups: 'Upper Abs · Mid Rectus · Lower V-Core',
      side: 'FRONT',
      stat: 'VIT',
      exercises: ['Sit-ups', 'Hanging Leg Raises', 'Ab Wheel Rollouts', 'Hollow Body Hold', 'Cable Crunches']
    },
    {
      id: 'obliques',
      name: 'Obliques & Serratus',
      short: 'OBLIQUES',
      subgroups: 'Serratus Anterior · External Obliques',
      side: 'FRONT',
      stat: 'VIT',
      exercises: ['Russian Twists', 'Side Planks', 'Woodchoppers', 'Bicycle Crunches']
    },
    {
      id: 'lats',
      name: 'Lats (V-Taper Wings)',
      short: 'LATS',
      subgroups: 'Latissimus Dorsi · Teres Major Sweep',
      side: 'BOTH',
      stat: 'STR',
      exercises: ['Pull-ups', 'Wide-Grip Lat Pulldowns', 'Single-Arm Dumbbell Rows', 'Straight-Arm Pulldowns']
    },
    {
      id: 'upper_back',
      name: 'Upper Back (Rhomboids)',
      short: 'UPPER BACK',
      subgroups: 'Rhomboids · Infraspinatus · Mid Back',
      side: 'BACK',
      stat: 'STR',
      exercises: ['Barbell Bent-Over Rows', 'Seated Cable Rows', 'Chest-Supported Rows', 'Inverted Rows']
    },
    {
      id: 'lower_back',
      name: 'Lower Back (Erectors)',
      short: 'LOWER BACK',
      subgroups: 'Erector Spinae · Lumbar Core',
      side: 'BACK',
      stat: 'VIT',
      exercises: ['Deadlifts', 'Back Extensions', 'Good Mornings', 'Superman Holds']
    },
    {
      id: 'quads',
      name: 'Quadriceps (Front Legs)',
      short: 'QUADS',
      subgroups: 'Rectus Femoris · Vastus Lateralis · Vastus Medialis',
      side: 'FRONT',
      stat: 'VIT',
      exercises: ['Squats', 'Bulgarian Split Squats', 'Leg Press', 'Lunges', 'Leg Extensions']
    },
    {
      id: 'hamstrings',
      name: 'Hamstrings (Rear Thighs)',
      short: 'HAMSTRINGS',
      subgroups: 'Biceps Femoris · Semitendinosus',
      side: 'BACK',
      stat: 'AGI',
      exercises: ['Romanian Deadlifts', 'Lying Leg Curls', 'Nordic Hamstring Curls', 'Glute-Ham Raises']
    },
    {
      id: 'glutes',
      name: 'Glutes (Posterior Chain)',
      short: 'GLUTES',
      subgroups: 'Gluteus Maximus · Gluteus Medius',
      side: 'BACK',
      stat: 'VIT',
      exercises: ['Hip Thrusts', 'Deep Squats', 'Step-ups', 'Walking Lunges']
    },
    {
      id: 'calves',
      name: 'Calves (Lower Legs)',
      short: 'CALVES',
      subgroups: 'Gastrocnemius · Soleus',
      side: 'BOTH',
      stat: 'AGI',
      exercises: ['Standing Calf Raises', 'Seated Calf Raises', 'Jump Squats', 'Plyo Hops']
    }
  ];

  var MUSCLE_MAP = {};
  MUSCLES.forEach(function (m) { MUSCLE_MAP[m.id] = m; });

  S.MUSCLES = MUSCLES;
  S.MUSCLE_MAP = MUSCLE_MAP;

  // 6 Progression Tiers (Color + Brightness Scaling)
  var TIERS = [
    {
      rank: 'DORMANT',
      code: 'UNAWAKENED',
      minSets: 0,
      maxSets: 0,
      spectrum: { base: '#2D3545', hi: '#3B4559', glow: 'rgba(148,163,184,0)', text: '#94A3B8' },
      neon:     { base: '#1E293B', hi: '#334155', glow: 'rgba(0,229,255,0)',   text: '#64748B' },
      crimson:  { base: '#27272A', hi: '#3F3F46', glow: 'rgba(255,0,60,0)',    text: '#71717A' }
    },
    {
      rank: 'E-RANK',
      code: 'AWAKENED',
      minSets: 1,
      maxSets: 3,
      // Tactical Blue (like Biceps/Forearms in reference)
      spectrum: { base: '#1D4ED8', hi: '#3B82F6', glow: 'rgba(59,130,246,0.45)', text: '#60A5FA' },
      neon:     { base: '#0E4F70', hi: '#0284C7', glow: 'rgba(2,132,199,0.35)',  text: '#38BDF8' },
      crimson:  { base: '#4C1D95', hi: '#7C3AED', glow: 'rgba(124,58,237,0.4)',  text: '#A78BFA' }
    },
    {
      rank: 'C-RANK',
      code: 'TEMPERED',
      minSets: 4,
      maxSets: 7,
      // Bio-Emerald Green (like Abs/Obliques in reference)
      spectrum: { base: '#059669', hi: '#22C55E', glow: 'rgba(34,197,94,0.55)',  text: '#4ADE80' },
      neon:     { base: '#0077B6', hi: '#00B4D8', glow: 'rgba(0,180,216,0.55)',  text: '#00E5FF' },
      crimson:  { base: '#9D174D', hi: '#E11D48', glow: 'rgba(225,29,72,0.5)',   text: '#FB7185' }
    },
    {
      rank: 'B-RANK',
      code: 'FORGED',
      minSets: 8,
      maxSets: 12,
      // Electric System Cyan (like Delts/Traps in reference)
      spectrum: { base: '#00B4D8', hi: '#22D3EE', glow: 'rgba(0,229,255,0.7)',   text: '#00E5FF' },
      neon:     { base: '#00B4D8', hi: '#00E5FF', glow: 'rgba(0,229,255,0.75)',  text: '#67E8F9' },
      crimson:  { base: '#BE123C', hi: '#F43F5E', glow: 'rgba(244,63,94,0.65)',  text: '#FDA4AF' }
    },
    {
      rank: 'A-RANK',
      code: 'OVERDRIVE',
      minSets: 13,
      maxSets: 19,
      // Blood Blaze Crimson Red (like Chest/Triceps in reference)
      spectrum: { base: '#DC2626', hi: '#FF2A4B', glow: 'rgba(255,30,66,0.82)',  text: '#FF4D6D' },
      neon:     { base: '#7C3AED', hi: '#C084FC', glow: 'rgba(168,85,247,0.85)', text: '#D8B4FE' },
      crimson:  { base: '#E11D48', hi: '#FF003C', glow: 'rgba(255,0,60,0.85)',   text: '#FF4D6D' }
    },
    {
      rank: 'S-RANK',
      code: 'MONARCH VESSEL',
      minSets: 20,
      maxSets: 999,
      // Sovereign Gold / Mythic Radiance
      spectrum: { base: '#F59E0B', hi: '#FFD166', glow: 'rgba(255,183,3,0.95)',  text: '#FFB703' },
      neon:     { base: '#00E5FF', hi: '#E0F2FE', glow: 'rgba(0,229,255,1)',     text: '#FFFFFF' },
      crimson:  { base: '#FF003C', hi: '#FFB703', glow: 'rgba(255,183,3,0.95)',  text: '#FFB703' }
    }
  ];

  // Interpolate two hex colors by factor t in [0, 1]
  function lerpColor(hexA, hexB, t) {
    t = Math.max(0, Math.min(1, t));
    var a = parseInt(hexA.slice(1), 16);
    var b = parseInt(hexB.slice(1), 16);
    var r1 = (a >> 16) & 255, g1 = (a >> 8) & 255, b1 = a & 255;
    var r2 = (b >> 16) & 255, g2 = (b >> 8) & 255, b2 = b & 255;
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var bl = Math.round(b1 + (b2 - b1) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  // Compute exact color, brightness, opacity, and tier info for a given set count
  S.getMuscleVisuals = function (sets, paletteMode) {
    sets = Math.max(0, Math.round((Number(sets) || 0) * 10) / 10);
    paletteMode = paletteMode || (S.state && S.state.muscleLog && S.state.muscleLog.palette) || 'spectrum';

    var tierIdx = 0;
    for (var i = TIERS.length - 1; i >= 1; i--) {
      if (sets >= TIERS[i].minSets) {
        tierIdx = i;
        break;
      }
    }
    var tier = TIERS[tierIdx];
    var pal = tier[paletteMode] || tier.spectrum;

    if (tierIdx === 0) {
      return {
        tierIdx: 0,
        rank: tier.rank,
        code: tier.code,
        sets: 0,
        fill: pal.base,
        stroke: '#475569',
        textColor: pal.text,
        glow: 'none',
        brightness: 0.78,
        opacity: 0.52,
        pctWithinTier: 0,
        overallPct: 0,
        nextTierSets: 1
      };
    }

    var span = Math.max(1, tier.maxSets - tier.minSets + 1);
    var within = Math.min(1, (sets - tier.minSets) / span);
    var fill = lerpColor(pal.base, pal.hi, 0.25 + within * 0.75);
    var brightness = +(0.92 + tierIdx * 0.06 + within * 0.18).toFixed(2);
    var opacity = +(0.78 + Math.min(0.22, tierIdx * 0.04 + within * 0.08)).toFixed(2);
    var blurPx = Math.round(4 + tierIdx * 2.5 + within * 4);
    var nextTier = TIERS[Math.min(TIERS.length - 1, tierIdx + 1)];

    return {
      tierIdx: tierIdx,
      rank: tier.rank,
      code: tier.code,
      sets: sets,
      fill: fill,
      stroke: lerpColor(fill, '#FFFFFF', 0.35),
      textColor: pal.text,
      glow: 'drop-shadow(0 0 ' + blurPx + 'px ' + pal.glow + ')',
      brightness: brightness,
      opacity: opacity,
      pctWithinTier: Math.round(within * 100),
      overallPct: Math.min(100, Math.round((sets / 20) * 100)),
      nextTierSets: tierIdx < TIERS.length - 1 ? nextTier.minSets : null
    };
  };

  // Smart inference of primary & secondary muscles from any quest or exercise title
  S.inferMusclesFromQuest = function (q) {
    if (!q) return [];
    if (Array.isArray(q.muscles) && q.muscles.length) {
      return q.muscles.filter(function (m) { return !!MUSCLE_MAP[m]; });
    }
    var cat = q.category || 'HABIT';
    if (cat === 'STUDY' || cat === 'FOCUS' || cat === 'HABIT') {
      // still check if title explicitly names a physical exercise
      var checkT = String(q.title || '').toLowerCase();
      if (!/push.?up|sit.?up|squat|plank|pull.?up|dip|curl|bench|deadlift|lunge|burpee|crunch|row|press|calf|glute|ab\b|abs\b/.test(checkT)) {
        return [];
      }
    }

    var t = String(q.title || '').toLowerCase();
    var preset = String(q.preset || '').toLowerCase();
    var out = [];
    function add(id) {
      if (MUSCLE_MAP[id] && out.indexOf(id) === -1) out.push(id);
    }

    if (preset === 'pushups' || /push.?up|bench|chest|pec|fly|flies|svend/.test(t)) {
      add('chest'); add('triceps'); add('shoulders');
    }
    if (/dip/.test(t)) {
      add('chest'); add('triceps'); add('shoulders');
    }
    if (preset === 'situps' || /sit.?up|crunch|plank|hollow|ab\b|abs\b|core|leg raise|v.?up|flutter|rollout/.test(t)) {
      add('abs'); add('obliques');
    }
    if (/oblique|twist|side plank|woodchop/.test(t)) {
      add('obliques'); add('abs');
    }
    if (preset === 'squats' || /squat|leg press|lunge|split squat|wall sit|step.?up|quad|hack/.test(t)) {
      add('quads'); add('glutes'); add('calves');
    }
    if (/jump squat|plyo|box jump/.test(t)) {
      add('quads'); add('calves'); add('glutes');
    }
    if (/pull.?up|chin.?up|pulldown|lat\b|lats\b|muscle.?up/.test(t)) {
      add('lats'); add('upper_back'); add('biceps'); add('forearms');
    }
    if (/row|rhomboid|rear delt|face pull|inverted/.test(t)) {
      add('upper_back'); add('lats'); add('biceps'); add('shoulders');
    }
    if (/deadlift|rdl|romanian|good morning|hyperextension|back extension|superman/.test(t)) {
      add('lower_back'); add('hamstrings'); add('glutes'); add('traps'); add('forearms');
    }
    if (/hamstring|leg curl|nordic/.test(t)) {
      add('hamstrings'); add('glutes');
    }
    if (/glute|hip thrust|bridge/.test(t)) {
      add('glutes'); add('hamstrings');
    }
    if (/shoulder|overhead|ohp|military|lateral raise|front raise|pike|handstand|arnold|delt/.test(t)) {
      add('shoulders'); add('triceps'); add('traps');
    }
    if (/shrug|trap|farmer|rack pull/.test(t)) {
      add('traps'); add('forearms');
    }
    if (/bicep|curl|chin/.test(t)) {
      add('biceps'); add('forearms');
    }
    if (/tricep|skullcrusher|pushdown|kickback|close.?grip/.test(t)) {
      add('triceps');
    }
    if (/forearm|grip|dead hang|wrist/.test(t)) {
      add('forearms');
    }
    if (/calf|calves|jump rope|skip/.test(t)) {
      add('calves');
    }
    if (/burpee|circuit|full.?body|conditioning|sprawl|bear crawl|mountain climber/.test(t)) {
      add('chest'); add('quads'); add('abs'); add('shoulders'); add('calves'); add('triceps');
    }

    // Fallback for generic GYM / CALISTHENICS quests with custom names
    if (out.length === 0 && (cat === 'CALISTHENICS' || cat === 'GYM' || cat === 'PENALTY')) {
      if (/upper|push/.test(t)) { add('chest'); add('shoulders'); add('triceps'); }
      else if (/pull|back/.test(t)) { add('lats'); add('upper_back'); add('biceps'); }
      else if (/leg|lower/.test(t)) { add('quads'); add('hamstrings'); add('glutes'); add('calves'); }
      else if (/arm/.test(t)) { add('biceps'); add('triceps'); add('forearms'); }
      else { add('chest'); add('abs'); add('quads'); }
    }

    return out;
  };

  // Ensure S.state.muscleLog exists and seed from completed quests if brand new
  S.ensureMuscleLog = function () {
    var s = S.state;
    if (!s) return null;
    if (!s.muscleLog || typeof s.muscleLog !== 'object') {
      s.muscleLog = {
        updatedAt: Date.now(),
        palette: 'spectrum',
        timeframe: '7D',
        days: {},      // { 'YYYY-MM-DD': { chest: 3, abs: 2, ... } }
        allTime: {},   // { chest: 12, ... }
        lastTrained: {}, // { chest: 'YYYY-MM-DD', ... }
        questCredited: {} // { 'questId_YYYY-MM-DD': { chest: 3, ... } }
      };
    }
    s.muscleLog.days = s.muscleLog.days || {};
    s.muscleLog.allTime = s.muscleLog.allTime || {};
    s.muscleLog.lastTrained = s.muscleLog.lastTrained || {};
    s.muscleLog.questCredited = s.muscleLog.questCredited || {};
    if (!s.muscleLog.palette) s.muscleLog.palette = 'spectrum';
    if (!s.muscleLog.timeframe) s.muscleLog.timeframe = '7D';

    // Retroactively credit any already-progressed quests today that haven't been credited yet
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

  // Convert quest progress into effective muscle sets (1 to 4 sets per completed quest)
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
      // e.g. 25 reps = 2 sets, 50 reps = 3 sets, 100 reps = 4 sets
      fullSets = Math.max(2, Math.min(6, Math.round(targ / 25) + 1));
    } else if (q.unit === 'MINS') {
      fullSets = Math.max(2, Math.min(5, Math.round(targ / 15) + 1));
    } else {
      fullSets = 2;
    }
    return Math.round(fullSets * ratio * 10) / 10;
  }

  // Synchronize a quest's current progress with S.state.muscleLog (idempotent delta update)
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
      // Primary muscle gets 100% of sets, secondary gets ~70%
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

  // Manual / Direct Muscle Set Logging from the Physique HUD
  S.logMuscleSets = function (muscleId, deltaSets, exerciseName) {
    if (!MUSCLE_MAP[muscleId]) return false;
    var ml = S.ensureMuscleLog();
    var dateKey = (S.state && S.state.currentDate) || S.today();
    var dayBucket = ml.days[dateKey] || (ml.days[dateKey] = {});

    var before = Number(dayBucket[muscleId]) || 0;
    var after = Math.max(0, Math.round((before + deltaSets) * 10) / 10);
    var actualDelta = Math.round((after - before) * 10) / 10;
    if (actualDelta === 0 && deltaSets < 0) {
      // Allow reducing allTime if today is already 0
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
      // Award small Hunter XP & rep record for manual workout logging
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

  // Reset a single muscle or all muscles
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

  // Compute aggregated sets per muscle for a given timeframe ('TODAY' | '7D' | '30D' | 'ALL')
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
     HIGH-PRECISION ANATOMICAL SVG BODY DIAGRAM (SOLO LEVELING HUNTER SILHOUETTE)
     ============================================================================ */
  function buildMuscleGroupAttrs(mId, visualsMap, selectedMuscle) {
    var v = visualsMap[mId] || S.getMuscleVisuals(0);
    var isSel = selectedMuscle === mId;
    var cls = ' vessel-muscle-group' + (isSel ? ' selected' : '') + (v.tierIdx > 0 ? ' active-tier-' + v.tierIdx : '');
    var style = 'fill:' + v.fill + ';fill-opacity:' + v.opacity + ';stroke:' + (isSel ? '#FFFFFF' : v.stroke) + ';stroke-width:' + (isSel ? '1.8' : '1.05') + ';filter:brightness(' + v.brightness + ')' + (v.glow !== 'none' ? ' ' + v.glow : '') + ';';
    return 'class="' + cls.trim() + '" data-muscle="' + mId + '" style="' + style + '"';
  }

  S.renderAnatomySvg = function (side, visualsMap, selectedMuscle) {
    side = (side || 'FRONT').toUpperCase();
    var g = function (mId) { return buildMuscleGroupAttrs(mId, visualsMap, selectedMuscle); };

    // Shared Head, Spiky Manhwa Hair, Neck, Hands & Feet Silhouette
    var headAndHair =
      // Tactical Ground Grid Halo
      '<ellipse cx="150" cy="614" rx="88" ry="14" fill="rgba(0,229,255,0.06)" stroke="rgba(0,229,255,0.32)" stroke-width="1" stroke-dasharray="4 3"/>' +
      '<ellipse cx="150" cy="614" rx="52" ry="7" fill="rgba(0,229,255,0.1)" stroke="rgba(0,229,255,0.5)" stroke-width="0.8"/>' +
      // Base Inert Body Silhouette (Head, Neck, Hands, Knees, Ankles, Feet)
      '<g class="vessel-base-silhouette" fill="#363E4D" stroke="#526077" stroke-width="1.1">' +
        // Neck column
        '<path d="M136,78 L164,78 L167,104 L133,104 Z" fill="#2E3646"/>' +
        // Head contour + ears
        '<path d="M126,44 C124,25 135,16 150,16 C165,16 176,25 174,44 C177,45 178,51 175,56 C173,68 162,81 150,83 C138,81 127,68 125,56 C122,51 123,45 126,44 Z"/>' +
        // Sung Jin-Woo style spiky manhwa hair
        '<path d="M122,46 C117,36 120,22 130,14 L126,18 L136,9 L135,14 L147,6 L149,12 L160,7 L159,13 L171,12 L168,18 C178,22 183,35 178,47 C176,40 173,35 169,32 L167,39 L161,31 L156,41 L150,30 L144,40 L139,31 L133,39 L130,32 C126,36 124,41 122,46 Z" fill="#1E2533" stroke="#64748B" stroke-width="1"/>' +
        (side === 'FRONT'
          ? '<path d="M135,48 L144,50 M156,50 L165,48" stroke="#00E5FF" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>'
          : '') +
        // Left & Right Hands
        '<path d="M59,308 L49,322 L47,338 L53,344 L58,334 L61,346 L68,342 L70,326 L68,310 Z"/>' +
        '<path d="M241,308 L251,322 L253,338 L247,344 L242,334 L239,346 L232,342 L230,326 L232,310 Z"/>' +
        // Knee caps / joints
        '<ellipse cx="116" cy="442" rx="14" ry="13" fill="#2B3342"/>' +
        '<ellipse cx="184" cy="442" rx="14" ry="13" fill="#2B3342"/>' +
        // Ankles & Feet
        '<path d="M101,568 L116,568 L120,598 L124,612 L92,614 L90,604 L99,592 Z"/>' +
        '<path d="M199,568 L184,568 L180,598 L176,612 L208,614 L210,604 L201,592 Z"/>' +
      '</g>';

    if (side === 'FRONT') {
      return '<svg class="vessel-svg" viewBox="0 0 300 635" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Front Muscle Anatomy Map">' +
        headAndHair +

        // 1. TRAPS (Front Collar Sweeps)
        '<g ' + g('traps') + '>' +
          '<path d="M133,88 L100,105 L118,113 L137,102 Z"/>' +
          '<path d="M167,88 L200,105 L182,113 L163,102 Z"/>' +
        '</g>' +

        // 2. SHOULDERS (Anterior & Lateral Deltoids)
        '<g ' + g('shoulders') + '>' +
          // Left Front + Side Delt
          '<path d="M100,105 C78,110 68,128 69,154 C74,162 84,165 94,158 C101,142 108,126 115,114 Z"/>' +
          '<path d="M69,154 C65,140 68,120 82,110 C75,126 75,144 82,162 C76,161 71,158 69,154 Z" opacity="0.88"/>' +
          // Right Front + Side Delt
          '<path d="M200,105 C222,110 232,128 231,154 C226,162 216,165 206,158 C199,142 192,126 185,114 Z"/>' +
          '<path d="M231,154 C235,140 232,120 218,110 C225,126 225,144 218,162 C224,161 229,158 231,154 Z" opacity="0.88"/>' +
          '<text x="89" y="139" class="vessel-micro-label">Front Delt</text>' +
          '<text x="211" y="139" class="vessel-micro-label">Front Delt</text>' +
        '</g>' +

        // 3. CHEST (Upper Clavicular, Mid Sternal, Lower Costal Pectorals)
        '<g ' + g('chest') + '>' +
          // Left Upper Chest
          '<path d="M116,113 L148,113 L148,131 L104,134 C107,124 111,118 116,113 Z"/>' +
          // Right Upper Chest
          '<path d="M184,113 L152,113 L152,131 L196,134 C193,124 189,118 184,113 Z"/>' +
          // Left Mid Chest
          '<path d="M103,136 L148,133 L148,160 L99,162 C97,152 99,143 103,136 Z"/>' +
          // Right Mid Chest
          '<path d="M197,136 L152,133 L152,160 L201,162 C203,152 201,143 197,136 Z"/>' +
          // Left Lower Chest
          '<path d="M100,164 L148,162 L146,174 C128,179 110,176 100,164 Z"/>' +
          // Right Lower Chest
          '<path d="M200,164 L152,162 L154,174 C172,179 190,176 200,164 Z"/>' +
          '<text x="126" y="125" class="vessel-micro-label">Upper Chest</text>' +
          '<text x="174" y="125" class="vessel-micro-label">Upper Chest</text>' +
          '<text x="125" y="150" class="vessel-micro-label lg">Chest</text>' +
          '<text x="175" y="150" class="vessel-micro-label lg">Chest</text>' +
        '</g>' +

        // 4. LATS (Front Wing Flare under armpits)
        '<g ' + g('lats') + '>' +
          '<path d="M96,162 L104,176 L102,212 L91,192 Z"/>' +
          '<path d="M204,162 L196,176 L198,212 L209,192 Z"/>' +
        '</g>' +

        // 5. TRICEPS (Outer Lateral Head sweep visible on Front View — matches reference image!)
        '<g ' + g('triceps') + '>' +
          '<path d="M71,158 L79,163 L75,216 L66,208 C64,190 66,172 71,158 Z"/>' +
          '<path d="M229,158 L221,163 L225,216 L234,208 C236,190 234,172 229,158 Z"/>' +
        '</g>' +

        // 6. BICEPS (Long & Short Head on Front View)
        '<g ' + g('biceps') + '>' +
          '<path d="M80,162 C88,158 95,162 96,174 C97,192 93,212 85,222 C78,222 75,214 76,196 C76,182 78,170 80,162 Z"/>' +
          '<path d="M220,162 C212,158 205,162 204,174 C203,192 207,212 215,222 C222,222 225,214 224,196 C224,182 222,170 220,162 Z"/>' +
          '<text x="86" y="195" class="vessel-micro-label">Biceps</text>' +
          '<text x="214" y="195" class="vessel-micro-label">Biceps</text>' +
        '</g>' +

        // 7. FOREARMS (Brachioradialis & Flexors)
        '<g ' + g('forearms') + '>' +
          '<path d="M68,218 C76,222 86,224 89,232 C87,258 78,286 69,308 L59,306 C60,280 62,246 68,218 Z"/>' +
          '<path d="M232,218 C224,222 214,224 211,232 C213,258 222,286 231,308 L241,306 C240,280 238,246 232,218 Z"/>' +
        '</g>' +

        // 8. OBLIQUES & SERRATUS (Flanks framing the abs — matches reference image!)
        '<g ' + g('obliques') + '>' +
          '<path d="M103,176 L124,182 L123,262 L134,296 L112,268 L103,225 Z"/>' +
          '<path d="M197,176 L176,182 L177,262 L166,296 L188,268 L197,225 Z"/>' +
        '</g>' +

        // 9. ABS (6-Pack Rectus Abdominis + Lower V-Taper Core)
        '<g ' + g('abs') + '>' +
          // Upper Abs
          '<rect x="127" y="177" width="20" height="22" rx="4"/>' +
          '<rect x="153" y="177" width="20" height="22" rx="4"/>' +
          // Mid Abs Row 1
          '<rect x="126" y="203" width="21" height="22" rx="4"/>' +
          '<rect x="153" y="203" width="21" height="22" rx="4"/>' +
          // Mid Abs Row 2
          '<rect x="127" y="229" width="20" height="22" rx="4"/>' +
          '<rect x="153" y="229" width="20" height="22" rx="4"/>' +
          // Lower Abs V-Taper
          '<path d="M128,255 L148,255 L148,306 L135,294 Z"/>' +
          '<path d="M172,255 L152,255 L152,306 L165,294 Z"/>' +
          '<text x="150" y="218" class="vessel-micro-label">Abs</text>' +
        '</g>' +

        // 10. QUADS (Vastus Lateralis, Rectus Femoris, Vastus Medialis)
        '<g ' + g('quads') + '>' +
          // Left Outer Sweep (Vastus Lateralis)
          '<path d="M108,274 L120,295 L110,418 L95,392 C91,350 96,306 108,274 Z"/>' +
          // Left Center Quad (Rectus Femoris)
          '<path d="M122,294 L138,306 L124,426 L112,422 Z"/>' +
          // Left Inner Teardrop (Vastus Medialis + Adductor)
          '<path d="M139,308 L147,316 L139,424 C132,430 126,426 125,414 Z"/>' +
          // Right Outer Sweep (Vastus Lateralis)
          '<path d="M192,274 L180,295 L190,418 L205,392 C209,350 204,306 192,274 Z"/>' +
          // Right Center Quad (Rectus Femoris)
          '<path d="M178,294 L162,306 L176,426 L188,422 Z"/>' +
          // Right Inner Teardrop (Vastus Medialis + Adductor)
          '<path d="M161,308 L153,316 L161,424 C168,430 174,426 175,414 Z"/>' +
          '<text x="116" y="362" class="vessel-micro-label">Quads</text>' +
          '<text x="184" y="362" class="vessel-micro-label">Quads</text>' +
        '</g>' +

        // 11. CALVES (Gastrocnemius & Tibialis / Soleus)
        '<g ' + g('calves') + '>' +
          // Left Calf (Outer & Inner bellies)
          '<path d="M100,456 L114,458 L110,566 L101,566 C94,530 93,490 100,456 Z"/>' +
          '<path d="M116,458 L129,460 C135,492 130,532 117,566 L112,566 Z"/>' +
          // Right Calf (Outer & Inner bellies)
          '<path d="M200,456 L186,458 L190,566 L199,566 C206,530 207,490 200,456 Z"/>' +
          '<path d="M184,458 L171,460 C165,492 170,532 183,566 L188,566 Z"/>' +
          '<text x="113" y="508" class="vessel-micro-label">Calves</text>' +
          '<text x="187" y="508" class="vessel-micro-label">Calves</text>' +
        '</g>' +
      '</svg>';
    }

    // BACK ANATOMY VIEW
    return '<svg class="vessel-svg" viewBox="0 0 300 635" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Back Muscle Anatomy Map">' +
      headAndHair +

      // 1. TRAPS (Full Diamond Upper / Mid / Lower Trapezius)
      '<g ' + g('traps') + '>' +
        '<path d="M134,84 L166,84 L198,105 L172,132 L150,176 L128,132 L102,105 Z"/>' +
        '<line x1="150" y1="86" x2="150" y2="172" stroke="rgba(10,17,31,0.65)" stroke-width="1.4"/>' +
        '<text x="150" y="118" class="vessel-micro-label lg">Traps</text>' +
      '</g>' +

      // 2. SHOULDERS (Rear & Lateral Deltoids)
      '<g ' + g('shoulders') + '>' +
        '<path d="M100,106 C79,112 68,128 69,154 L96,154 L112,124 Z"/>' +
        '<path d="M200,106 C221,112 232,128 231,154 L204,154 L188,124 Z"/>' +
        '<text x="88" y="138" class="vessel-micro-label">Rear Delt</text>' +
        '<text x="212" y="138" class="vessel-micro-label">Rear Delt</text>' +
      '</g>' +

      // 3. UPPER BACK (Infraspinatus, Teres Major, Rhomboids)
      '<g ' + g('upper_back') + '>' +
        '<path d="M113,126 L128,134 L144,168 L102,168 L97,154 Z"/>' +
        '<path d="M187,126 L172,134 L156,168 L198,168 L203,154 Z"/>' +
        '<text x="122" y="154" class="vessel-micro-label">Upper Back</text>' +
        '<text x="178" y="154" class="vessel-micro-label">Upper Back</text>' +
      '</g>' +

      // 4. LATS (Latissimus Dorsi V-Taper Wings)
      '<g ' + g('lats') + '>' +
        '<path d="M100,170 L145,172 L136,236 L108,224 C98,204 96,186 100,170 Z"/>' +
        '<path d="M200,170 L155,172 L164,236 L192,224 C202,204 204,186 200,170 Z"/>' +
        '<text x="122" y="198" class="vessel-micro-label lg">Lats</text>' +
        '<text x="178" y="198" class="vessel-micro-label lg">Lats</text>' +
      '</g>' +

      // 5. LOWER BACK (Erector Spinae Pillars)
      '<g ' + g('lower_back') + '>' +
        '<path d="M136,222 L149,182 L149,266 L124,262 L114,228 Z"/>' +
        '<path d="M164,222 L151,182 L151,266 L176,262 L186,228 Z"/>' +
        '<text x="150" y="246" class="vessel-micro-label">Lower Back</text>' +
      '</g>' +

      // 6. TRICEPS (Horseshoe Lateral & Long Head on Back)
      '<g ' + g('triceps') + '>' +
        '<path d="M70,156 L95,156 L94,218 L68,214 C65,194 66,174 70,156 Z"/>' +
        '<path d="M230,156 L205,156 L206,218 L232,214 C235,194 234,174 230,156 Z"/>' +
        '<text x="82" y="190" class="vessel-micro-label">Triceps</text>' +
        '<text x="218" y="190" class="vessel-micro-label">Triceps</text>' +
      '</g>' +

      // 7. FOREARMS (Posterior Extensors)
      '<g ' + g('forearms') + '>' +
        '<path d="M68,218 L90,222 L70,308 L59,306 Z"/>' +
        '<path d="M232,218 L210,222 L230,308 L241,306 Z"/>' +
      '</g>' +

      // 8. GLUTES (Gluteus Maximus & Medius)
      '<g ' + g('glutes') + '>' +
        '<path d="M112,262 L149,266 L149,326 C126,332 104,320 100,296 C100,280 105,270 112,262 Z"/>' +
        '<path d="M188,262 L151,266 L151,326 C174,332 196,320 200,296 C200,280 195,270 188,262 Z"/>' +
        '<text x="126" y="298" class="vessel-micro-label lg">Glutes</text>' +
        '<text x="174" y="298" class="vessel-micro-label lg">Glutes</text>' +
      '</g>' +

      // 9. HAMSTRINGS (Biceps Femoris & Semitendinosus)
      '<g ' + g('hamstrings') + '>' +
        '<path d="M100,322 L124,330 L121,426 L102,422 C94,388 94,352 100,322 Z"/>' +
        '<path d="M126,330 L146,328 L138,426 L123,426 Z"/>' +
        '<path d="M200,322 L176,330 L179,426 L198,422 C206,388 206,352 200,322 Z"/>' +
        '<path d="M174,330 L154,328 L162,426 L177,426 Z"/>' +
        '<text x="120" y="378" class="vessel-micro-label">Hamstrings</text>' +
        '<text x="180" y="378" class="vessel-micro-label">Hamstrings</text>' +
      '</g>' +

      // 10. CALVES (Posterior Gastrocnemius Diamond & Soleus)
      '<g ' + g('calves') + '>' +
        '<path d="M99,456 L115,456 L112,566 L101,566 C93,528 92,488 99,456 Z"/>' +
        '<path d="M117,456 L131,458 C137,490 131,530 118,566 L114,566 Z"/>' +
        '<path d="M201,456 L185,456 L188,566 L199,566 C207,528 208,488 201,456 Z"/>' +
        '<path d="M183,456 L169,458 C163,490 169,530 182,566 L186,566 Z"/>' +
        '<text x="114" y="508" class="vessel-micro-label">Calves</text>' +
        '<text x="186" y="508" class="vessel-micro-label">Calves</text>' +
      '</g>' +
    '</svg>';
  };

  /* ============================================================================
     FULL PHYSIQUE / MUSCLE ANATOMY VIEW RENDERER
     ============================================================================ */
  var activeBodySide = 'BOTH'; // 'FRONT' | 'BACK' | 'BOTH'
  var selectedMuscleId = 'chest';

  S.renderPhysiqueView = function (container) {
    var ml = S.ensureMuscleLog();
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

    // Legend swatches
    var legendHtml = TIERS.map(function (t, idx) {
      var p = t[pal] || t.spectrum;
      var rangeTxt = idx === 0 ? '0' : (t.maxSets >= 999 ? (t.minSets + '+') : (t.minSets + '–' + t.maxSets));
      return '<div class="vessel-legend-pill">' +
        '<span class="vessel-legend-dot" style="background:' + p.hi + '; box-shadow:0 0 8px ' + p.glow + ';"></span>' +
        '<span class="font-mono" style="font-size:10px; color:' + p.text + '; font-weight:700;">' + t.rank + '</span>' +
        '<span class="font-mono" style="font-size:9.5px; color:var(--text-muted);">(' + rangeTxt + ' sets)</span>' +
      '</div>';
    }).join('');

    container.innerHTML =
      '<div class="vessel-layout">' +
        // Top Header Banner
        '<div class="system-panel" style="margin-bottom:14px;">' +
          '<div class="panel-header" style="flex-wrap:wrap; gap:10px; margin-bottom:10px;">' +
            '<div class="panel-title">' + I('str', 20) + ' [PLAYER VESSEL // MUSCLE ACTIVATION MATRIX]</div>' +
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
              '<span class="font-mono text-muted" style="font-size:10px;">MUSCLES AWAKENED</span>' +
              '<strong class="font-mono text-accent" style="font-size:18px;">' + activeCount + ' / ' + MUSCLES.length + ' (' + syncPct + '%)</strong>' +
            '</div>' +
            '<div class="vessel-kpi-card">' +
              '<span class="font-mono text-muted" style="font-size:10px;">VOLUME LOGGED (' + tf + ')</span>' +
              '<strong class="font-mono text-gold" style="font-size:18px;">' + totalSets + ' SETS</strong>' +
            '</div>' +
            '<div class="vessel-kpi-card">' +
              '<span class="font-mono text-muted" style="font-size:10px;">SELECTED REGION</span>' +
              '<strong class="font-mono" style="font-size:16px; color:' + selV.textColor + ';">' + selM.short + ' // ' + selV.rank + '</strong>' +
            '</div>' +
          '</div>' +

          // Color & Brightness Legend Bar
          '<div class="vessel-legend-bar">' + legendHtml + '</div>' +
        '</div>' +

        // Main 2-Column Interactive Grid (Body Map Stage + Muscle Dossier & Quick Logger)
        '<div class="vessel-main-grid">' +
          // LEFT: Holographic Anatomical Body Scanner
          '<div class="system-panel vessel-scanner-panel">' +
            '<div class="flex-between" style="margin-bottom:10px; flex-wrap:wrap; gap:8px;">' +
              '<span class="font-mono text-accent" style="font-size:11px; letter-spacing:0.08em;">' + I('radar', 14) + ' TAP ANY MUSCLE REGION TO INSPECT OR TRAIN</span>' +
              '<div class="vessel-seg-group">' +
                '<button type="button" class="vessel-view-btn' + (activeBodySide === 'BOTH' ? ' active' : '') + '" data-side="BOTH">FRONT + BACK</button>' +
                '<button type="button" class="vessel-view-btn' + (activeBodySide === 'FRONT' ? ' active' : '') + '" data-side="FRONT">FRONT ONLY</button>' +
                '<button type="button" class="vessel-view-btn' + (activeBodySide === 'BACK' ? ' active' : '') + '" data-side="BACK">BACK ONLY</button>' +
              '</div>' +
            '</div>' +

            '<div class="vessel-stage ' + (activeBodySide === 'BOTH' ? 'dual-stage' : 'single-stage') + '">' +
              (activeBodySide === 'BOTH' || activeBodySide === 'FRONT'
                ? '<div class="vessel-figure-wrap">' +
                    '<div class="vessel-figure-tag">ANTERIOR // FRONT</div>' +
                    S.renderAnatomySvg('FRONT', visualsMap, selectedMuscleId) +
                  '</div>'
                : '') +
              (activeBodySide === 'BOTH' || activeBodySide === 'BACK'
                ? '<div class="vessel-figure-wrap">' +
                    '<div class="vessel-figure-tag">POSTERIOR // BACK</div>' +
                    S.renderAnatomySvg('BACK', visualsMap, selectedMuscleId) +
                  '</div>'
                : '') +
            '</div>' +
          '</div>' +

          // RIGHT: Selected Muscle Dossier + Direct Training & Full Muscle Matrix
          '<div class="vessel-side-col">' +
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

    // Bind interactive events
    container.querySelectorAll('.vessel-muscle-group').forEach(function (el) {
      el.addEventListener('click', function () {
        var mId = el.getAttribute('data-muscle');
        if (mId && MUSCLE_MAP[mId]) {
          selectedMuscleId = mId;
          if (S.audio) S.audio.tap();
          S.renderPhysiqueView(container);
        }
      });
    });

    container.querySelectorAll('[data-select-muscle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mId = btn.getAttribute('data-select-muscle');
        if (mId && MUSCLE_MAP[mId]) {
          selectedMuscleId = mId;
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

    container.querySelectorAll('.vessel-view-btn[data-side]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeBodySide = btn.getAttribute('data-side') || 'BOTH';
        if (S.audio) S.audio.tap();
        S.renderPhysiqueView(container);
      });
    });

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
        // Infer secondary muscles from exercise name too
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

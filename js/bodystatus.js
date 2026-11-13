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

  /* --- 2. Hunter Rank Tiers & Recoloring Palette --- */
  var MUSCLE_RANKS = [
    { key: 'DORMANT', rank: 'Dormant', badge: 'DORMANT', minSets: 0,  color: '#111622', emissive: '#000000', emissiveIntensity: 0.00, css: '#6E85A6' },
    { key: 'C',       rank: 'C-Rank',  badge: 'C-RANK',  minSets: 1,  color: '#00E676', emissive: '#00E676', emissiveIntensity: 0.36, css: '#00E676' },
    { key: 'B',       rank: 'B-Rank',  badge: 'B-RANK',  minSets: 4,  color: '#2979FF', emissive: '#2979FF', emissiveIntensity: 0.46, css: '#2979FF' },
    { key: 'A',       rank: 'A-Rank',  badge: 'A-RANK',  minSets: 8,  color: '#FF2A4B', emissive: '#FF2A4B', emissiveIntensity: 0.56, css: '#FF2A4B' },
    { key: 'S',       rank: 'S-Rank',  badge: 'S-RANK',  minSets: 13, color: '#FFD700', emissive: '#FFD700', emissiveIntensity: 0.72, css: '#FFD700' }
  ];
  S.MUSCLE_RANKS = MUSCLE_RANKS;

  function getRankForSets(sets) {
    var val = Number(sets) || 0;
    var chosen = MUSCLE_RANKS[0];
    for (var i = 0; i < MUSCLE_RANKS.length; i++) {
      if (val >= MUSCLE_RANKS[i].minSets) chosen = MUSCLE_RANKS[i];
    }
    return chosen;
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
  function createEmptyMuscles() {
    var out = {};
    ANATOMY_MUSCLES.forEach(function (m) {
      out[m.id] = { sets: 0, primarySets: 0, secondarySets: 0, lastTrainedAt: null };
    });
    return out;
  }

  S.ensureAnatomyTracker = function () {
    if (!S.state) S.state = {};
    var t = S.state.anatomyTracker;
    if (!t || typeof t !== 'object') {
      t = S.state.anatomyTracker = {
        muscles: createEmptyMuscles(),
        workoutHistory: [],
        questCredits: {},
        selectedMuscle: 'Chest_Mid',
        updatedAt: Date.now()
      };
    }
    if (!t.muscles || typeof t.muscles !== 'object') t.muscles = createEmptyMuscles();
    ANATOMY_MUSCLES.forEach(function (m) {
      if (!t.muscles[m.id]) {
        t.muscles[m.id] = { sets: 0, primarySets: 0, secondarySets: 0, lastTrainedAt: null };
      }
    });
    if (!Array.isArray(t.workoutHistory)) t.workoutHistory = [];
    if (!t.questCredits || typeof t.questCredits !== 'object') t.questCredits = {};
    if (!t.selectedMuscle || !MUSCLE_MAP[t.selectedMuscle]) t.selectedMuscle = 'Chest_Mid';
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
    var rec = t.muscles[def.id] || { sets: 0, primarySets: 0, secondarySets: 0, lastTrainedAt: null };
    var sets = Math.round((rec.sets || 0) * 10) / 10;
    var rank = getRankForSets(sets);
    var recoveryPct = computeRecoveryPct(rec);
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
      recoveryPct: recoveryPct
    };
  };

  function creditMuscle(id, delta, isPrimary, nowTs) {
    var t = S.ensureAnatomyTracker();
    var rec = t.muscles[id];
    if (!rec) return;
    rec.sets = Math.max(0, Math.round((rec.sets + delta) * 100) / 100);
    if (isPrimary) rec.primarySets = Math.max(0, Math.round((rec.primarySets + delta) * 100) / 100);
    else rec.secondarySets = Math.max(0, Math.round((rec.secondarySets + delta) * 100) / 100);
    if (delta > 0) rec.lastTrainedAt = nowTs;
    if (rec.sets === 0) rec.lastTrainedAt = null;
  }

  S.logWorkoutExercise = function (exerciseIdOrObj, setsCount) {
    var t = S.ensureAnatomyTracker();
    var ex = typeof exerciseIdOrObj === 'string'
      ? WORKOUT_EXERCISES.find(function (e) { return e.id === exerciseIdOrObj; })
      : exerciseIdOrObj;
    if (!ex) return false;
    var sets = Math.max(1, Math.min(20, Number(setsCount) || 3));
    var nowTs = Date.now();

    (ex.primary || []).forEach(function (mId) {
      creditMuscle(mId, sets, true, nowTs);
    });
    (ex.secondary || []).forEach(function (mId) {
      creditMuscle(mId, sets * 0.5, false, nowTs);
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
    if (S.save) S.save();
    updateHudWindowDOM();
    updateSidePanelsDOM();
    return true;
  };

  S.adjustMuscleSets = function (muscleId, delta) {
    var t = S.ensureAnatomyTracker();
    if (!MUSCLE_MAP[muscleId]) return;
    creditMuscle(muscleId, delta, true, Date.now());
    t.selectedMuscle = muscleId;
    t.updatedAt = Date.now();
    if (S.applyMuscleColorsTo3D) S.applyMuscleColorsTo3D();
    if (S.save) S.save();
    updateHudWindowDOM();
    updateSidePanelsDOM();
  };

  S.resetAnatomyTracker = function () {
    var t = S.ensureAnatomyTracker();
    t.muscles = createEmptyMuscles();
    t.workoutHistory = [];
    t.questCredits = {};
    t.updatedAt = Date.now();
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

    // Convert quest progress ratio into equivalent sets (e.g. completed physical quest = 4 sets)
    var target = Math.max(1, Number(quest.targetProgress) || 1);
    var prog = Math.max(0, Math.min(target, Number(quest.currentProgress) || 0));
    var targetSets = quest.unit === 'SETS' ? Math.min(10, target) : 4;
    var nowSets = quest.isCompleted ? targetSets : Math.round((prog / target) * targetSets * 100) / 100;
    var delta = Math.round((nowSets - prev) * 100) / 100;
    if (Math.abs(delta) < 0.05) return;

    var nowTs = Date.now();
    mapping.primary.forEach(function (mId) { creditMuscle(mId, delta, true, nowTs); });
    mapping.secondary.forEach(function (mId) { creditMuscle(mId, delta * 0.5, false, nowTs); });
    t.questCredits[key] = nowSets;
    t.updatedAt = nowTs;

    if (S.applyMuscleColorsTo3D) S.applyMuscleColorsTo3D();
    if (!silent) {
      updateHudWindowDOM();
      updateSidePanelsDOM();
    }
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

    // Solo Leveling System Studio Lighting
    var hemi = new THREE.HemisphereLight(0x8bb8ff, 0x09111f, 0.95);
    scene.add(hemi);

    var keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(1.8, 3.2, 2.8);
    scene.add(keyLight);

    var backKey = new THREE.DirectionalLight(0xdbeafe, 0.9);
    backKey.position.set(-1.5, 2.6, -2.8);
    scene.add(backKey);

    var cyanRimL = new THREE.DirectionalLight(0x00e5ff, 0.85);
    cyanRimL.position.set(-2.8, 1.5, -0.5);
    scene.add(cyanRimL);

    var cobaltRimR = new THREE.DirectionalLight(0x2979ff, 0.65);
    cobaltRimR.position.set(2.8, 1.3, -0.8);
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
      'assets/models/hunter_anatomy.glb?v=3.38',
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
              color: new THREE.Color(0x080c14),
              roughness: 0.2,
              metalness: 0.45
            });
          }
        });

        threeCtx.scene.add(root);
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

  /* Push muscle colors & emissive glow to Three.js materials */
  S.applyMuscleColorsTo3D = function () {
    if (!threeCtx.loaded) return;
    var t = S.ensureAnatomyTracker();
    ANATOMY_MUSCLES.forEach(function (def) {
      var mesh = threeCtx.muscleMeshes[def.id];
      if (!mesh || !mesh.material) return;
      var st = S.getMuscleStatus(def.id);
      var r = st.rank;
      mesh.material.color.set(r.color);
      mesh.material.emissive.set(r.emissive);
      mesh.material.emissiveIntensity = r.emissiveIntensity;
      // Slightly brighter specular finish when active
      mesh.material.roughness = st.sets > 0 ? 0.22 : 0.28;
      mesh.material.metalness = st.sets > 0 ? 0.45 : 0.65;
      if (t.selectedMuscle === def.id && r.key === 'DORMANT') {
        mesh.material.emissive.set('#00E5FF');
        mesh.material.emissiveIntensity = 0.22;
      }
    });
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
    switch (preset) {
      case 'FRONT':
        threeCtx.targetTheta = nearestAngle(0);
        threeCtx.targetPhi = Math.PI / 2;
        threeCtx.targetRadius = 2.45;
        break;
      case 'BACK':
        threeCtx.targetTheta = nearestAngle(Math.PI);
        threeCtx.targetPhi = Math.PI / 2;
        threeCtx.targetRadius = 2.45;
        break;
      case 'LEFT':
        threeCtx.targetTheta = nearestAngle(-Math.PI / 2);
        threeCtx.targetPhi = Math.PI / 2;
        threeCtx.targetRadius = 2.45;
        break;
      case 'RIGHT':
        threeCtx.targetTheta = nearestAngle(Math.PI / 2);
        threeCtx.targetPhi = Math.PI / 2;
        threeCtx.targetRadius = 2.45;
        break;
      case 'RESET':
      default:
        threeCtx.targetTheta = nearestAngle(0.25);
        threeCtx.targetPhi = 1.48;
        threeCtx.targetRadius = 2.55;
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
    threeCtx.camera.aspect = w / h;
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

    return '<div class="bs-hud-header">' +
        '<div>' +
          '<div class="bs-hud-kicker font-mono">[SYSTEM // MUSCLE TELEMETRY]</div>' +
          '<div class="bs-hud-title">' + U.esc(st.name.toUpperCase()) + '</div>' +
        '</div>' +
        '<button type="button" class="bs-hud-close" id="btn-hud-close" title="Close Telemetry Window">&times;</button>' +
      '</div>' +
      '<div class="bs-hud-meta-row">' +
        '<span class="bs-rank-pill" style="color:' + r.css + '; border-color:' + r.css + '; background:' + r.css + '1A;">' + U.esc(r.badge) + '</span>' +
        '<span class="bs-group-pill font-mono">' + U.esc(st.group) + '</span>' +
      '</div>' +
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
      '<div class="bs-hud-actions">' +
        '<button type="button" class="sys-btn sm" data-muscle-delta="-1" data-muscle-id="' + st.id + '">-1 SET</button>' +
        '<button type="button" class="sys-btn sm primary" data-muscle-delta="1" data-muscle-id="' + st.id + '">+1 SET</button>' +
        '<button type="button" class="sys-btn sm gold" data-muscle-delta="3" data-muscle-id="' + st.id + '">+3 SETS</button>' +
      '</div>';
  }

  function updateHudWindowDOM(forceShow) {
    var hud = document.getElementById('bodystatus-floating-hud');
    if (!hud) return;
    if (forceShow) hud.classList.remove('hidden');
    hud.innerHTML = renderFloatingHudHtml();

    var closeBtn = document.getElementById('btn-hud-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        hud.classList.add('hidden');
      });
    }
    hud.querySelectorAll('[data-muscle-delta]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-muscle-id');
        var delta = Number(btn.getAttribute('data-muscle-delta')) || 0;
        if (S.audio) { try { S.audio.tap(); } catch (e) {} }
        S.adjustMuscleSets(id, delta);
      });
    });
  }

  function updateSidePanelsDOM() {
    var listEl = document.getElementById('bs-muscle-roster');
    if (listEl) {
      var t = S.ensureAnatomyTracker();
      listEl.innerHTML = ANATOMY_MUSCLES.map(function (m) {
        var st = S.getMuscleStatus(m.id);
        var isSel = t.selectedMuscle === m.id;
        return '<button type="button" class="bs-roster-chip' + (isSel ? ' active' : '') + '" data-select-muscle="' + m.id + '">' +
          '<span class="bs-roster-dot" style="background:' + st.rank.css + '; box-shadow:0 0 8px ' + st.rank.css + ';"></span>' +
          '<span class="bs-roster-name">' + U.esc(m.name) + '</span>' +
          '<span class="bs-roster-rank font-mono" style="color:' + st.rank.css + ';">' + U.esc(st.rank.rank === 'Dormant' ? '—' : st.rank.rank.split('-')[0]) + ' · ' + st.sets + 's</span>' +
        '</button>';
      }).join('');
      listEl.querySelectorAll('[data-select-muscle]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectMuscle(btn.getAttribute('data-select-muscle'), true);
        });
      });
    }

    var logEl = document.getElementById('bs-workout-history');
    if (logEl) {
      var hist = S.ensureAnatomyTracker().workoutHistory;
      if (!hist.length) {
        logEl.innerHTML = '<div class="font-mono" style="font-size:11px; color:var(--text-muted); padding:8px 0;">No workout sets logged yet. Log an exercise above or complete physical quests.</div>';
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
  var selectedExId = WORKOUT_EXERCISES[1].id;
  var selectedSets = 3;

  S.renderBodyStatusView = function (container) {
    if (!container) return;
    S.ensureAnatomyTracker();

    // Preserve canvas element across UI.render() re-mounts
    var prevMount = document.getElementById('bodystatus-canvas-mount');
    var canvasAlreadyMounted = prevMount && threeCtx.renderer && prevMount.contains(threeCtx.renderer.domElement);

    // If this container already holds our bodystatus shell (e.g. background 1s tick), just refresh telemetry without wiping WebGL DOM!
    if (canvasAlreadyMounted && container.querySelector('#bodystatus-shell')) {
      updateHudWindowDOM();
      updateSidePanelsDOM();
      return;
    }

    container.innerHTML =
      '<div class="bodystatus-shell" id="bodystatus-shell">' +
        '<div class="bodystatus-stage-panel">' +
          '<div class="panel-header" style="margin-bottom:10px;">' +
            '<div class="panel-title">' + (S.icon ? S.icon('status', 18) : '') + ' [BODY STATUS // ANATOMICAL SCANNER]</div>' +
            '<div class="bs-rank-legend font-mono">' +
              '<span class="bs-leg-item"><i style="background:#111622; border:1px solid #475569;"></i>DORMANT</span>' +
              '<span class="bs-leg-item"><i style="background:#00E676;"></i>C</span>' +
              '<span class="bs-leg-item"><i style="background:#2979FF;"></i>B</span>' +
              '<span class="bs-leg-item"><i style="background:#FF2A4B;"></i>A</span>' +
              '<span class="bs-leg-item"><i style="background:#FFD700;"></i>S</span>' +
            '</div>' +
          '</div>' +

          '<div class="bs-viewport-wrap" id="bs-viewport-wrap">' +
            '<div class="bs-grid-overlay" aria-hidden="true"></div>' +
            '<div id="bodystatus-canvas-mount" class="bs-canvas-mount"></div>' +

            '<div id="bodystatus-loading-overlay" class="bs-loading-overlay' + (threeCtx.loaded ? ' hidden' : '') + '">' +
              '<div class="font-mono" style="color:#00E5FF; font-size:12px; letter-spacing:0.1em;">[INITIALIZING HUNTER ANATOMY MESH...]</div>' +
            '</div>' +

            '<div id="bodystatus-floating-hud" class="bs-floating-hud"></div>' +

            '<div class="bs-cam-bar" role="group" aria-label="Camera Snap Controls">' +
              '<button type="button" class="bs-snap-btn" data-cam-snap="FRONT">FRONT</button>' +
              '<button type="button" class="bs-snap-btn" data-cam-snap="BACK">BACK</button>' +
              '<button type="button" class="bs-snap-btn" data-cam-snap="LEFT">LEFT</button>' +
              '<button type="button" class="bs-snap-btn" data-cam-snap="RIGHT">RIGHT</button>' +
              '<button type="button" class="bs-snap-btn active" data-cam-snap="RESET">RESET</button>' +
            '</div>' +

            '<div class="bs-drag-hint font-mono">DRAG TO ORBIT 360° · PINCH / SCROLL TO ZOOM · TAP MUSCLE</div>' +
          '</div>' +
        '</div>' +

        '<div class="bodystatus-side-col">' +
          '<div class="system-panel bs-logger-panel">' +
            '<div class="panel-header" style="margin-bottom:10px;">' +
              '<div class="panel-title" style="font-size:13px;">[WORKOUT RECOLORING ENGINE]</div>' +
              '<button type="button" class="sys-btn sm danger" id="btn-bs-reset">RESET ALL</button>' +
            '</div>' +
            '<div class="bs-form-row">' +
              '<label class="bs-field-lbl font-mono" for="bs-ex-select">EXERCISE</label>' +
              '<select id="bs-ex-select" class="sys-input bs-select">' +
                WORKOUT_EXERCISES.map(function (ex) {
                  return '<option value="' + ex.id + '"' + (ex.id === selectedExId ? ' selected' : '') + '>[' + ex.cat + '] ' + U.esc(ex.name) + '</option>';
                }).join('') +
              '</select>' +
            '</div>' +
            '<div class="bs-ex-preview font-mono" id="bs-ex-preview"></div>' +
            '<div class="bs-sets-log-row">' +
              '<div class="bs-sets-picker">' +
                '<button type="button" class="sys-btn sm" id="btn-bs-sets-dec">-</button>' +
                '<span class="font-mono" id="bs-sets-display" style="min-width:68px; text-align:center; font-weight:700;">' + selectedSets + ' SETS</span>' +
                '<button type="button" class="sys-btn sm" id="btn-bs-sets-inc">+</button>' +
              '</div>' +
              '<button type="button" class="sys-btn primary" id="btn-bs-log-ex" style="flex:1;">LOG WORKOUT</button>' +
            '</div>' +
            '<div class="bs-history-title font-mono">RECENT ACTIVATIONS</div>' +
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

    // Bind workout logger controls
    var exSel = document.getElementById('bs-ex-select');
    function refreshExPreview() {
      var preview = document.getElementById('bs-ex-preview');
      if (!preview) return;
      var ex = WORKOUT_EXERCISES.find(function (x) { return x.id === selectedExId; }) || WORKOUT_EXERCISES[0];
      preview.innerHTML = '<span style="color:#00E5FF;">PRIMARY:</span> ' + U.esc(ex.primary.join(', ')) +
        (ex.secondary.length ? '<br><span style="color:#6E85A6;">SECONDARY (0.5x):</span> ' + U.esc(ex.secondary.join(', ')) : '');
    }
    if (exSel) {
      exSel.addEventListener('change', function () {
        selectedExId = exSel.value;
        refreshExPreview();
      });
    }
    refreshExPreview();

    var decBtn = document.getElementById('btn-bs-sets-dec');
    var incBtn = document.getElementById('btn-bs-sets-inc');
    var setsDisp = document.getElementById('bs-sets-display');
    if (decBtn) decBtn.addEventListener('click', function () {
      selectedSets = Math.max(1, selectedSets - 1);
      if (setsDisp) setsDisp.textContent = selectedSets + ' SETS';
    });
    if (incBtn) incBtn.addEventListener('click', function () {
      selectedSets = Math.min(15, selectedSets + 1);
      if (setsDisp) setsDisp.textContent = selectedSets + ' SETS';
    });

    var logBtn = document.getElementById('btn-bs-log-ex');
    if (logBtn) {
      logBtn.addEventListener('click', function () {
        if (S.audio) { try { S.audio.questComplete(); } catch (e) {} }
        S.logWorkoutExercise(selectedExId, selectedSets);
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

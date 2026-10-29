/* ==========================================================================
   THE SYSTEM // Progression Engine
   State + persistence, XP curve, quest payouts, ranks & promotion exams,
   midnight evaluation, Penalty Zone, Dungeon Gates, loot, vault & HRS.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  /* ======================= Utilities ======================= */
  var U = S.util = {};
  U.pad = function (n) { return String(n).padStart(2, '0'); };
  U.dateStr = function (d) { return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); };
  U.parseDate = function (s) { var a = s.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); };
  U.addDays = function (s, n) { var d = U.parseDate(s); d.setDate(d.getDate() + n); return U.dateStr(d); };
  U.weekStart = function (s) { var d = U.parseDate(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return U.dateStr(d); };
  U.uid = function () { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); };
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  U.fmt = function (n) { return Math.floor(n).toLocaleString('en-US'); };
  U.hms = function (ms) { var t = Math.max(0, Math.floor(ms / 1000)); return U.pad(Math.floor(t / 3600)) + ':' + U.pad(Math.floor(t % 3600 / 60)) + ':' + U.pad(t % 60); };
  U.mmss = function (ms) { var t = Math.max(0, Math.ceil(ms / 1000)); return U.pad(Math.floor(t / 60)) + ':' + U.pad(t % 60); };
  U.hash = function (str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  U.rng = function (seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  /* ======================= Event bus ======================= */
  var listeners = {};
  S.on = function (t, f) { (listeners[t] = listeners[t] || []).push(f); };
  S.emit = function (t, p) { (listeners[t] || []).forEach(function (f) { try { f(p); } catch (e) { console.error(e); } }); };
  S.notify = function (title, body, type) { S.emit('notice', { title: title, body: body, type: type || 'info' }); };

  /* ======================= Real-World System Time ======================= */
  S.now = function () { return Date.now(); };
  S.nowDate = function () { return new Date(); };
  S.today = function () { return U.dateStr(S.nowDate()); };
  S.msToMidnight = function () { var n = S.nowDate(); var m = new Date(n); m.setHours(24, 0, 0, 0); return m - n; };

  /* ======================= State ======================= */
  var KEY = 'arise.system.v1';
  function defaultState() {
    var today = U.dateStr(new Date());
    return {
      version: 1,
      initialized: false,
      profile: {
        id: 'HNT-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        hunterName: 'PLAYER', level: 1, currentXp: 0, rankTierIndex: 0,
        activeTitle: 't_weakest', activeSkinId: 'skin_classic',
        equippedRelicIds: [null, null], activeShadowId: null, activeBorderId: null,
        gold: 100, essenceStones: 0, unallocatedAp: 0, fatigue: 0,
        streakDays: 0, maxStreak: 0, penaltyMode: 'OPTIONAL', inPenaltyZone: false,
        stats: { STR: 10, AGI: 10, VIT: 10, INT: 10, PER: 10 }, createdAt: Date.now()
      },
      quests: [],
      weeklyPlan: null,
      currentDate: today,
      dailyBonusClaimed: false,
      inventory: { owned: {}, seen: {}, shadows: {}, boxes: { BLESSED: 1, CURSED: 0 } },
      unlockedTitles: ['t_weakest'], unlockedSkins: ['skin_classic'], unlockedBorders: ['br_e'],
      buffs: [],
      records: { questsCompleted: 0, totalXp: 0, goldEarned: 0, focusMins: 0, verifiedMins: 0, gatesCleared: 0, redGates: 0, cleanDarkLocks: 0, penaltiesSurvived: 0, dawnClears: 0, midnightClears: 0, boxesOpened: 0, repsLogged: 0, kmLogged: 0, examsPassed: 0, highRankQuests: 0, dungeonsCleared: 0, perfectDays: 0, shadowsExtracted: 0, breaches: 0 },
      log: {},
      lootHistory: [],
      penalty: null,
      lastLost: null,
      exam: null,
      examNotified: -1,
      gate: null,
      rerollAt: 0,
      jobChanged: false,
      settings: { sound: true, volume: 0.5, reducedFx: false, dayOffset: 0 }
    };
  }
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  function merge(base, saved) {
    if (!isObj(saved)) return base;
    Object.keys(saved).forEach(function (k) {
      if (isObj(base[k]) && isObj(saved[k]) && !['owned', 'seen', 'shadows', 'log'].includes(k)) base[k] = merge(base[k], saved[k]);
      else base[k] = saved[k];
    });
    return base;
  }
  function load() {
    var s;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) s = merge(defaultState(), JSON.parse(raw));
    } catch (e) { console.warn('[SYSTEM] Corrupted save, starting fresh.', e); }
    if (!s) s = defaultState();
    if (s && s.settings) s.settings.dayOffset = 0;
    if (s && Array.isArray(s.quests)) {
      s.quests.forEach(function (q) {
        if (!q.difficulty || !S.DIFF || !S.DIFF[q.difficulty]) {
          q.difficulty = (q.preset && S.PRESETS && S.PRESETS[q.preset] ? S.PRESETS[q.preset].difficulty : 'E');
          if (!S.DIFF || !S.DIFF[q.difficulty]) q.difficulty = 'E';
        }
        if (!q.primaryStat) {
          var cat = (S.CATS && S.CATS[q.category]) || (S.CATS && S.CATS.HABIT) || {};
          q.primaryStat = (q.preset && S.PRESETS && S.PRESETS[q.preset] ? S.PRESETS[q.preset].primaryStat : cat.stat || 'STR');
        }
        if (!q.mode) {
          q.mode = q.unit === 'CHECK' ? 'CHECK' : (q.unit === 'MINS' ? 'DURATION' : 'COUNTER');
        }
      });
    }
    return s;
  }
  S.state = load();
  S.save = function () { try { localStorage.setItem(KEY, JSON.stringify(S.state)); } catch (e) { /* storage full */ } };
  S.commit = function () { S.save(); S.emit('change'); };
  // S.resetAll defined after S.awaken
  S.exportData = function () { return JSON.stringify(S.state, null, 2); };
  S.importData = function (json) { var o = JSON.parse(json); if (!o || !o.profile) throw new Error('Invalid save file'); S.state = merge(defaultState(), o); S.commit(); };

  S.dayLog = function (date) {
    date = date || S.state.currentDate;
    var l = S.state.log;
    if (!l[date]) l[date] = { xp: 0, hrsXp: 0, capQuests: 0, capFocus: 0, focusMins: 0, verifiedMins: 0, quests: 0, perfect: false, failed: false, resolved: false };
    return l[date];
  };

  /* ======================= Core math ======================= */
  /** XP_req(L) = floor(100 * L^1.65 + 50 * (L - 1)) */
  S.xpReq = function (L) { return Math.floor(100 * Math.pow(L, 1.65) + 50 * (L - 1)); };
  S.rank = function (i) {
    var s = S.state;
    var idx = i == null ? (s && s.profile ? s.profile.rankTierIndex : 0) : i;
    idx = Math.max(0, Math.min(S.RANKS.length - 1, idx || 0));
    return S.RANKS[idx] || S.RANKS[0];
  };
  S.nextRank = function () {
    var s = S.state;
    var i = ((s && s.profile ? s.profile.rankTierIndex : 0) || 0) + 1;
    return i < S.RANKS.length ? S.RANKS[i] : null;
  };
  S.isFrozen = function () { var p = (S.state && S.state.profile) || {}; return !!(p.inPenaltyZone && p.penaltyMode === 'HARDCORE'); };
  S.streakMult = function () { return 1 + Math.min(0.5, 0.02 * ((S.state && S.state.profile && S.state.profile.streakDays) || 0)); };
  S.qty = function (id) { return (S.state && S.state.inventory && S.state.inventory.owned && S.state.inventory.owned[id]) || 0; };

  /** All active buff sources: equipped relics, active shadow, timed rune buffs. */
  S.activeBuffs = function () {
    var s = S.state, p = (s && s.profile) || {}, out = [];
    var sets = {};
    var relics = p.equippedRelicIds || [];
    relics.forEach(function (id) {
      var it = id && S.ITEM ? S.ITEM[id] : null;
      if (!it || !it.b) return;
      it.b.forEach(function (b) { out.push({ k: b.k, t: b.t, v: b.v, src: it.name }); });
      if (it.set) sets[it.set] = (sets[it.set] || 0) + 1;
    });
    if (sets.demon_monarch >= 2) out.push({ k: 'xp', t: 'ALL', v: 0.10, src: 'Demon Monarch Set' });
    if (p.activeShadowId && s.inventory.shadows[p.activeShadowId]) {
      var sh = S.ITEM[p.activeShadowId], lvl = s.inventory.shadows[p.activeShadowId];
      sh.b.forEach(function (b) { out.push({ k: b.k, t: b.t, v: b.v * (1 + 0.1 * (lvl - 1)), src: sh.name + ' Lv.' + lvl }); });
    }
    var now = S.now();
    s.buffs.forEach(function (b) { if (b.until > now) out.push({ k: b.k, t: b.t, v: b.v, src: b.label }); });
    return out;
  };
  /** Sum of passive XP buffs applicable to a quest (capped at +25%). */
  S.xpBonus = function (category, stat) {
    var sum = 0;
    S.activeBuffs().forEach(function (b) {
      if (b.k !== 'xp') return;
      if (b.t === 'ALL' || b.t === stat || b.t === category) sum += b.v;
    });
    return Math.min(0.25, sum);
  };
  S.buffSum = function (k) { var sum = 0; S.activeBuffs().forEach(function (b) { if (b.k === k) sum += b.v; }); return sum; };
  S.statMult = function (category) {
    var st = S.state.profile.stats, c = S.CATS[category];
    if (c && c.physical) return 1 + st.STR * 0.002;
    if (category === 'STUDY' || category === 'FOCUS') return 1 + st.INT * 0.0025;
    return 1;
  };
  S.fatigueMult = function () { return S.state.profile.fatigue >= 80 ? 0.9 : 1; };

  function questScalar(q) {
    if (q.dScalar) return q.dScalar;
    if (q.unit === 'MINS' && q.mode === 'DURATION') return U.clamp(q.targetProgress / 30, 0.5, 2.5);
    return 1;
  }
  function getDiff(q) {
    var d = q && q.difficulty;
    if (d && S.DIFF[d]) return S.DIFF[d];
    return S.DIFF['E'] || { base: 20, gold: 10, stat: 1, fatigue: 15 };
  }

  /** XP_earned = floor((B*D) * (1 + min(.5, .02*S)) * (1 + sum R) * statMult * fatigue) */
  S.payout = function (q) {
    if (!q || q.isPenaltyQuest || q.isRedemption) return 0;
    var dObj = getDiff(q);
    var B = dObj.base, D = questScalar(q);
    return Math.floor(B * D * S.streakMult() * (1 + S.xpBonus(q.category, q.primaryStat)) * S.statMult(q.category) * S.fatigueMult());
  };
  S.goldPayout = function (q) {
    if (!q) return 0;
    var dObj = getDiff(q);
    return Math.floor(dObj.gold * (1 + S.buffSum('gold')));
  };
  S.gatePayout = function (def, cat, breached) {
    if (!def || !def.scalar) return 0;
    cat = cat || 'FOCUS';
    var stat = S.CATS[cat] ? S.CATS[cat].stat : 'PER';
    var diff = (def.diff && S.DIFF[def.diff]) ? def.diff : 'E';
    var diffObj = S.DIFF[diff] || S.DIFF['E'] || { base: 20, gold: 10, stat: 1, fatigue: 15 };
    var B = diffObj.base;
    var xp = B * def.scalar * S.streakMult() * (1 + S.xpBonus('FOCUS', stat) + (cat !== 'FOCUS' ? Math.max(0, S.xpBonus(cat, stat) - S.xpBonus('FOCUS', stat)) : 0)) * S.statMult('FOCUS') * S.fatigueMult();
    xp = Math.min(xp, B * def.scalar * S.streakMult() * 1.25 * S.statMult('FOCUS'));
    if (breached) xp *= 0.5;
    return Math.floor(xp);
  };

  S.vitals = function () {
    var p = S.state.profile, st = p.stats;
    return { hp: 100 + st.VIT * 50 + p.level * 20, mp: 10 + st.INT * 10 + p.level * 5 };
  };
  S.combatPower = function () {
    var p = S.state.profile, st = p.stats;
    return Math.floor((st.STR + st.AGI + st.VIT + st.INT + st.PER) * 12 + p.level * 60 + p.rankTierIndex * 250);
  };

  /* ======================= XP / Level / Rank ======================= */
  function gainXp(amount) {
    var s = S.state, p = s.profile;
    if (amount <= 0) return;
    p.currentXp += amount;
    s.records.totalXp += amount;
    S.dayLog().xp += amount;
    while (p.currentXp >= S.xpReq(p.level)) {
      p.currentXp -= S.xpReq(p.level);
      p.level++;
      p.unallocatedAp += 5;
      p.essenceStones += 3;
      S.emit('levelUp', { level: p.level });
      if (p.level >= 40 && !s.jobChanged) {
        s.jobChanged = true;
        S.emit('jobChange', {});
      }
    }
    checkExamEligibility();
  }
  S.gainXp = gainXp;

  S.isEligibleForExam = function () {
    var p = S.state.profile, n = S.nextRank();
    return !!n && p.level >= n.minLevel && p.streakDays >= n.minStreak;
  };
  function checkExamEligibility() {
    var s = S.state;
    if (S.isEligibleForExam() && s.examNotified < s.profile.rankTierIndex + 1 && !s.exam) {
      s.examNotified = s.profile.rankTierIndex + 1;
      S.notify('[RANK ADVANCEMENT AVAILABLE]', 'You qualify for the ' + S.nextRank().code + ' Promotion Exam. Open the RANK window to enter.', 'gold');
    }
  }

  S.examQuestSpecs = function (tierIndex) {
    var r = S.RANKS[tierIndex], d = r.letter, f = Math.min(1, tierIndex / 19);
    var reps = Math.round((25 + 75 * f) * 1.5 / 5) * 5;
    var km = Math.round((2 + 8 * f) * 1.5 * 2) / 2;
    var mins = tierIndex < 8 ? 25 : tierIndex < 16 ? 50 : 90;
    return [
      { title: 'Exam: Push-ups', category: 'CALISTHENICS', primaryStat: 'STR', target: reps, unit: 'REPS', mode: 'COUNTER', difficulty: d },
      { title: 'Exam: Squats', category: 'CALISTHENICS', primaryStat: 'VIT', target: reps, unit: 'REPS', mode: 'COUNTER', difficulty: d },
      { title: 'Exam: Endurance Run', category: 'RUNNING', primaryStat: 'AGI', target: km, unit: 'KM', mode: 'COUNTER', difficulty: d },
      { title: 'Exam: Focus Trial', category: 'FOCUS', primaryStat: 'PER', target: mins, unit: 'MINS', mode: 'DURATION', difficulty: d }
    ];
  };
  S.startExam = function () {
    var s = S.state;
    if (s.exam || !S.isEligibleForExam()) return false;
    var tier = s.profile.rankTierIndex + 1;
    s.exam = { date: s.currentDate, tierIndex: tier };
    S.examQuestSpecs(tier).forEach(function (spec) { S.addQuest(Object.assign({ isExam: true, isMandatory: false, recurring: false }, spec), true); });
    S.notify('[RANK ADVANCEMENT DUNGEON]', 'The Promotion Exam for ' + S.RANKS[tier].code + ' has begun. Clear every trial before 00:00:00.', 'gold');
    S.emit('examStart', {});
    S.commit();
    return true;
  };
  function checkExamComplete() {
    var s = S.state;
    if (!s.exam) return;
    var eq = s.quests.filter(function (q) { return q.isExam; });
    if (eq.length && eq.every(function (q) { return q.isCompleted; })) {
      s.profile.rankTierIndex = s.exam.tierIndex;
      s.records.examsPassed++;
      s.exam = null;
      s.quests = s.quests.filter(function (q) { return !q.isExam; });
      s.profile.gold += 200 * (s.profile.rankTierIndex + 1);
      s.inventory.boxes.BLESSED += 2;
      S.emit('rankUp', { rank: S.rank() });
      checkExamEligibility();
    }
  }

  /* ======================= Quests ======================= */
  S.presetSpecs = function (tier) {
    var f = Math.min(1, tier / 19);
    var reps = tier > 19 ? 100 + (tier - 19) * 25 : Math.round((25 + 75 * f) / 5) * 5;
    var km = tier > 19 ? 10 + (tier - 19) : Math.round((2 + 8 * f) * 2) / 2;
    return [
      { preset: 'pushups', title: 'Push-ups', category: 'CALISTHENICS', primaryStat: 'STR', target: reps, unit: 'REPS' },
      { preset: 'situps', title: 'Sit-ups / Core', category: 'CALISTHENICS', primaryStat: 'STR', target: reps, unit: 'REPS' },
      { preset: 'squats', title: 'Squats', category: 'CALISTHENICS', primaryStat: 'VIT', target: reps, unit: 'REPS' },
      { preset: 'running', title: 'Running', category: 'RUNNING', primaryStat: 'AGI', target: km, unit: 'KM' }
    ];
  };
  S.dayCode = function (dateStr) {
    var d = U.parseDate(dateStr || (S.state && S.state.currentDate) || S.today());
    return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()] || 'MON';
  };

  function normalizeSpec(o) {
    var cat = S.CATS[o.category] || S.CATS.HABIT;
    var unit = o.unit || 'REPS';
    var mode = o.mode || (unit === 'CHECK' ? 'CHECK' : unit === 'MINS' ? 'DURATION' : 'COUNTER');
    var target = mode === 'CHECK' ? 1 : Math.max(unit === 'KM' ? 0.5 : 1, Number(o.target != null ? o.target : o.targetProgress) || 1);
    return {
      title: String(o.title || 'Untitled Quest').trim().slice(0, 60) || 'Untitled Quest',
      category: o.category || 'HABIT',
      difficulty: o.difficulty || 'E',
      primaryStat: o.primaryStat || cat.stat,
      target: target,
      unit: mode === 'CHECK' ? 'CHECK' : unit,
      mode: mode,
      isMandatory: o.isMandatory !== false,
      preset: o.preset || null
    };
  }

  S.ensureWeeklyPlan = function () {
    var s = S.state;
    if (!s) return null;
    var daysList = S.DAYS || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    if (!s.weeklyPlan || !s.weeklyPlan.days) {
      var wp = {
        activePreset: 'canonical',
        dayTags: {
          MON: 'DAILY MANDATE', TUE: 'DAILY MANDATE', WED: 'DAILY MANDATE',
          THU: 'DAILY MANDATE', FRI: 'DAILY MANDATE', SAT: 'DAILY MANDATE', SUN: 'DAILY MANDATE'
        },
        days: { MON: [], TUE: [], WED: [], THU: [], FRI: [], SAT: [], SUN: [] }
      };
      var todayCode = S.dayCode(s.currentDate);
      var recurring = (s.quests || []).filter(function (q) {
        return q.recurring && !q.isPenaltyQuest && !q.isExam && !q.isBonus && !q.isRedemption && !q.dungeon;
      });
      recurring.forEach(function (q) {
        var gid = q.groupId || U.uid();
        q.groupId = gid;
        var sp = normalizeSpec(q);
        daysList.forEach(function (d) {
          var pid = (d === todayCode && q.planId) ? q.planId : U.uid();
          if (d === todayCode) q.planId = pid;
          wp.days[d].push(Object.assign({ planId: pid, groupId: gid }, sp));
        });
      });
      s.weeklyPlan = wp;
    } else {
      s.weeklyPlan.dayTags = s.weeklyPlan.dayTags || {};
      daysList.forEach(function (d) {
        if (!Array.isArray(s.weeklyPlan.days[d])) s.weeklyPlan.days[d] = [];
        if (!s.weeklyPlan.dayTags[d]) s.weeklyPlan.dayTags[d] = 'DAILY MANDATE';
      });
    }
    return s.weeklyPlan;
  };

  S.getDayPlan = function (dayCode) {
    var wp = S.ensureWeeklyPlan();
    var d = dayCode || S.dayCode();
    return (wp && wp.days && wp.days[d]) ? wp.days[d] : [];
  };

  S.getDayTag = function (dayCode) {
    var wp = S.ensureWeeklyPlan();
    var d = dayCode || S.dayCode();
    return (wp && wp.dayTags && wp.dayTags[d]) ? wp.dayTags[d] : 'DAILY DIRECTIVE';
  };

  S.setDayTag = function (dayCode, tag) {
    var wp = S.ensureWeeklyPlan();
    if (!wp || !dayCode) return;
    wp.dayTags[dayCode] = String(tag || '').trim().toUpperCase().slice(0, 28) || 'CUSTOM DIRECTIVE';
    S.commit();
  };

  S.getQuestScheduledDays = function (item) {
    var wp = S.ensureWeeklyPlan();
    if (!wp || !item) return [S.dayCode()];
    var out = [];
    (S.DAYS || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).forEach(function (d) {
      var list = wp.days[d] || [];
      var match = list.some(function (p) {
        if (item.groupId && p.groupId === item.groupId) return true;
        if (item.planId && p.planId === item.planId) return true;
        if (item.preset && p.preset === item.preset) return true;
        return p.title.toLowerCase() === String(item.title || '').toLowerCase() && p.category === item.category && p.unit === item.unit;
      });
      if (match) out.push(d);
    });
    return out.length ? out : [S.dayCode()];
  };

  S.syncTodayQuestsFromPlan = function (resetProgress) {
    var s = S.state;
    if (!s) return;
    var wp = S.ensureWeeklyPlan();
    var todayCode = S.dayCode(s.currentDate);
    var todayPlan = (wp && wp.days && wp.days[todayCode]) || [];

    var specialQuests = (s.quests || []).filter(function (q) {
      return q.isPenaltyQuest || q.isExam || q.isBonus || q.isRedemption || q.dungeon || q.oneOff;
    });
    var existingPlanQuests = (s.quests || []).filter(function (q) {
      return !q.isPenaltyQuest && !q.isExam && !q.isBonus && !q.isRedemption && !q.dungeon && !q.oneOff;
    });

    var usedIds = {};
    var nextPlanQuests = todayPlan.map(function (pItem) {
      var spec = normalizeSpec(pItem);
      var existing = null;
      if (!resetProgress) {
        existing = existingPlanQuests.find(function (q) {
          if (usedIds[q.id]) return false;
          if (pItem.planId && q.planId === pItem.planId) return true;
          if (pItem.groupId && q.groupId === pItem.groupId) return true;
          if (pItem.preset && q.preset === pItem.preset) return true;
          return q.title.toLowerCase() === spec.title.toLowerCase() && q.category === spec.category;
        });
      }
      if (existing) {
        usedIds[existing.id] = true;
        existing.title = spec.title;
        existing.category = spec.category;
        existing.difficulty = spec.difficulty;
        existing.primaryStat = spec.primaryStat;
        existing.targetProgress = spec.target;
        existing.unit = spec.unit;
        existing.mode = spec.mode;
        existing.isMandatory = spec.isMandatory;
        existing.preset = spec.preset;
        existing.planId = pItem.planId;
        existing.groupId = pItem.groupId;
        existing.recurring = true;
        if (existing.currentProgress > existing.targetProgress) {
          existing.currentProgress = existing.targetProgress;
        }
        if (existing.isCompleted && existing.currentProgress < existing.targetProgress) {
          existing.isCompleted = false;
          existing.completedAt = null;
        }
        return existing;
      } else {
        return {
          id: U.uid(),
          planId: pItem.planId || U.uid(),
          groupId: pItem.groupId || U.uid(),
          title: spec.title,
          category: spec.category,
          difficulty: spec.difficulty,
          primaryStat: spec.primaryStat,
          currentProgress: 0,
          targetProgress: spec.target,
          unit: spec.unit,
          mode: spec.mode,
          xpReward: 0,
          goldReward: 0,
          isCompleted: false,
          isMandatory: spec.isMandatory,
          recurring: true,
          isPenaltyQuest: false,
          isExam: false,
          isBonus: false,
          isRedemption: false,
          dungeon: null,
          preset: spec.preset,
          dScalar: null,
          expiresAt: null,
          createdAt: Date.now(),
          completedAt: null
        };
      }
    });

    s.quests = nextPlanQuests.concat(specialQuests);
  };

  S.savePlannedQuest = function (rawSpec, daysArray, editCtx) {
    var s = S.state;
    var spec = normalizeSpec(rawSpec);
    var wp = S.ensureWeeklyPlan();
    var allDays = S.DAYS || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    if (daysArray && daysArray.indexOf('TODAY_ONLY') >= 0) {
      if (editCtx && editCtx.questId) {
        var q = S.getQuest(editCtx.questId);
        if (q) {
          q.title = spec.title;
          q.category = spec.category;
          q.difficulty = spec.difficulty;
          q.primaryStat = spec.primaryStat;
          q.targetProgress = spec.target;
          q.unit = spec.unit;
          q.mode = spec.mode;
          q.isMandatory = spec.isMandatory;
          q.oneOff = true;
          q.recurring = false;
        }
      } else {
        S.addQuest(Object.assign({}, spec, { recurring: false, oneOff: true }), true);
      }
      S.commit();
      return;
    }

    var targetDays = (Array.isArray(daysArray) && daysArray.length) ? daysArray : [S.dayCode()];
    var groupId = (editCtx && editCtx.groupId) ? editCtx.groupId : U.uid();

    allDays.forEach(function (d) {
      var list = wp.days[d] || (wp.days[d] = []);
      var idx = -1;
      if (editCtx) {
        idx = list.findIndex(function (item) {
          if (editCtx.groupId && item.groupId === editCtx.groupId) return true;
          if (d === editCtx.sourceDay && editCtx.planId && item.planId === editCtx.planId) return true;
          if (editCtx.origTitle && item.title.toLowerCase() === editCtx.origTitle.toLowerCase() && item.category === editCtx.origCategory) return true;
          return false;
        });
      }
      var shouldBeOnDay = targetDays.indexOf(d) >= 0;
      if (shouldBeOnDay) {
        if (idx >= 0) {
          list[idx] = Object.assign({}, list[idx], spec, { groupId: groupId, preset: spec.preset || null });
        } else {
          list.push(Object.assign({ planId: U.uid(), groupId: groupId }, spec));
        }
      } else if (editCtx && idx >= 0) {
        list.splice(idx, 1);
      }
    });

    wp.activePreset = 'custom';
    S.syncTodayQuestsFromPlan(false);
    checkDailyBonus();
    S.commit();
  };

  S.removePlannedQuest = function (dayCode, planId, removeAllDays) {
    var wp = S.ensureWeeklyPlan();
    if (!wp) return;
    var targetItem = null;
    if (dayCode && wp.days[dayCode]) {
      targetItem = wp.days[dayCode].find(function (x) { return x.planId === planId; });
    }
    if (removeAllDays && targetItem && targetItem.groupId) {
      (S.DAYS || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).forEach(function (d) {
        wp.days[d] = (wp.days[d] || []).filter(function (x) { return x.groupId !== targetItem.groupId; });
      });
    } else if (dayCode && wp.days[dayCode]) {
      wp.days[dayCode] = wp.days[dayCode].filter(function (x) { return x.planId !== planId; });
    }
    wp.activePreset = 'custom';
    S.syncTodayQuestsFromPlan(false);
    checkDailyBonus();
    S.commit();
  };

  S.copyDayPlan = function (fromDay, toDays) {
    var wp = S.ensureWeeklyPlan();
    if (!wp || !fromDay || !wp.days[fromDay]) return;
    var src = wp.days[fromDay];
    var srcTag = wp.dayTags[fromDay] || 'CUSTOM DIRECTIVE';
    (toDays || []).forEach(function (d) {
      if (d === fromDay || !wp.days[d]) return;
      wp.days[d] = src.map(function (item) {
        return Object.assign({}, item, { planId: U.uid(), groupId: item.groupId || U.uid() });
      });
      wp.dayTags[d] = srcTag;
    });
    wp.activePreset = 'custom';
    S.syncTodayQuestsFromPlan(false);
    checkDailyBonus();
    S.commit();
  };

  S.clearDayPlan = function (dayCode) {
    var wp = S.ensureWeeklyPlan();
    if (!wp || !dayCode || !wp.days[dayCode]) return;
    wp.days[dayCode] = [];
    wp.dayTags[dayCode] = 'REST & RECOVERY';
    wp.activePreset = 'custom';
    S.syncTodayQuestsFromPlan(false);
    checkDailyBonus();
    S.commit();
  };

  S.applyPlanPreset = function (presetId) {
    var s = S.state;
    var wp = S.ensureWeeklyPlan();
    var allDays = S.DAYS || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    if (presetId === 'canonical') {
      var specs = S.presetSpecs(s.profile.rankTierIndex);
      var groupMap = {};
      specs.forEach(function (sp) { groupMap[sp.preset] = U.uid(); });
      allDays.forEach(function (d) {
        wp.dayTags[d] = 'CANONICAL MANDATE';
        wp.days[d] = specs.map(function (sp) {
          return Object.assign({ planId: U.uid(), groupId: groupMap[sp.preset] }, normalizeSpec(Object.assign({ difficulty: 'D', mode: 'COUNTER', isMandatory: true }, sp)));
        });
      });
      wp.activePreset = 'canonical';
    } else if (presetId === 'blank') {
      allDays.forEach(function (d) {
        wp.dayTags[d] = 'CUSTOM DIRECTIVE';
        wp.days[d] = [];
      });
      wp.activePreset = 'blank';
    } else {
      var presetObj = (S.PLAN_PRESETS || []).find(function (p) { return p.id === presetId; });
      if (!presetObj || !presetObj.days) return false;
      allDays.forEach(function (d) {
        wp.dayTags[d] = (presetObj.dayTags && presetObj.dayTags[d]) || 'TACTICAL DIRECTIVE';
        var daySpecs = presetObj.days[d] || [];
        wp.days[d] = daySpecs.map(function (sp) {
          return Object.assign({ planId: U.uid(), groupId: U.uid() }, normalizeSpec(sp));
        });
      });
      wp.activePreset = presetId;
    }
    S.syncTodayQuestsFromPlan(false);
    checkDailyBonus();
    S.commit();
    return true;
  };

  S.installPresetLegacy = S.installPreset = function () {
    var s = S.state;
    var wp = S.ensureWeeklyPlan();
    var allDays = S.DAYS || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    S.presetSpecs(s.profile.rankTierIndex).forEach(function (sp) {
      var gid = U.uid();
      var norm = normalizeSpec(Object.assign({ difficulty: 'D', mode: 'COUNTER', isMandatory: true }, sp));
      allDays.forEach(function (d) {
        if (!wp.days[d].some(function (x) { return x.preset === sp.preset; })) {
          wp.days[d].push(Object.assign({ planId: U.uid(), groupId: gid }, norm));
        }
      });
    });
    S.syncTodayQuestsFromPlan(false);
  };
  S.removePreset = function () {
    var wp = S.ensureWeeklyPlan();
    (S.DAYS || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).forEach(function (d) {
      wp.days[d] = (wp.days[d] || []).filter(function (q) { return !q.preset; });
    });
    S.state.quests = S.state.quests.filter(function (q) { return !q.preset; });
    S.commit();
  };
  function refreshPresetTargets() {
    var specs = S.presetSpecs(S.state.profile.rankTierIndex);
    var wp = S.ensureWeeklyPlan();
    if (wp && wp.days) {
      (S.DAYS || ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).forEach(function (d) {
        (wp.days[d] || []).forEach(function (item) {
          if (!item.preset) return;
          var sp = specs.find(function (x) { return x.preset === item.preset; });
          if (sp) item.target = sp.target;
        });
      });
    }
    S.state.quests.forEach(function (q) {
      if (!q.preset) return;
      var sp = specs.find(function (x) { return x.preset === q.preset; });
      if (sp) q.targetProgress = sp.target;
    });
  }

  S.addQuest = function (o, silent) {
    var cat = S.CATS[o.category] || S.CATS.HABIT;
    var unit = o.unit || 'REPS';
    var mode = o.mode || (unit === 'CHECK' ? 'CHECK' : 'COUNTER');
    var target = mode === 'CHECK' ? 1 : Math.max(unit === 'KM' ? 0.5 : 1, Number(o.target) || 1);
    var q = {
      id: U.uid(), title: String(o.title || 'Untitled Quest').slice(0, 60), category: o.category || 'HABIT',
      difficulty: o.difficulty || 'E', primaryStat: o.primaryStat || cat.stat,
      currentProgress: 0, targetProgress: target, unit: mode === 'CHECK' ? 'CHECK' : unit, mode: mode,
      xpReward: 0, goldReward: 0, isCompleted: false, isMandatory: !!o.isMandatory,
      recurring: o.recurring !== false && !o.isExam && !o.isPenaltyQuest && !o.isBonus && !o.dungeon && !o.isRedemption,
      isPenaltyQuest: !!o.isPenaltyQuest, isExam: !!o.isExam, isBonus: !!o.isBonus, isRedemption: !!o.isRedemption,
      dungeon: o.dungeon || null, preset: o.preset || null, dScalar: o.dScalar || null,
      expiresAt: o.expiresAt || null, createdAt: Date.now(), completedAt: null
    };
    if (o.recurring === false) q.recurring = false;
    S.state.quests.push(q);
    if (!silent) S.commit();
    return q;
  };

  if (!S.state.quests || S.state.quests.length === 0) {
    S.installPreset();
  }

  // Cleanup any lingering Apple Health and steps counter artifacts from previous migration
  (function cleanupStepsAndAppleHealth() {
    var s = S.state;
    if (s) {
      var changed = false;
      if (s.quests && s.quests.length > 0) {
        var beforeLen = s.quests.length;
        s.quests = s.quests.filter(function (q) {
          return q.preset !== 'steps10k' && q.unit !== 'STEPS';
        });
        if (s.quests.length !== beforeLen) changed = true;
      }
      if (s.appleHealth) {
        delete s.appleHealth;
        changed = true;
      }
      if (s.records && 'stepsLogged' in s.records) {
        delete s.records.stepsLogged;
        changed = true;
      }
      if (changed) S.save();
    }
  })();
  S.ensureWeeklyPlan();
  S.deleteQuest = function (id) {
    var q = S.getQuest(id);
    if (!q || q.isPenaltyQuest || q.isExam) return;
    var wp = S.ensureWeeklyPlan();
    var todayCode = S.dayCode(S.state.currentDate);
    if (wp && wp.days && wp.days[todayCode]) {
      wp.days[todayCode] = wp.days[todayCode].filter(function (p) {
        if (q.planId && p.planId === q.planId) return false;
        if (q.groupId && p.groupId === q.groupId) return false;
        return !(p.title.toLowerCase() === q.title.toLowerCase() && p.category === q.category);
      });
    }
    S.state.quests = S.state.quests.filter(function (x) { return x.id !== id; });
    checkDailyBonus();
    S.commit();
  };
  S.getQuest = function (id) { return S.state.quests.find(function (q) { return q.id === id; }); };

  S.addProgress = function (id, delta) {
    var q = S.getQuest(id);
    if (!q || q.isCompleted) return;
    var before = q.currentProgress;
    q.currentProgress = Math.round(U.clamp(before + delta, 0, q.targetProgress) * 100) / 100;
    var diff = q.currentProgress - before;
    if (diff > 0) {
      if (q.unit === 'REPS') S.state.records.repsLogged += diff;
      if (q.unit === 'KM') S.state.records.kmLogged += diff;
    }
    if (q.currentProgress >= q.targetProgress) completeQuest(q);
    S.commit();
  };
  S.maxProgress = function (id) { var q = S.getQuest(id); if (q) S.addProgress(id, q.targetProgress - q.currentProgress); };
  S.sealQuest = function (id) { var q = S.getQuest(id); if (q && !q.isCompleted) { q.currentProgress = q.targetProgress; completeQuest(q); S.commit(); } };

  function completeQuest(q) {
    var s = S.state, p = s.profile, rec = s.records, log = S.dayLog();
    q.isCompleted = true;
    q.completedAt = S.now();
    var result = { q: q, xp: 0, gold: 0, stat: 0, frozen: false };

    if (q.isPenaltyQuest) {
      clearPenalty('SURVIVED');
    } else if (q.isRedemption) {
      if (s.lastLost) { p.streakDays += s.lastLost.amount; p.maxStreak = Math.max(p.maxStreak, p.streakDays); S.notify('[REDEMPTION COMPLETE]', 'Lost streak of ' + s.lastLost.amount + ' days has been restored.', 'gold'); s.lastLost = null; }
      if (log) log.resolved = true;
    } else if (S.isFrozen()) {
      result.frozen = true;
    } else {
      var dObj = getDiff(q);
      var xp = S.payout(q), gold = S.goldPayout(q), stat = dObj.stat || 1;
      q.xpReward = xp; q.goldReward = gold;
      p.gold += gold; rec.goldEarned += gold;
      var pStat = q.primaryStat || 'STR';
      p.stats[pStat] = (p.stats[pStat] || 10) + stat;
      if (S.CATS[q.category] && S.CATS[q.category].physical) {
        var fat = (dObj.fatigue || 15) * (1 - Math.min(0.5, p.stats.VIT * 0.004)) * Math.max(0, 1 - S.buffSum('fatigue'));
        p.fatigue = U.clamp(p.fatigue + fat, 0, 100);
      }
      if (log.capQuests < 6) { log.hrsXp += xp; log.capQuests++; }
      result.xp = xp; result.gold = gold; result.stat = stat;
      gainXp(xp);
    }
    rec.questsCompleted++;
    log.quests++;
    var h = S.nowDate().getHours();
    if (h < 6) rec.dawnClears++;
    if (h === 23) rec.midnightClears++;
    if (q.difficulty === 'A' || q.difficulty === 'S') rec.highRankQuests++;
    if (q.dungeon) { rec.dungeonsCleared++; s.inventory.boxes.BLESSED++; S.notify('[DUNGEON CLEARED]', q.title + ' — Reward: Blessed Random Box x1.', 'gold'); }

    S.emit('questComplete', result);
    checkExamComplete();
    checkDailyBonus();
    S.checkUnlocks();
  }

  S.mandatoryQuests = function () { return S.state.quests.filter(function (q) { return q.isMandatory && !q.isPenaltyQuest && !q.isExam && !q.isRedemption; }); };
  S.allMandatoryDone = function () { var m = S.mandatoryQuests(); return m.length > 0 && m.every(function (q) { return q.isCompleted; }); };
  function checkDailyBonus() {
    var s = S.state;
    if (s.dailyBonusClaimed || !S.allMandatoryDone()) return;
    s.dailyBonusClaimed = true;
    s.profile.fatigue = 0;
    s.inventory.boxes.BLESSED++;
    s.profile.gold += 50; s.records.goldEarned += 50;
    s.profile.essenceStones += 2;
    S.emit('dailyComplete', {});
  }

  S.allocate = function (stat) {
    var p = S.state.profile;
    if (p.unallocatedAp <= 0 || !p.stats.hasOwnProperty(stat)) return;
    p.unallocatedAp--; p.stats[stat]++;
    S.checkUnlocks();
    S.commit();
  };

  /* --- Bonus Quest re-roll (AGI reduces cooldown) --- */
  S.rerollCooldownMs = function () { return Math.max(30, 240 - S.state.profile.stats.AGI * 2) * 60000; };
  S.rerollReadyIn = function () { return Math.max(0, S.state.rerollAt - S.now()); };
  S.reroll = function () {
    var s = S.state;
    if (S.rerollReadyIn() > 0) return false;
    s.quests = s.quests.filter(function (q) { return !(q.isBonus && !q.isCompleted); });
    var spec = U.pick(S.BONUS_POOL), letter = S.rank().letter;
    S.addQuest(Object.assign({ isBonus: true, recurring: false, difficulty: letter }, spec), true);
    s.rerollAt = S.now() + S.rerollCooldownMs();
    S.notify('[BONUS QUEST ASSIGNED]', spec.title.replace('Bonus: ', '') + ' (' + letter + '-Rank). Expires at midnight.', 'info');
    S.commit();
    return true;
  };

  /* ======================= Midnight evaluation & Penalty Zone ======================= */
  function evaluateDay(date) {
    var s = S.state, p = s.profile, log = S.dayLog(date);
    if (s.exam) {
      var eq = s.quests.filter(function (q) { return q.isExam; });
      if (eq.some(function (q) { return !q.isCompleted; })) S.notify('[RANK ADVANCEMENT FAILED]', 'The Promotion Exam was not cleared in time. You may retry.', 'danger');
      s.exam = null;
    }
    var mand = S.mandatoryQuests();
    if (!mand.length) return;
    if (mand.every(function (q) { return q.isCompleted; })) {
      p.streakDays++;
      p.maxStreak = Math.max(p.maxStreak, p.streakDays);
      log.perfect = true;
      s.records.perfectDays++;
      S.notify('[DAILY QUEST EVALUATION]', date + ' cleared. Streak: ' + p.streakDays + ' days.', 'gold');
      return;
    }
    log.failed = true;
    if (S.qty('c_rune_protect') > 0) {
      s.inventory.owned.c_rune_protect--;
      log.resolved = true;
      S.notify('[RUNE OF PROTECTION CONSUMED]', 'The ward absorbed the judgement. Streak preserved.', 'gold');
      return;
    }
    if (p.penaltyMode === 'HARDCORE') {
      if (p.streakDays > 0) s.lastLost = { amount: p.streakDays, at: S.now() };
      p.streakDays = 0;
      if (!p.inPenaltyZone) {
        p.inPenaltyZone = true;
        s.penalty = { since: S.now(), choice: null, date: date };
        S.emit('penalty', { mode: 'HARDCORE' });
      }
    } else {
      var lost = Math.min(5, p.streakDays);
      p.streakDays -= lost;
      if (lost > 0) {
        s.lastLost = { amount: lost, at: S.now() };
        S.addQuest({ title: 'Redemption Quest: 100 Burpees', category: 'PENALTY', primaryStat: 'VIT', difficulty: 'C', target: Math.round(100 * penaltySoftener()), unit: 'REPS', mode: 'COUNTER', isRedemption: true, recurring: false, expiresAt: S.now() + 86400000 }, true);
      }
      S.emit('penalty', { mode: 'OPTIONAL', lost: lost });
    }
  }
  function startDay(date) {
    var s = S.state, p = s.profile, now = S.now();
    s.quests = s.quests.filter(function (q) {
      if (q.isPenaltyQuest) return !q.isCompleted;
      if (q.isExam || q.isBonus) return false;
      if (q.isRedemption) return !q.isCompleted && q.expiresAt > now;
      if (q.recurring) return true;
      return !q.isCompleted;
    });
    s.currentDate = date;
    S.ensureWeeklyPlan();
    s.quests = s.quests.filter(function (q) { return q.isPenaltyQuest || q.isRedemption || q.dungeon || q.oneOff; });
    S.syncTodayQuestsFromPlan(true);
    refreshPresetTargets();
    p.fatigue = Math.max(0, p.fatigue - (30 + p.stats.VIT * 0.2));
    s.dailyBonusClaimed = false;
    s.currentDate = date;
    S.dayLog(date);
    // prune old logs (keep ~120 days)
    var cutoff = U.addDays(date, -120);
    Object.keys(s.log).forEach(function (d) { if (d < cutoff) delete s.log[d]; });
  }
  /** Returns true if one or more day rollovers happened. */
  S.checkRollover = function () {
    var s = S.state, t = S.today();
    if (!s.initialized || s.currentDate >= t) return false;
    var d = s.currentDate, guard = 0;
    while (d < t && guard < 14) {
      evaluateDay(d);
      d = U.addDays(d, 1);
      startDay(d);
      guard++;
    }
    if (s.currentDate !== t) startDay(t);
    S.notify('[DAILY QUEST HAS ARRIVED]', 'Preparation to Become Strong. Complete before 00:00:00.', 'info');
    S.checkUnlocks();
    S.save();
    return true;
  };

  function penaltySoftener() { return 1 - Math.min(0.3, S.state.profile.stats.VIT * 0.003); }
  S.choosePenalty = function (type) {
    var s = S.state;
    if (!S.state.profile.inPenaltyZone || (s.penalty && s.penalty.choice)) return;
    s.penalty = s.penalty || { since: S.now() };
    s.penalty.choice = type;
    if (type === 'PHYSICAL') {
      var sp = U.pick(S.PENALTY_PHYSICAL);
      var target = sp.unit === 'REPS' ? Math.round(sp.target * penaltySoftener()) : Math.max(1, Math.round(sp.target * penaltySoftener() * 2) / 2);
      S.addQuest({ title: sp.title, category: 'PENALTY', primaryStat: 'VIT', difficulty: 'C', target: target, unit: sp.unit, mode: 'COUNTER', isPenaltyQuest: true, isMandatory: false, recurring: false }, true);
    } else {
      S.addQuest({ title: 'Penalty: 45-Minute Dark Lock Gate', category: 'PENALTY', primaryStat: 'PER', difficulty: 'E', target: 45, unit: 'MINS', mode: 'DURATION', isPenaltyQuest: true, recurring: false }, true);
    }
    S.commit();
  };
  function clearPenalty(reason) {
    var s = S.state, p = s.profile;
    if (!p.inPenaltyZone) return;
    p.inPenaltyZone = false;
    s.penalty = null;
    s.quests = s.quests.filter(function (q) { return !q.isPenaltyQuest || q.isCompleted; });
    s.quests = s.quests.filter(function (q) { return !q.isPenaltyQuest; });
    Object.keys(s.log).forEach(function (d) { if (s.log[d].failed) s.log[d].resolved = true; });
    s.records.penaltiesSurvived++;
    S.emit('penaltyCleared', { reason: reason });
  }
  S.purify = function () {
    if (!S.state.profile.inPenaltyZone || S.qty('c_purify') <= 0) return false;
    S.state.inventory.owned.c_purify--;
    clearPenalty('PURIFIED');
    S.checkUnlocks();
    S.commit();
    return true;
  };

  /* ======================= Dungeon Gates (Focus) ======================= */
  S.gateDef = function (g) { g = g || S.state.gate; if (!g) return null; return g.isPenalty ? S.PENALTY_GATE : S.GATES.find(function (x) { return x.id === g.gateId; }); };
  S.startGate = function (gateId, opts) {
    var s = S.state;
    if (s.gate) return false;
    opts = opts || {};
    var def = opts.isPenalty ? S.PENALTY_GATE : S.GATES.find(function (x) { return x.id === gateId; });
    if (!def) return false;
    s.gate = {
      gateId: def.id, phase: 'FOCUS', startedAt: S.now(), durationMs: def.focus * 60000,
      pausedAt: null, pausedTotal: 0, darkLock: opts.isPenalty ? true : !!opts.darkLock, breached: false,
      linkedQuestId: opts.linkedQuestId || null, isPenalty: !!opts.isPenalty, graceStart: null
    };
    S.emit('gateStart', s.gate);
    S.commit();
    return true;
  };
  S.gateRemaining = function () {
    var g = S.state.gate;
    if (!g) return 0;
    var now = S.now();
    var paused = g.pausedTotal + (g.pausedAt ? now - g.pausedAt : 0);
    return g.durationMs - (now - g.startedAt - paused);
  };
  S.pauseGate = function () { var g = S.state.gate, def = S.gateDef(); if (!g || g.pausedAt || g.phase !== 'FOCUS' || !def.pausable) return; g.pausedAt = S.now(); S.commit(); };
  S.resumeGate = function () { var g = S.state.gate; if (!g || !g.pausedAt) return; g.pausedTotal += S.now() - g.pausedAt; g.pausedAt = null; S.commit(); };
  S.abandonGate = function () {
    var g = S.state.gate;
    if (!g) return;
    var wasRest = g.phase === 'REST';
    S.state.gate = null;
    if (!wasRest) S.notify(g.isPenalty ? '[SURVIVAL FAILED]' : '[GATE ABANDONED]', g.isPenalty ? 'You fled the Penalty Gate. The Penalty Zone remains.' : 'All Gate loot has been forfeited.', 'danger');
    S.emit('gateEnd', {});
    S.commit();
  };
  S.skipRest = function () { if (S.state.gate && S.state.gate.phase === 'REST') { S.state.gate = null; S.emit('gateEnd', {}); S.commit(); } };
  S.breachGate = function () {
    var g = S.state.gate;
    if (!g || g.breached || g.phase !== 'FOCUS') return;
    S.state.records.breaches++;
    if (g.isPenalty) {
      S.state.gate = null;
      S.emit('gateBreach', { penalty: true });
      S.notify('[FOCUS BROKEN]', 'The Penalty Gate collapsed. You must survive again.', 'danger');
      S.emit('gateEnd', {});
    } else {
      g.breached = true;
      g.graceStart = null;
      S.emit('gateBreach', {});
      S.notify('[FOCUS BROKEN] GATE BREACH', 'XP yield reduced by 50%. Bonus loot corrupted.', 'danger');
    }
    S.commit();
  };
  function finishFocus() {
    var s = S.state, g = s.gate, def = S.gateDef(g), p = s.profile, rec = s.records, log = S.dayLog();
    var mins = def.focus;
    var linked = g.linkedQuestId ? S.getQuest(g.linkedQuestId) : null;
    var cat = linked ? linked.category : 'FOCUS';
    var verified = g.darkLock && !g.breached;
    var summary = { def: def, mins: mins, breached: g.breached, verified: verified, xp: 0, essence: 0, box: null, linked: linked ? linked.title : null, isPenalty: g.isPenalty };

    rec.focusMins += mins;
    log.focusMins += mins;
    if (verified) { rec.verifiedMins += mins; log.verifiedMins += mins; if (!g.isPenalty) rec.cleanDarkLocks++; }

    if (g.isPenalty) {
      var pq = s.quests.find(function (q) { return q.isPenaltyQuest && !q.isCompleted; });
      if (pq) { pq.currentProgress = pq.targetProgress; completeQuest(pq); } else clearPenalty('SURVIVED');
    } else {
      rec.gatesCleared++;
      if (def.id === 'S' && !g.breached) rec.redGates++;
      if (!S.isFrozen()) {
        var xp = S.gatePayout(def, cat, g.breached);
        summary.xp = xp;
        var room = Math.max(0, 240 - log.capFocus);
        var counted = Math.min(room, mins);
        if (counted > 0) log.hrsXp += Math.floor(xp * counted / mins);
        log.capFocus += mins;
        gainXp(xp);
        p.essenceStones += def.essence; summary.essence = def.essence;
        var chance = def.lootChance + p.stats.PER * 0.0015;
        if (g.breached) { s.inventory.boxes.CURSED++; summary.box = 'CURSED'; }
        else if (Math.random() < chance) { s.inventory.boxes.BLESSED++; summary.box = 'BLESSED'; }
        p.stats.PER += g.darkLock && !g.breached ? 2 : 1;
      }
      if (linked && !linked.isCompleted) {
        var room2 = linked.targetProgress - linked.currentProgress;
        linked.currentProgress = Math.min(linked.targetProgress, linked.currentProgress + Math.min(room2, mins));
        if (linked.currentProgress >= linked.targetProgress) completeQuest(linked);
      }
    }
    if (def.rest > 0 && !g.isPenalty) {
      s.gate = { gateId: g.gateId, phase: 'REST', startedAt: S.now(), durationMs: def.rest * 60000, pausedAt: null, pausedTotal: 0, darkLock: false, breached: false, linkedQuestId: null, isPenalty: false, graceStart: null };
    } else {
      s.gate = null;
    }
    S.emit('gateCleared', summary);
    S.checkUnlocks();
    S.commit();
  }
  S.gateTick = function () {
    var g = S.state.gate;
    if (!g || g.pausedAt) return;
    if (S.gateRemaining() <= 0) {
      if (g.phase === 'FOCUS') finishFocus();
      else { S.state.gate = null; S.notify('[REST COMPLETE]', 'Your mana has recovered. The next Gate awaits.', 'info'); S.emit('gateEnd', { rest: true }); S.commit(); }
    }
  };

  /* ======================= Loot & Vault ======================= */
  function grant(id, n) {
    var s = S.state;
    if (!s) return;
    var inv = s.inventory = s.inventory || { owned: {}, seen: {}, shadows: {}, boxes: { BLESSED: 1, CURSED: 0 } };
    inv.owned = inv.owned || {};
    inv.seen = inv.seen || {};
    inv.owned[id] = (inv.owned[id] || 0) + (n || 1);
    inv.seen[id] = true;
  }
  S.grant = grant;
  S.rarityWeights = function (type) {
    var w = type === 'CURSED' ? [30, 30, 22, 13, 5] : [55, 27, 12, 5, 1];
    var bonus = S.state.profile.stats.PER * 0.0015 + S.buffSum('loot');
    var shift = Math.min(w[0] - 5, bonus * 100);
    var rest = w[1] + w[2] + w[3] + w[4];
    return [w[0] - shift, w[1] + shift * w[1] / rest, w[2] + shift * w[2] / rest, w[3] + shift * w[3] / rest, w[4] + shift * w[4] / rest];
  };
  function rollRarity(type) {
    var w = S.rarityWeights(type), total = w.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * total;
    for (var i = 0; i < w.length; i++) { if (x < w[i]) return S.RARITIES[i]; x -= w[i]; }
    return 'COMMON';
  }
  S.openBox = function (type) {
    var s = S.state, inv = s.inventory, p = s.profile;
    if (S.isFrozen() || inv.boxes[type] <= 0) return null;
    inv.boxes[type]--;
    s.records.boxesOpened++;
    var rarity = rollRarity(type);
    var pool = S.VAULT.filter(function (it) { return it.rarity === rarity && (it.category === 'RELIC' || (it.category === 'CONSUMABLE' && it.effect.type !== 'passive' || it.id === 'c_rune_protect')); });
    var relics = pool.filter(function (it) { return it.category === 'RELIC'; });
    var cons = pool.filter(function (it) { return it.category === 'CONSUMABLE'; });
    var src = (Math.random() < 0.4 && relics.length) || !cons.length ? relics : cons;
    var item = U.pick(src);
    var res = { type: type, rarity: rarity, item: item, dup: false, essence: 0, gold: 0, curse: null };
    if (item.category === 'RELIC' && S.qty(item.id) > 0) {
      res.dup = true; res.essence = S.DUP_ESSENCE[rarity]; p.essenceStones += res.essence;
    } else grant(item.id, 1);
    res.gold = Math.floor((10 + Math.random() * 40) * (type === 'CURSED' ? 1.5 : 1));
    p.gold += res.gold; s.records.goldEarned += res.gold;
    if (type === 'CURSED' && Math.random() < 0.35) {
      if (Math.random() < 0.5) { p.fatigue = Math.min(100, p.fatigue + 25); res.curse = 'CURSE: Exhaustion. Fatigue +25%.'; }
      else { var loss = Math.floor(p.gold * 0.1); p.gold -= loss; res.curse = 'CURSE: Greed. Lost ' + loss + ' Gold.'; }
    }
    s.lootHistory.unshift({ id: item.id, name: item.name, rarity: rarity, dup: res.dup, at: Date.now() });
    s.lootHistory = s.lootHistory.slice(0, 20);
    S.checkUnlocks();
    S.commit();
    return res;
  };

  S.useItem = function (id) {
    var s = S.state, p = s.profile, it = S.ITEM[id];
    if (!it || it.category !== 'CONSUMABLE' || S.qty(id) <= 0) return false;
    var e = it.effect, msg = '';
    switch (e.type) {
      case 'fatigue': p.fatigue = Math.max(0, p.fatigue - e.v); msg = 'Fatigue reduced to ' + Math.round(p.fatigue) + '%.'; break;
      case 'stat': Object.keys(e.changes).forEach(function (k) { p.stats[k] = Math.max(1, p.stats[k] + e.changes[k]); }); msg = it.buffDescription; break;
      case 'streakRepair':
        if (!s.lastLost || S.now() - s.lastLost.at > 48 * 3600000) { S.notify('[SYSTEM]', 'No broken streak within 48 hours to repair.', 'danger'); return false; }
        p.streakDays += s.lastLost.amount; p.maxStreak = Math.max(p.maxStreak, p.streakDays);
        msg = 'Streak of ' + s.lastLost.amount + ' days restored.'; s.lastLost = null;
        s.quests = s.quests.filter(function (q) { return !q.isRedemption; });
        break;
      case 'purify':
        if (!p.inPenaltyZone) { S.notify('[SYSTEM]', 'You are not in the Penalty Zone.', 'danger'); return false; }
        return S.purify();
      case 'buff':
        s.buffs.push({ id: it.id, k: e.k, t: e.t, v: e.v, until: S.now() + e.hours * 3600000, label: it.name });
        msg = it.buffDescription; break;
      case 'reroll': s.rerollAt = 0; msg = 'Bonus Quest re-roll is ready.'; break;
      case 'dungeon':
        var spec = e.q;
        if (e.random) { var b = U.pick(S.BONUS_POOL); spec = Object.assign({}, b, { title: 'Instant Dungeon: ' + b.title.replace('Bonus: ', ''), difficulty: S.rank().letter }); }
        S.addQuest(Object.assign({ dungeon: it.id, recurring: false }, spec), true);
        msg = 'A Dungeon Gate has opened: ' + spec.title; break;
      case 'passive': S.notify('[SYSTEM]', 'This rune activates automatically at midnight.', 'info'); return false;
    }
    s.inventory.owned[id]--;
    S.notify('[ITEM USED] ' + it.name, msg, 'info');
    S.checkUnlocks();
    S.commit();
    return true;
  };

  S.equipRelic = function (id) {
    var p = S.state.profile;
    if (S.qty(id) <= 0 || S.isFrozen()) return;
    if (p.equippedRelicIds.indexOf(id) >= 0) return;
    var slot = p.equippedRelicIds.indexOf(null);
    if (slot < 0) { p.equippedRelicIds[0] = p.equippedRelicIds[1]; slot = 1; }
    p.equippedRelicIds[slot] = id;
    S.commit();
  };
  S.unequipRelic = function (id) { var p = S.state.profile; p.equippedRelicIds = p.equippedRelicIds.map(function (x) { return x === id ? null : x; }); S.commit(); };

  S.isUnlocked = function (it) {
    if (!it) return false;
    var s = S.state;
    if (!s) return false;
    var inv = s.inventory = s.inventory || { owned: {}, seen: {}, shadows: {}, boxes: {} };
    inv.owned = inv.owned || {};
    inv.seen = inv.seen || {};
    inv.shadows = inv.shadows || {};
    var skins = s.unlockedSkins || (s.unlockedSkins = ['skin_classic']);
    var titles = s.unlockedTitles || (s.unlockedTitles = ['t_weakest']);
    var borders = s.unlockedBorders || (s.unlockedBorders = ['br_e']);

    switch (it.category) {
      case 'RELIC': return S.qty(it.id) > 0;
      case 'CONSUMABLE': return !!inv.seen[it.id];
      case 'SKIN': return skins.indexOf(it.id) >= 0;
      case 'TITLE': return titles.indexOf(it.id) >= 0;
      case 'SHADOW': return it.kind === 'border' ? borders.indexOf(it.id) >= 0 : !!inv.shadows[it.id];
    }
    return false;
  };
  S.collectionCount = function () {
    return S.VAULT ? S.VAULT.filter(function (it) { return S.isUnlocked(it); }).length : 0;
  };

  S.buySkin = function (id) {
    var s = S.state, it = S.ITEM[id];
    if (!it || S.isUnlocked(it) || S.isFrozen()) return false;
    if (it.cond && !it.cond(s)) { S.notify('[REQUIREMENT NOT MET]', it.unlockRequirementText, 'danger'); return false; }
    if (s.profile.gold < it.cost) { S.notify('[INSUFFICIENT GOLD]', 'Required: ' + U.fmt(it.cost) + ' Gold.', 'danger'); return false; }
    s.profile.gold -= it.cost;
    s.unlockedSkins.push(id);
    s.profile.activeSkinId = id;
    S.notify('[SKIN UNLOCKED]', it.name + ' applied.', 'gold');
    S.commit();
    return true;
  };
  S.applySkin = function (id) { if (S.state.unlockedSkins.indexOf(id) >= 0) { S.state.profile.activeSkinId = id; S.commit(); } };
  S.setTitle = function (id) { if (S.state.unlockedTitles.indexOf(id) >= 0) { S.state.profile.activeTitle = id; S.commit(); } };
  S.setBorder = function (id) { if (!id || S.state.unlockedBorders.indexOf(id) >= 0) { S.state.profile.activeBorderId = id; S.commit(); } };

  S.canArise = function () { return S.state.profile.level >= 40; };
  S.extractShadow = function (id) {
    var s = S.state, p = s.profile, it = S.ITEM[id];
    if (!it || it.kind !== 'shadow' || s.inventory.shadows[id] || S.isFrozen()) return false;
    if (!S.canArise()) { S.notify('[LOCKED]', 'The ARISE command unlocks at Lv. 40 (Job Change).', 'danger'); return false; }
    if (p.rankTierIndex < it.minTier) { S.notify('[REQUIREMENT NOT MET]', 'Requires ' + S.RANKS[it.minTier].code + ' Rank.', 'danger'); return false; }
    if (p.essenceStones < it.cost) { S.notify('[INSUFFICIENT ESSENCE]', 'Required: ' + it.cost + ' Essence Stones.', 'danger'); return false; }
    p.essenceStones -= it.cost;
    s.inventory.shadows[id] = 1;
    s.records.shadowsExtracted++;
    if (!p.activeShadowId) p.activeShadowId = id;
    S.emit('arise', { item: it });
    S.checkUnlocks();
    S.commit();
    return true;
  };
  S.shadowUpgradeCost = function (id) {
    var inv = (S.state && S.state.inventory) || {};
    var shadows = inv.shadows || {};
    var lvl = shadows[id] || 1;
    var it = S.ITEM ? S.ITEM[id] : null;
    return it ? Math.ceil(it.cost * 0.25 * lvl) : 10;
  };
  S.upgradeShadow = function (id) {
    var s = S.state, lvl = s.inventory.shadows[id];
    if (!lvl || lvl >= 10 || S.isFrozen()) return false;
    var cost = S.shadowUpgradeCost(id);
    if (s.profile.essenceStones < cost) { S.notify('[INSUFFICIENT ESSENCE]', 'Required: ' + cost + ' Essence Stones.', 'danger'); return false; }
    s.profile.essenceStones -= cost;
    s.inventory.shadows[id] = lvl + 1;
    S.notify('[SHADOW EVOLVED]', S.ITEM[id].name + ' reached Lv. ' + (lvl + 1) + '.', 'gold');
    S.commit();
    return true;
  };
  S.setShadow = function (id) { if (!id || S.state.inventory.shadows[id]) { S.state.profile.activeShadowId = id; S.commit(); } };

  S.shopBuy = function (shopId) {
    var s = S.state, p = s.profile, entry = S.SHOP.find(function (x) { return x.id === shopId; });
    if (!entry || S.isFrozen()) return false;
    var wallet = entry.cur === 'gold' ? 'gold' : 'essenceStones';
    if (p[wallet] < entry.price) { S.notify('[INSUFFICIENT ' + (entry.cur === 'gold' ? 'GOLD' : 'ESSENCE') + ']', 'Required: ' + entry.price + '.', 'danger'); return false; }
    p[wallet] -= entry.price;
    if (entry.box) s.inventory.boxes[entry.box]++;
    else grant(entry.id, 1);
    S.notify('[PURCHASE COMPLETE]', (entry.name || S.ITEM[entry.id].name) + ' added to your inventory.', 'info');
    S.checkUnlocks();
    S.commit();
    return true;
  };

  /** Auto-unlocks titles and avatar borders whose conditions are met. */
  S.checkUnlocks = function () {
    var s = S.state;
    if (!s) return;
    s.unlockedTitles = s.unlockedTitles || ['t_weakest'];
    s.unlockedBorders = s.unlockedBorders || ['br_e'];
    s.unlockedSkins = s.unlockedSkins || ['skin_classic'];
    if (!S.VAULT) return;
    S.VAULT.forEach(function (it) {
      if (!it || !it.cond) return;
      if (it.category === 'TITLE' && s.unlockedTitles.indexOf(it.id) < 0 && it.cond(s)) {
        s.unlockedTitles.push(it.id);
        S.notify('[TITLE ACQUIRED]', '"' + it.name + '"', 'gold');
      }
      if (it.kind === 'border' && s.unlockedBorders.indexOf(it.id) < 0 && it.cond(s)) {
        s.unlockedBorders.push(it.id);
        S.notify('[AVATAR BORDER UNLOCKED]', it.name, 'gold');
      }
    });
  };

  /** Expire timed buffs and redemption quests. Returns true if anything changed. */
  S.housekeeping = function () {
    var s = S.state, now = S.now(), changed = false;
    var nb = s.buffs.filter(function (b) { return b.until > now; });
    if (nb.length !== s.buffs.length) { s.buffs = nb; changed = true; }
    var nq = s.quests.filter(function (q) { return !(q.isRedemption && !q.isCompleted && q.expiresAt && q.expiresAt < now); });
    if (nq.length !== s.quests.length) { s.quests = nq; changed = true; S.notify('[REDEMPTION EXPIRED]', 'The lost streak can no longer be recovered by quest.', 'danger'); }
    return changed;
  };

  /* ======================= Hunter Rating Score & Leaderboards ======================= */
  /** HRS = (sum capped XP) * (1 + ln(S+1)/4) + 15*M_focus - 250*P_failed */
  S.hrs = function (fromDate, toDate) {
    var s = S.state, xp = 0, mins = 0, failed = 0;
    Object.keys(s.log).forEach(function (d) {
      if (d < fromDate || d > toDate) return;
      var l = s.log[d];
      xp += l.hrsXp; mins += l.verifiedMins;
      if (l.failed && !l.resolved) failed++;
    });
    var streakF = 1 + Math.log(s.profile.streakDays + 1) / 4;
    return { total: Math.max(0, Math.floor(xp * streakF + 15 * mins - 250 * failed)), xp: xp, streakF: streakF, mins: mins, failed: failed };
  };
  S.seasonHrs = function () { var t = S.state.currentDate; return S.hrs(U.weekStart(t), t); };

  S.boards = function (view) {
    var s = S.state;
    var p = (s && s.profile) ? s.profile : { hunterName: 'PLAYER', rankTierIndex: 0, level: 1, maxStreak: 0 };
    var t = (s && s.currentDate) ? s.currentDate : S.today();
    var ws = U.weekStart(t);
    var dayIdx = (U.parseDate(t).getDay() + 6) % 7;
    var now = S.nowDate();
    var frac = Math.max(0.04, (dayIdx + (now.getHours() * 60 + now.getMinutes()) / 1440) / 7);
    var tier = Math.max(0, Math.min(S.RANKS.length - 1, p.rankTierIndex || 0));
    var rand = U.rng(U.hash(ws + (view || 'VANGUARD') + (view === 'DIVISION' ? tier : '')));
    var names = (S.RIVAL_NAMES && S.RIVAL_NAMES.length) ? S.RIVAL_NAMES.slice() : ['HUNTER_CHA', 'BAEK_YOON', 'HWANG_DONGSOO', 'CHOI_JONGIN'];
    for (var i = names.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var tmp = names[i]; names[i] = names[j]; names[j] = tmp; }
    var rows = [];
    var myRank = S.rank ? S.rank() : S.RANKS[0];
    var me = { name: (p.hunterName || 'PLAYER').toUpperCase(), you: true, tier: (myRank ? myRank.code : 'E-IV'), level: p.level || 1 };
    if (view === 'HALL') {
      for (var k = 0; k < Math.min(names.length, 49); k++) {
        var lv = Math.max(1, Math.floor(Math.pow(rand(), 1.8) * 118) + 1);
        var ti = 0; for (var x = 0; x < S.RANKS.length; x++) if (lv >= S.RANKS[x].minLevel) ti = x;
        ti = Math.max(0, Math.min(S.RANKS.length - 1, ti - Math.floor(rand() * 3)));
        rows.push({ name: names[k], tier: S.RANKS[ti].code, level: lv, streak: Math.floor(rand() * lv * 3), score: Math.floor(lv * 60 + lv * 55 * (0.8 + rand() * 0.5) + ti * 250) });
      }
      me.streak = p.maxStreak || 0; me.score = S.combatPower ? S.combatPower() : 100;
    } else {
      var count = Math.min(names.length, 49);
      for (var m = 0; m < count; m++) {
        var rt = view === 'DIVISION' ? tier : Math.floor(Math.pow(rand(), 1.6) * S.RANKS.length);
        rt = Math.max(0, Math.min(S.RANKS.length - 1, rt));
        var typical = (rt + 1) * 210 + 300;
        rows.push({ name: names[m], tier: S.RANKS[rt].code, score: Math.floor(typical * 7 * frac * (0.35 + rand() * 1.3)) });
      }
      me.score = (S.seasonHrs && S.seasonHrs().total) ? S.seasonHrs().total : 0;
    }
    rows.push(me);
    rows.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    rows.forEach(function (r, i) { r.pos = i + 1; });
    return rows;
  };

  /* ======================= Onboarding ======================= */
  S.awaken = function (name, mode, usePreset, email) {
    var s = S.state;
    if (!s) return;
    s.profile = s.profile || {};
    s.profile.hunterName = (name || 'PLAYER').trim().slice(0, 18) || 'PLAYER';
    s.profile.penaltyMode = mode === 'HARDCORE' ? 'HARDCORE' : 'OPTIONAL';
    if (email) s.profile.email = String(email).trim().toLowerCase();
    if (S.api && typeof S.api.rememberHunterName === 'function' && s.profile.hunterName !== 'PLAYER') {
      S.api.rememberHunterName(email, s.profile.hunterName);
    }
    s.initialized = true;
    s.currentDate = S.today();
    s.settings = s.settings || {};
    s.settings.dayOffset = 0;
    try { S.dayLog(); } catch (e) {}
    if (usePreset !== false) {
      try { S.installPreset(); } catch (e) {}
    } else {
      try { S.applyPlanPreset('blank'); } catch (e) {}
    }
    try {
      grant('c_pot_low', 1);
      grant('c_key_subway', 1);
      S.checkUnlocks();
    } catch (e) {}
    S.commit();
  };

  /* ======================= System Purge ======================= */
  S.resetAll = async function () {
    var pName = (S.state && S.state.profile && S.state.profile.hunterName) || 'Hunter';
    var pEmail = (S.state && S.state.profile && S.state.profile.email) || (S.api && S.api.user && S.api.user.email) || '';
    var pMode = (S.state && S.state.profile && S.state.profile.penaltyMode) || 'OPTIONAL';

    // 1. Temporarily pause background syncing so it will not pull stale remote data over local reset
    if (S.auth) {
      S.auth.isPurging = true;
    }

    // 2. Wipe tracker run history
    try {
      localStorage.removeItem('solo_quest_runs_v1');
      if (S.tracker) {
        S.tracker.history = [];
        S.tracker.activeRun = null;
      }
    } catch (e) {}

    // 3. Clear local storage save & re-instantiate clean default state
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
    S.state = defaultState();

    // 4. Awaken baseline profile with canonical daily quests & starter vault items
    S.awaken(pName, pMode, true, pEmail);

    // 5. Purge remote cloud database (deletes remote quests/runs/logs and resets remote profile/inventory)
    if (S.api && typeof S.api.purgeRemoteData === 'function') {
      try {
        await S.api.purgeRemoteData(S.state);
      } catch (err) {
        console.warn('[RESET ALL] Remote purge failed:', err);
      }
    }

    // 6. Resume auth sync
    if (S.auth) {
      S.auth.isPurging = false;
      if (typeof S.auth.startLiveSync === 'function') {
        S.auth.startLiveSync();
      }
    }

    S.commit();

    // 7. Re-render UI and toast
    if (S.ui) {
      if (typeof S.ui.setView === 'function') {
        S.ui.setView('quests');
      }
      if (typeof S.ui.showToast === 'function') {
        S.ui.showToast('[SYSTEM MEMORY PURGED]', 'All progress and Vault items reset to Level 1.', 'gold');
      }
      if (typeof S.ui.render === 'function') {
        S.ui.render();
      }
    }
  };
})(window.SYS);

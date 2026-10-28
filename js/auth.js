/* ==============================================================================
   THE SYSTEM // PROJECT: ARISE — Authentication & Live Database Coordinator
   Wires hunter authentication, automatic cloud state synchronization, and
   replaces hardcoded rivals with real registered hunters on global leaderboards.
   ============================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var U = S.util;
  var syncTimeout = null;

  var auth = S.auth = {
    syncStatus: 'OFFLINE', // 'OFFLINE' | 'UNAUTHENTICATED' | 'SYNCING' | 'SYNCED' | 'ERROR'
    lastSyncTime: null,
    cachedLeaderboards: {
      VANGUARD: [],
      DIVISION: [],
      HALL: []
    },
    isFetchingLeaderboard: false,

    init: function () {
      // 1. Initial status
      auth.updateStatus();

      // 2. Auto-sync on any state mutation
      S.on('change', function () {
        auth.debouncedSync();
      });

      // 3. Auto-sync on run completion
      S.on('trackerFinished', function () {
        auth.triggerSync(true);
      });

      // 4. Listen to auth changes
      S.on('authChange', function (e) {
        auth.updateStatus();
        if (e && e.user) {
          // Immediately sync down and sync up
          auth.handlePostLogin(e.user);
        } else {
          auth.syncStatus = S.api.provider === 'local' ? 'OFFLINE' : 'UNAUTHENTICATED';
          if (S.ui) S.ui.render();
        }
      });

      // 5. Initial leaderboard fetch from database
      auth.refreshLeaderboards();
    },

    updateStatus: function () {
      if (!S.api.user) {
        auth.syncStatus = S.api.provider === 'local' ? 'OFFLINE' : 'UNAUTHENTICATED';
      } else if (auth.syncStatus !== 'SYNCING') {
        auth.syncStatus = S.api.isConnected ? 'SYNCED' : 'OFFLINE';
      }
      auth.updateTopbarBadge();
    },

    updateTopbarBadge: function () {
      var btn = document.getElementById('btn-topbar-auth');
      var label = document.getElementById('top-auth-label');
      if (!btn || !label) return;

      if (S.api.user) {
        var hName = S.api.user.hunterName;
        var isGeneric = !hName || hName.includes('@') || hName.toUpperCase() === 'PLAYER' || hName.toUpperCase() === 'HUNTER' || /^HUNTER_[0-9A-F]{4,}$/i.test(hName);
        if (isGeneric) {
          hName = (S.api.getRememberedHunterName && S.api.getRememberedHunterName(S.api.user.email)) ||
                  (S.state && S.state.profile && S.state.profile.hunterName && !S.state.profile.hunterName.includes('@') && S.state.profile.hunterName.toUpperCase() !== 'PLAYER' && S.state.profile.hunterName.toUpperCase() !== 'HUNTER' ? S.state.profile.hunterName : null) ||
                  hName ||
                  (S.api.user.email ? S.api.user.email.split('@')[0] : 'HUNTER');
          S.api.user.hunterName = hName;
        }
        label.textContent = hName.toUpperCase();
        btn.classList.add('authenticated');
        btn.classList.remove('unauthenticated');
        btn.title = 'Authenticated Hunter: ' + hName + ' // System Database Connected';
      } else {
        label.textContent = S.api.provider === 'local' ? 'LOCAL HUD' : 'SYSTEM LINK';
        btn.classList.remove('authenticated');
        btn.classList.add('unauthenticated');
        btn.title = 'Click to Awaken or Authenticate System Link with Cloud Database';
      }
    },

    debouncedSync: function () {
      if (!S.api.user || !S.api.token) return;
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(function () {
        auth.triggerSync(false);
      }, 1800);
    },

    triggerSync: async function (showToast) {
      if (!S.api.user || !S.api.token) return;

      auth.syncStatus = 'SYNCING';
      auth.updateTopbarBadge();

      try {
        var runs = S.tracker ? S.tracker.history : [];
        var res = await S.api.syncUp(S.state, runs);

        auth.syncStatus = 'SYNCED';
        auth.lastSyncTime = new Date();
        auth.updateTopbarBadge();

        if (showToast && S.ui) {
          S.ui.showToast('[DATABASE SYNC COMPLETE]', 'Points, stats, quests, and telemetry saved to cloud.', 'cyan');
        }

        // Refresh leaderboards after save
        auth.refreshLeaderboards();

      } catch (err) {
        console.warn('[SYNC ERROR]', err);
        auth.syncStatus = 'ERROR';
        auth.updateTopbarBadge();
        if (showToast && S.ui) {
          S.ui.showToast('[DATABASE SYNC ANOMALY]', err.message, 'danger');
        }
      }
    },

    handlePostLogin: async function (user) {
      if (!user) return;
      auth.syncStatus = 'SYNCING';
      auth.updateTopbarBadge();

      try {
        var isValidCustomName = function (n) {
          if (!n || typeof n !== 'string') return false;
          var t = n.trim();
          if (!t || t.includes('@')) return false;
          var u = t.toUpperCase();
          if (u === 'PLAYER' || u === 'HUNTER' || u === 'UNKNOWN') return false;
          if (/^HUNTER_[0-9A-F]{4,}$/i.test(t)) return false;
          return true;
        };

        var emailPrefix = (user.email && user.email.includes('@')) ? user.email.split('@')[0].toLowerCase() : '';
        var remembered = (S.api && S.api.getRememberedHunterName) ? S.api.getRememberedHunterName(user.email) : null;
        var stateName = (S.state && S.state.profile && isValidCustomName(S.state.profile.hunterName)) ? S.state.profile.hunterName.trim() : null;

        // Resolve clean non-email hunter name, preferring non-email-prefix names
        var cleanName = isValidCustomName(user.hunterName) ? user.hunterName.trim() : '';
        if (!cleanName || (emailPrefix && cleanName.toLowerCase() === emailPrefix)) {
          if (remembered && isValidCustomName(remembered) && remembered.toLowerCase() !== emailPrefix) {
            cleanName = remembered;
          } else if (stateName && stateName.toLowerCase() !== emailPrefix) {
            cleanName = stateName;
          } else if (!cleanName) {
            cleanName = remembered || stateName || (user.email ? user.email.split('@')[0] : 'Hunter');
          }
        }

        user.hunterName = cleanName;
        if (S.api && S.api.user) S.api.user.hunterName = cleanName;
        if (S.state && S.state.profile) {
          S.state.profile.hunterName = cleanName;
          if (user.email) S.state.profile.email = user.email;
        }
        if (S.api && S.api.rememberHunterName && isValidCustomName(cleanName) && (!emailPrefix || cleanName.toLowerCase() !== emailPrefix)) {
          S.api.rememberHunterName(user.email, cleanName);
        }

        // If this is a brand new registration, sync local state up first so default DB trigger values don't overwrite the user's chosen hunter name
        if (user.isNewRegistration) {
          user.isNewRegistration = false;
          await auth.triggerSync(false);
        }

        // Attempt to sync down remote saved state
        var remote = await S.api.syncDown();
        if (remote && remote.profile) {
          var p = remote.profile;
          var remoteName = (p.hunter_name || p.hunterName || '').trim();
          var remoteIsCustom = isValidCustomName(remoteName) && (!emailPrefix || remoteName.toLowerCase() !== emailPrefix);
          var localIsCustom = isValidCustomName(cleanName) && (!emailPrefix || cleanName.toLowerCase() !== emailPrefix);

          if (remoteIsCustom) {
            S.state.profile.hunterName = remoteName;
            user.hunterName = remoteName;
            if (S.api && S.api.user) S.api.user.hunterName = remoteName;
            if (S.api && S.api.rememberHunterName) S.api.rememberHunterName(user.email, remoteName);
          } else if (localIsCustom) {
            S.state.profile.hunterName = cleanName;
            user.hunterName = cleanName;
            if (S.api && S.api.user) S.api.user.hunterName = cleanName;
            if (S.api && S.api.rememberHunterName) S.api.rememberHunterName(user.email, cleanName);
            // Remote had a generic/email-prefix name; push the real hunter name up to the database
            auth.debouncedSync();
          } else if (isValidCustomName(remoteName)) {
            S.state.profile.hunterName = remoteName;
            user.hunterName = remoteName;
            if (S.api && S.api.user) S.api.user.hunterName = remoteName;
          } else {
            S.state.profile.hunterName = cleanName;
          }

          if (p.level) S.state.profile.level = p.level;
          if (p.current_xp !== undefined) S.state.profile.currentXp = p.current_xp;
          if (p.ap !== undefined) {
            S.state.profile.unallocatedAp = p.ap;
            S.state.profile.ap = p.ap;
          }
          if (!S.state.profile.stats) {
            S.state.profile.stats = { STR: 10, AGI: 10, VIT: 10, INT: 10, PER: 10 };
          }
          if (p.str) { S.state.profile.stats.STR = p.str; S.state.profile.str = p.str; }
          if (p.agi) { S.state.profile.stats.AGI = p.agi; S.state.profile.agi = p.agi; }
          if (p.vit) { S.state.profile.stats.VIT = p.vit; S.state.profile.vit = p.vit; }
          if (p.int) { S.state.profile.stats.INT = p.int; S.state.profile.int = p.int; }
          if (p.per) { S.state.profile.stats.PER = p.per; S.state.profile.per = p.per; }
          if (p.gold !== undefined) S.state.profile.gold = p.gold;
          if (p.essence !== undefined) {
            S.state.profile.essenceStones = p.essence;
            S.state.profile.essence = p.essence;
          }
          if (p.rank_tier_index !== undefined) S.state.profile.rankTierIndex = p.rank_tier_index;
          if (p.streak_days !== undefined) S.state.profile.streakDays = p.streak_days;
          if (p.max_streak !== undefined) S.state.profile.maxStreak = p.max_streak;

          // Quests
          if (Array.isArray(remote.quests) && remote.quests.length) {
            S.state.quests = remote.quests.map(function (rq) {
              return {
                id: rq.id,
                title: rq.title,
                category: rq.category,
                unit: rq.unit,
                targetProgress: parseFloat(rq.target_progress || rq.targetProgress || 1),
                currentProgress: parseFloat(rq.current_progress || rq.currentProgress || 0),
                isCompleted: !!(rq.is_completed || rq.isCompleted),
                preset: rq.preset || null,
                isPenaltyQuest: !!(rq.is_penalty_quest || rq.isPenaltyQuest),
                isExam: !!(rq.is_exam || rq.isExam),
                isBonus: !!(rq.is_bonus || rq.isBonus),
                createdDate: rq.created_date || rq.createdDate || S.today()
              };
            });
          }

          // Inventory
          if (remote.inventory) {
            var inv = remote.inventory;
            if (inv.owned_items || inv.owned) S.state.inventory.owned = inv.owned_items || inv.owned;
            if (inv.boxes) S.state.inventory.boxes = inv.boxes;
            if (inv.unlocked_skins || inv.unlockedSkins) S.state.unlockedSkins = inv.unlocked_skins || inv.unlockedSkins;
            if (inv.unlocked_titles || inv.unlockedTitles) S.state.unlockedTitles = inv.unlocked_titles || inv.unlockedTitles;
            if (inv.shadows) S.state.inventory.shadows = inv.shadows;
          }

          S.save();
          if (S.api && S.api.user) {
            try { localStorage.setItem('solo_quest_auth_user_v1', JSON.stringify(S.api.user)); } catch (e) {}
          }
          if (S.ui) S.ui.showToast('[SYSTEM HYDRATED]', 'Data retrieved from database for ' + user.hunterName + '.', 'gold');
        } else {
          // If remote is empty, sync current local state up to populate their fresh account!
          await auth.triggerSync(false);
          if (S.ui) S.ui.showToast('[SYSTEM REGISTERED]', 'Local progress synced to your new database account.', 'cyan');
        }

        auth.syncStatus = 'SYNCED';
        auth.lastSyncTime = new Date();
        auth.updateTopbarBadge();
        auth.refreshLeaderboards();
        if (S.ui) S.ui.render();

      } catch (err) {
        console.warn('[POST-LOGIN HYDRATION ERROR]', err);
        auth.syncStatus = 'ERROR';
        auth.updateTopbarBadge();
      }
    },

    // ==========================================================================
    // Real People Leaderboards: Database Fetching & Caching
    // ==========================================================================
    refreshLeaderboards: async function () {
      if (auth.isFetchingLeaderboard) return;
      auth.isFetchingLeaderboard = true;

      try {
        var views = ['VANGUARD', 'DIVISION', 'HALL'];
        var userTier = S.state.profile.rankTierIndex;

        for (var i = 0; i < views.length; i++) {
          var v = views[i];
          var rows = await S.api.fetchLeaderboard(v, v === 'DIVISION' ? userTier : null);
          if (rows && rows.length) {
            auth.cachedLeaderboards[v] = rows;
          }
        }
      } catch (e) {
        // Network offline, keep cached
      } finally {
        auth.isFetchingLeaderboard = false;
        if (S.ui && typeof S.ui.render === 'function') {
          // Re-render leaderboard views if active
          var rankView = document.querySelector('.vault-tab-btn');
          if (rankView) S.ui.render();
        }
      }
    },

    getRealLeaderboard: function (view) {
      view = (view || 'VANGUARD').toUpperCase();
      var cached = auth.cachedLeaderboards[view];

      // If we have real people from database, format and return them
      if (cached && cached.length) {
        var currentName = S.state.profile.hunterName.toUpperCase();
        var userInList = false;

        var mapped = cached.map(function (r, idx) {
          var isYou = r.you || r.name.toUpperCase() === currentName;
          if (isYou) userInList = true;
          return {
            pos: idx + 1,
            name: r.name,
            tier: r.tier || 'E-IV',
            level: r.level || 1,
            streak: r.streak || 0,
            score: r.score || 0,
            you: isYou
          };
        });

        // Ensure current active user is always represented on the leaderboard!
        if (!userInList) {
          var p = S.state.profile;
          var myScore = view === 'HALL' ? S.combatPower() : S.seasonHrs().total;
          var me = {
            pos: mapped.length + 1,
            name: p.hunterName.toUpperCase(),
            tier: S.rank().code,
            level: p.level,
            streak: p.streakDays,
            score: myScore,
            you: true
          };
          mapped.push(me);
          mapped.sort(function (a, b) { return b.score - a.score; });
          mapped.forEach(function (row, i) { row.pos = i + 1; });
        }

        return mapped;
      }

      // If database has not returned yet or in offline mode:
      // Show user as #1 real player in their system
      var cur = S.state.profile;
      var curScore = view === 'HALL' ? S.combatPower() : S.seasonHrs().total;
      return [{
        pos: 1,
        name: cur.hunterName.toUpperCase(),
        tier: S.rank().code,
        level: cur.level,
        streak: cur.streakDays,
        score: curScore,
        you: true
      }];
    }
  };

  // Wire S.boards to query real people from the database
  var originalBoards = S.boards;
  S.boards = function (view) {
    var realList = auth.getRealLeaderboard(view);
    if (realList && realList.length) {
      return realList;
    }
    return originalBoards(view);
  };

  auth.init();
})(window.SYS);

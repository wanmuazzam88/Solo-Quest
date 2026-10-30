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

      // 2. Auto-sync on any state mutation (snappy 350ms debounce)
      S.on('change', function () {
        auth.debouncedSync();
      });

      // 3. Instant auto-sync on critical progression events (zero delay)
      S.on('questComplete', function () {
        auth.syncWithCloud(false);
      });
      S.on('dailyComplete', function () {
        auth.syncWithCloud(false);
      });
      S.on('levelUp', function () {
        auth.syncWithCloud(false);
      });
      S.on('trackerFinished', function () {
        auth.syncWithCloud(true);
      });

      // 4. Listen to auth changes
      S.on('authChange', function (e) {
        auth.updateStatus();
        if (e && e.user) {
          // Immediately sync down and sync up with smart merge
          auth.handlePostLogin(e.user);
          if (S.api && S.api.initRealtime) {
            S.api.initRealtime(e.user.id, function () {
              auth.syncWithCloud(false);
            });
          }
        } else {
          auth.syncStatus = S.api.provider === 'local' ? 'OFFLINE' : 'UNAUTHENTICATED';
          if (S.api && S.api.stopRealtime) S.api.stopRealtime();
          if (S.ui) S.ui.render();
        }
      });

      // 5. Initial leaderboard fetch from database
      auth.refreshLeaderboards();

      // 6. Connect live realtime telemetry and poller
      if (S.api && S.api.user && S.api.token) {
        setTimeout(function () {
          auth.syncWithCloud(false);
          if (S.api.initRealtime) {
            S.api.initRealtime(S.api.user.id, function () {
              auth.syncWithCloud(false);
            });
          }
        }, 350);
      }
      auth.startLiveSync();

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible' && S.api && S.api.user && S.api.token) {
            auth.syncWithCloud(false);
          }
        });
      }
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', function () {
          if (S.api && S.api.user && S.api.token) {
            auth.syncWithCloud(false);
          }
        });
        window.addEventListener('pagehide', function () {
          if (S.api && S.api.user && S.api.token) {
            auth.triggerSync(false);
          }
        });
      }
    },

    updateStatus: function () {
      if (!S.api.user) {
        auth.syncStatus = S.api.provider === 'local' ? 'LOCAL' : 'UNAUTHENTICATED';
      } else if (S.api.provider === 'local') {
        auth.syncStatus = 'LOCAL';
      } else if (auth.syncStatus !== 'SYNCING') {
        auth.syncStatus = S.api.isConnected ? 'SYNCED' : 'OFFLINE';
      }
      auth.updateTopbarBadge();
    },

    updateTopbarBadge: function () {
      var btn = document.getElementById('btn-topbar-auth');
      var label = document.getElementById('top-auth-label');
      if (!btn || !label) return;

      if (auth.syncStatus === 'EXPIRED') {
        label.textContent = 'RE-LINK';
        btn.classList.remove('authenticated');
        btn.classList.remove('unauthenticated');
        btn.classList.add('expired');
        btn.title = 'System Link Session Expired — Tap to enter passcode and resume cloud sync';
        return;
      }
      btn.classList.remove('expired');

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
      }, 350);
    },

    livePollTimer: null,
    startLiveSync: function () {
      if (auth.livePollTimer) clearInterval(auth.livePollTimer);
      auth.livePollTimer = setInterval(function () {
        if (!S.api || !S.api.user || !S.api.token || S.api.provider === 'local') return;
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          if (auth.syncStatus !== 'SYNCING') {
            auth.syncWithCloud(false);
          }
        }
      }, 3000);
    },

    triggerSync: async function (showToast) {
      return auth.syncWithCloud(showToast);
    },

    isPurging: false,
    isSyncing: false,
    syncQueued: false,

    syncWithCloud: async function (showToast) {
      if (auth.isPurging) return;
      if (!S.api || !S.api.user || !S.api.token) return;
      if (S.api.provider === 'local') return;

      if (auth.isSyncing) {
        auth.syncQueued = true;
        return;
      }
      auth.isSyncing = true;
      auth.syncStatus = 'SYNCING';
      auth.updateTopbarBadge();

      try {
        var remote = await S.api.syncDown();
        if (remote && remote.sessionExpired) {
          auth.syncStatus = 'EXPIRED';
          auth.updateTopbarBadge();
          if (showToast && S.ui) {
            S.ui.showToast('[SYSTEM LINK EXPIRED]', 'Your security token expired. Tap your hunter badge to re-enter passcode.', 'danger');
          }
          return;
        }

        // ======================================================================
        // PURGE / RESET DETECTION:
        // A cross-device purge is ONLY acknowledged if:
        // 1. Both remotePurgeEpoch and localPurgeEpoch are > 0 and remotePurgeEpoch > localPurgeEpoch
        // 2. The remote profile is actually at baseline (Level 1, 0 XP)
        // 3. This device holds pre-purge progress from an older session (Level > 1, XP > 0, etc.)
        // Never trigger a purge on fresh devices (localPurgeEpoch === 0) or simply because
        // remote profile hasn't received local's newly earned XP yet!
        // ======================================================================
        var lp = S.state.profile || {};
        var remotePurgeEpoch = 0;
        if (remote && remote.inventory && remote.inventory.shadows && remote.inventory.shadows._purge_epoch) {
          remotePurgeEpoch = Number(remote.inventory.shadows._purge_epoch) || 0;
        }
        var localPurgeEpoch = Number(S.state.purgeEpoch || 0);

        var isRemotePurged = false;
        if (remotePurgeEpoch > 0 && localPurgeEpoch > 0 && remotePurgeEpoch > localPurgeEpoch) {
          var rpLvl = Number(remote.profile && remote.profile.level) || 1;
          var rpXp = Number(remote.profile && (remote.profile.current_xp != null ? remote.profile.current_xp : 0));
          var isRemoteAtBaseline = (rpLvl === 1 && rpXp === 0);

          var lpLvl = Number(lp.level) || 1;
          var lpXp = Number(lp.currentXp) || 0;
          var lpGold = Number(lp.gold) || 0;
          var lpStr = (lp.stats && Number(lp.stats.STR)) || 10;
          var localHasOldData = (lpLvl > 1 || lpXp > 0 || lpGold > 100 || lpStr > 10);

          if (isRemoteAtBaseline && localHasOldData) {
            isRemotePurged = true;
            console.log('[SYSTEM SYNC] Legitimate remote purge detected (epoch: ' + remotePurgeEpoch + '). Resetting local state to Level 1.');
          } else {
            // Cloud has an updated epoch but device was already at baseline or remote has progressed
            S.state.purgeEpoch = remotePurgeEpoch;
            needsSave = true;
          }
        } else if (remotePurgeEpoch > 0 && localPurgeEpoch === 0) {
          // Device did not have an epoch recorded yet; adopt cloud epoch marker cleanly without destructive reset
          S.state.purgeEpoch = remotePurgeEpoch;
          needsSave = true;
        }

        if (isRemotePurged) {
          console.log('[SYSTEM SYNC] Remote account purge detected. Resetting local state to Level 1.');
          var pName = (remote.profile && remote.profile.hunter_name) || (S.state.profile && S.state.profile.hunterName) || 'Hunter';
          var pEmail = (remote.profile && remote.profile.email) || (S.state.profile && S.state.profile.email) || '';
          var pMode = (remote.profile && remote.profile.penalty_mode) || 'OPTIONAL';
          var newEpoch = remotePurgeEpoch || Date.now();

          try {
            localStorage.removeItem('solo_quest_runs_v1');
            if (S.tracker) {
              S.tracker.history = [];
              S.tracker.activeRun = null;
            }
          } catch (e) {}

          S.state = (typeof S.defaultState === 'function') ? S.defaultState() : { profile: {}, quests: [], inventory: {} };
          S.state.purgeEpoch = newEpoch;
          S.state.deletedQuests = {};
          if (typeof S.awaken === 'function') {
            S.awaken(pName, pMode, true, pEmail);
          }
          S.state.purgeEpoch = newEpoch;
          if (typeof S.save === 'function') {
            S.save();
          }

          auth.syncStatus = 'SYNCED';
          auth.updateTopbarBadge();
          if (S.ui) {
            if (typeof S.ui.setView === 'function') {
              S.ui.setView('quests');
            }
            if (typeof S.ui.showToast === 'function') {
              S.ui.showToast('[SYSTEM MEMORY PURGED]', 'Account reset synchronized from cloud.', 'gold');
            }
            if (typeof S.ui.render === 'function') {
              S.ui.render();
            }
          }
          return;
        }

        // If local has a purgeEpoch and remote hasn't recorded it yet, adopt localPurgeEpoch
        if (localPurgeEpoch > remotePurgeEpoch) {
          needsPush = true;
          if (remote && remote.inventory && remote.inventory.shadows) {
            remote.inventory.shadows._purge_epoch = localPurgeEpoch;
          }
        }

        var needsPush = false;
        var needsSave = false;

        if (remote && remote.profile) {
          var rp = remote.profile;

          // 1. Level & XP (Non-destructive: highest progress always wins)
          var rLvl = Number(rp.level) || 1;
          var lLvl = Number(lp.level) || 1;
          var rXp = Number(rp.current_xp != null ? rp.current_xp : 0);
          var lXp = Number(lp.currentXp != null ? lp.currentXp : 0);

          if (rLvl > lLvl) {
            lp.level = rLvl;
            lp.currentXp = rXp;
            needsSave = true;
          } else if (lLvl > rLvl) {
            needsPush = true; // Local device reached higher level, push to cloud!
          } else {
            if (rXp > lXp) {
              lp.currentXp = rXp;
              needsSave = true;
            } else if (lXp > rXp) {
              needsPush = true;
            }
          }

          // 2. Unallocated AP
          var rAp = Number(rp.ap != null ? rp.ap : 0);
          var lAp = Number(lp.unallocatedAp != null ? lp.unallocatedAp : (lp.ap || 0));
          if (rLvl > lLvl) {
            lp.unallocatedAp = rAp;
            lp.ap = rAp;
            needsSave = true;
          } else if (lLvl > rLvl) {
            needsPush = true;
          } else if (rAp !== lAp) {
            lp.unallocatedAp = Math.max(lAp, rAp);
            lp.ap = lp.unallocatedAp;
            needsSave = true;
          }

          // 3. Stats (STR, AGI, VIT, INT, PER)
          if (!lp.stats) lp.stats = { STR: 10, AGI: 10, VIT: 10, INT: 10, PER: 10 };
          ['STR', 'AGI', 'VIT', 'INT', 'PER'].forEach(function (stat) {
            var rVal = Number(rp[stat.toLowerCase()] || 10);
            var lVal = Number(lp.stats[stat] || 10);
            if (rVal > lVal) {
              lp.stats[stat] = rVal;
              needsSave = true;
            } else if (lVal > rVal) {
              needsPush = true;
            }
          });

          // 4. Gold & Essence
          var rGold = Number(rp.gold || 0);
          var lGold = Number(lp.gold || 0);
          if (rGold > lGold) { lp.gold = rGold; needsSave = true; }
          else if (lGold > rGold) { needsPush = true; }

          var rEssence = Number(rp.essence || 0);
          var lEssence = Number(lp.essenceStones || 0);
          if (rEssence > lEssence) {
            lp.essenceStones = rEssence;
            lp.essence = rEssence;
            needsSave = true;
          } else if (lEssence > rEssence) {
            needsPush = true;
          }

          // 5. Streaks
          var rStreak = Number(rp.streak_days || 0);
          var lStreak = Number(lp.streakDays || 0);
          if (rStreak > lStreak) { lp.streakDays = rStreak; needsSave = true; }
          else if (lStreak > rStreak) { needsPush = true; }

          var rMaxStreak = Number(rp.max_streak || 0);
          var lMaxStreak = Number(lp.maxStreak || 0);
          if (rMaxStreak > lMaxStreak) { lp.maxStreak = rMaxStreak; needsSave = true; }
          else if (lMaxStreak > rMaxStreak) { needsPush = true; }

          if (rp.rank_tier_index !== undefined && rp.rank_tier_index > (lp.rankTierIndex || 0)) {
            lp.rankTierIndex = rp.rank_tier_index;
            needsSave = true;
          }

          // 6. Quests Smart Merge (Completed status and highest progress are preserved)
          if (Array.isArray(remote.quests) && remote.quests.length) {
            var localQuests = S.state.quests || [];
            var remoteById = {};
            var remoteByPreset = {};
            var remoteByTitle = {};

            remote.quests.forEach(function (rq) {
              if (rq.id) remoteById[rq.id] = rq;
              var isComp = !!(rq.is_completed === true || rq.is_completed === 1 || rq.is_completed === 'true' || rq.isCompleted === true || rq.isCompleted === 1);
              var prog = parseFloat(rq.current_progress != null ? rq.current_progress : (rq.currentProgress != null ? rq.currentProgress : 0));
              var target = parseFloat(rq.target_progress != null ? rq.target_progress : (rq.targetProgress != null ? rq.targetProgress : 1));
              if (target > 0 && prog >= target) isComp = true;

              if (rq.preset) {
                var prevP = remoteByPreset[rq.preset];
                var prevComp = prevP ? !!(prevP.is_completed === true || prevP.is_completed === 1 || prevP.is_completed === 'true' || prevP.isCompleted) : false;
                if (!prevP || (isComp && !prevComp) || (prog > parseFloat(prevP.current_progress || 0))) {
                  remoteByPreset[rq.preset] = rq;
                }
              }
              if (rq.title) {
                var tKey = rq.title.trim().toLowerCase();
                var prevT = remoteByTitle[tKey];
                var prevCompT = prevT ? !!(prevT.is_completed === true || prevT.is_completed === 1 || prevT.is_completed === 'true' || prevT.isCompleted) : false;
                if (!prevT || (isComp && !prevCompT) || (prog > parseFloat(prevT.current_progress || 0))) {
                  remoteByTitle[tKey] = rq;
                }
              }
            });

            // Update existing local quests from remote with multi-device resolution
            localQuests.forEach(function (lq) {
              var candByPreset = lq.preset ? remoteByPreset[lq.preset] : null;
              var candByTitle = lq.title ? remoteByTitle[lq.title.trim().toLowerCase()] : null;
              var candById = remoteById[lq.id];

              var candidates = [candByPreset, candByTitle, candById].filter(Boolean);
              var rq = null;
              if (candidates.length) {
                rq = candidates[0];
                for (var ci = 1; ci < candidates.length; ci++) {
                  var c = candidates[ci];
                  var cComp = !!(c.is_completed === true || c.is_completed === 1 || c.is_completed === 'true' || c.isCompleted || (c.target_progress > 0 && c.current_progress >= c.target_progress));
                  var rqComp = !!(rq.is_completed === true || rq.is_completed === 1 || rq.is_completed === 'true' || rq.isCompleted || (rq.target_progress > 0 && rq.current_progress >= rq.target_progress));
                  if (cComp && !rqComp) {
                    rq = c;
                  } else if (!rqComp && (parseFloat(c.current_progress || 0) > parseFloat(rq.current_progress || 0))) {
                    rq = c;
                  }
                }
              }

              if (rq) {
                var rComp = !!(rq.is_completed === true || rq.is_completed === 1 || rq.is_completed === 'true' || rq.isCompleted === true || rq.isCompleted === 1);
                var rProg = parseFloat(rq.current_progress != null ? rq.current_progress : (rq.currentProgress != null ? rq.currentProgress : 0));
                var rTarget = parseFloat(rq.target_progress != null ? rq.target_progress : (rq.targetProgress != null ? rq.targetProgress : lq.targetProgress));
                if (rTarget > 0 && rProg >= rTarget) rComp = true;

                // Unify quest IDs so both devices operate on the identical database record
                if (rq.id && lq.id !== rq.id) {
                  lq.id = rq.id;
                  needsSave = true;
                }

                if (rComp) {
                  if (!lq.isCompleted || lq.currentProgress < lq.targetProgress) {
                    lq.isCompleted = true;
                    lq.currentProgress = lq.targetProgress;
                    needsSave = true;
                  }
                } else if (lq.isCompleted && !rComp) {
                  needsPush = true; // Completed locally on this device, push to cloud!
                } else if (rProg > lq.currentProgress) {
                  lq.currentProgress = rProg;
                  if (lq.currentProgress >= lq.targetProgress) lq.isCompleted = true;
                  needsSave = true;
                } else if (lq.currentProgress > rProg) {
                  needsPush = true;
                }
              } else {
                needsPush = true;
              }
            });

            // If remote has quests not yet in local state, add them safely (unless tombstoned/deleted)
            var deletedQuests = S.state.deletedQuests || {};
            remote.quests.forEach(function (rq) {
              var isTombstoned = !!(
                deletedQuests[rq.id] ||
                (rq.preset && deletedQuests['preset_' + rq.preset]) ||
                (rq.title && deletedQuests['title_' + rq.title.trim().toLowerCase()])
              );

              if (isTombstoned) {
                // Delete from Supabase as well so it doesn't linger
                if (S.api && typeof S.api.deleteQuest === 'function') {
                  S.api.deleteQuest(rq.id);
                }
                return; // DO NOT restore into localQuests!
              }

              var existsLocally = localQuests.some(function (lq) {
                return lq.id === rq.id ||
                       (rq.preset && lq.preset === rq.preset) ||
                       (rq.title && lq.title && lq.title.trim().toLowerCase() === rq.title.trim().toLowerCase());
              });

              if (!existsLocally) {
                var cat = rq.category || 'HABIT';
                var presetDef = (rq.preset && S.PRESETS && S.PRESETS[rq.preset]) ? S.PRESETS[rq.preset] : null;
                var diff = rq.difficulty || (presetDef ? presetDef.difficulty : 'E');
                if (!S.DIFF || !S.DIFF[diff]) diff = 'E';
                var primStat = rq.primaryStat || rq.primary_stat || (presetDef ? presetDef.primaryStat : (S.CATS && S.CATS[cat] ? S.CATS[cat].stat : 'STR'));
                var unit = rq.unit || (presetDef ? presetDef.unit : 'REPS');
                var mode = rq.mode || (presetDef ? presetDef.mode : (unit === 'CHECK' ? 'CHECK' : (unit === 'MINS' ? 'DURATION' : 'COUNTER')));

                localQuests.push({
                  id: rq.id,
                  title: rq.title,
                  category: cat,
                  difficulty: diff,
                  primaryStat: primStat,
                  unit: unit,
                  mode: mode,
                  targetProgress: parseFloat(rq.target_progress || rq.targetProgress || (presetDef ? presetDef.target : 1)),
                  currentProgress: parseFloat(rq.current_progress || rq.currentProgress || 0),
                  isCompleted: !!(rq.is_completed || rq.isCompleted),
                  preset: rq.preset || null,
                  isPenaltyQuest: !!(rq.is_penalty_quest || rq.isPenaltyQuest),
                  isExam: !!(rq.is_exam || rq.isExam),
                  isBonus: !!(rq.is_bonus || rq.isBonus),
                  isRedemption: !!(rq.is_redemption || rq.isRedemption),
                  isMandatory: rq.is_mandatory !== undefined ? !!rq.is_mandatory : (presetDef && presetDef.isMandatory !== undefined ? !!presetDef.isMandatory : true),
                  recurring: rq.recurring !== false && !rq.is_penalty_quest && !rq.isPenaltyQuest && !rq.is_exam && !rq.isExam && !rq.is_bonus && !rq.isBonus && !rq.is_redemption && !rq.isRedemption,
                  createdDate: rq.created_date || rq.createdDate || S.today()
                });
                needsSave = true;
              }
            });
          } else if (S.state.quests && S.state.quests.length) {
            needsPush = true;
          }

          // 7. Inventory
          if (remote.inventory) {
            var rInv = remote.inventory;
            var lInv = S.state.inventory || {};
            if (rInv.boxes && typeof rInv.boxes === 'object') {
              lInv.boxes = lInv.boxes || { RANDOM: 0, BLESSED: 0, CURSED: 0 };
              ['RANDOM', 'BLESSED', 'CURSED'].forEach(function (bKey) {
                var rb = Number(rInv.boxes[bKey] || 0);
                var lb = Number(lInv.boxes[bKey] || 0);
                if (rb > lb) { lInv.boxes[bKey] = rb; needsSave = true; }
                else if (lb > rb) { needsPush = true; }
              });
            }

            // 8. Weekly Plan Synchronization
            if (rInv.shadows && rInv.shadows._weekly_plan) {
              var rPlan = rInv.shadows._weekly_plan;
              var lPlan = S.state.weeklyPlan;
              if (rPlan && rPlan.days) {
                var rTime = Number(rPlan.updatedAt || 0);
                var lTime = Number((lPlan && lPlan.updatedAt) || 0);
                var remoteIsNewer = rTime > lTime || (!lPlan && rPlan) || (lPlan && lPlan.activePreset === 'canonical' && rPlan.activePreset !== 'canonical');
                if (remoteIsNewer) {
                  if (JSON.stringify(lPlan) !== JSON.stringify(rPlan)) {
                    S.state.weeklyPlan = rPlan;
                    if (typeof S.syncTodayQuestsFromPlan === 'function') {
                      S.syncTodayQuestsFromPlan(false);
                    }
                    needsSave = true;
                  }
                } else if (lTime > rTime) {
                  needsPush = true;
                }
              }
            } else if (S.state.weeklyPlan) {
              needsPush = true;
            }
          }

        } else {
          // Remote is empty, push local state to initialize remote account
          needsPush = true;
        }

        if (needsSave) {
          S.save();
        }
        if (S.ui) S.ui.render();

        if (needsPush) {
          var runs = S.tracker ? S.tracker.history : [];
          await S.api.syncUp(S.state, runs);
        }

        auth.syncStatus = 'SYNCED';
        auth.lastSyncTime = new Date();
        auth.updateTopbarBadge();
        auth.refreshLeaderboards();

        if (showToast && S.ui) {
          S.ui.showToast('[SYSTEM SYNCHRONIZED]', 'Data synchronized across devices.', 'cyan');
        }

      } catch (err) {
        console.warn('[CLOUD SYNC ERROR]', err);
        auth.syncStatus = 'ERROR';
        auth.updateTopbarBadge();
        if (showToast && S.ui) {
          S.ui.showToast('[SYNC ANOMALY]', err.message, 'danger');
        }
      } finally {
        auth.isSyncing = false;
        if (auth.syncQueued) {
          auth.syncQueued = false;
          setTimeout(function () {
            auth.syncWithCloud(false);
          }, 60);
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

        // Perform smart bidirectional synchronization
        await auth.syncWithCloud(true);

        if (S.api && S.api.initRealtime && user && user.id) {
          S.api.initRealtime(user.id, function () {
            auth.syncWithCloud(false);
          });
        }

        if (S.api && S.api.user) {
          try { localStorage.setItem('solo_quest_auth_user_v1', JSON.stringify(S.api.user)); } catch (e) {}
        }

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

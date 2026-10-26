/* ==============================================================================
   THE SYSTEM // PROJECT: ARISE — Universal Database & Authentication Adapter
   Supports direct Supabase PostgreSQL Cloud API, Local/Self-Hosted Node Server,
   and offline-first client persistence.
   ============================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var CONFIG_KEY = 'solo_quest_cloud_config_v1';
  var TOKEN_KEY = 'solo_quest_auth_token_v1';
  var USER_KEY = 'solo_quest_auth_user_v1';

  var api = S.api = {
    // Current database provider: 'supabase' | 'custom' | 'local'
    provider: 'local',
    supabaseUrl: '',
    supabaseAnonKey: '',
    customUrl: 'http://localhost:3000',
    token: null,
    user: null,
    isConnected: false,
    lastPingMs: null,

    init: function () {
      api.token = localStorage.getItem(TOKEN_KEY) || null;
      try {
        var rawUser = localStorage.getItem(USER_KEY);
        if (rawUser) api.user = JSON.parse(rawUser);
      } catch (e) {
        api.user = null;
      }

      try {
        var rawCfg = localStorage.getItem(CONFIG_KEY);
        if (rawCfg) {
          var cfg = JSON.parse(rawCfg);
          api.provider = cfg.provider || 'local';
          api.supabaseUrl = (cfg.supabaseUrl || '').replace(/\/+$/, '');
          api.supabaseAnonKey = cfg.supabaseAnonKey || '';
          api.customUrl = (cfg.customUrl || 'http://localhost:3000').replace(/\/+$/, '');
        }
      } catch (e) {}

      // Auto-test connection on boot
      if (api.provider !== 'local') {
        api.testConnection().catch(function () {});
      }
    },

    saveConfig: function (cfg) {
      api.provider = cfg.provider || api.provider;
      api.supabaseUrl = (cfg.supabaseUrl || '').replace(/\/+$/, '');
      api.supabaseAnonKey = cfg.supabaseAnonKey || '';
      api.customUrl = (cfg.customUrl || 'http://localhost:3000').replace(/\/+$/, '');

      localStorage.setItem(CONFIG_KEY, JSON.stringify({
        provider: api.provider,
        supabaseUrl: api.supabaseUrl,
        supabaseAnonKey: api.supabaseAnonKey,
        customUrl: api.customUrl
      }));

      return api.testConnection();
    },

    setSession: function (token, user) {
      api.token = token;
      api.user = user;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);

      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);

      S.emit('authChange', { user: user, token: token });
    },

    clearSession: function () {
      api.setSession(null, null);
    },

    // ==========================================================================
    // Database Health Check / Connection Test
    // ==========================================================================
    testConnection: async function (overrideCfg) {
      var prov = overrideCfg ? overrideCfg.provider : api.provider;
      var t0 = Date.now();

      if (prov === 'supabase') {
        var url = overrideCfg ? overrideCfg.supabaseUrl : api.supabaseUrl;
        var key = overrideCfg ? overrideCfg.supabaseAnonKey : api.supabaseAnonKey;
        if (!url || !key) {
          api.isConnected = false;
          throw new Error('Supabase Project URL and Anon API Key are required.');
        }

        try {
          var res = await fetch(url + '/rest/v1/hunter_profiles?select=count', {
            method: 'HEAD',
            headers: {
              'apikey': key,
              'Authorization': 'Bearer ' + key
            }
          });
          api.lastPingMs = Date.now() - t0;
          if (res.ok || res.status === 406 || res.status === 200 || res.status === 204) {
            api.isConnected = true;
            return { ok: true, pingMs: api.lastPingMs, provider: 'supabase' };
          }
          throw new Error('Supabase responded with status: ' + res.status);
        } catch (err) {
          api.isConnected = false;
          throw new Error('Unable to connect to Supabase: ' + err.message);
        }
      } else if (prov === 'custom') {
        var host = overrideCfg ? overrideCfg.customUrl : api.customUrl;
        try {
          var res2 = await fetch(host + '/api/health', { method: 'GET' });
          api.lastPingMs = Date.now() - t0;
          if (res2.ok) {
            var data = await res2.json();
            api.isConnected = true;
            return { ok: true, pingMs: api.lastPingMs, provider: 'custom', info: data };
          }
          throw new Error('Server responded with HTTP ' + res2.status);
        } catch (err2) {
          api.isConnected = false;
          throw new Error('Cannot connect to custom server at ' + host + ': ' + err2.message);
        }
      } else {
        api.isConnected = true;
        api.lastPingMs = 0;
        return { ok: true, pingMs: 0, provider: 'local' };
      }
    },

    // ==========================================================================
    // Authentication: Register (Hunter Awakening)
    // ==========================================================================
    register: async function (email, hunterName, password, mode) {
      if (api.provider === 'supabase') {
        if (!api.supabaseUrl || !api.supabaseAnonKey) {
          throw new Error('Supabase database configuration missing.');
        }

        var res = await fetch(api.supabaseUrl + '/auth/v1/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api.supabaseAnonKey
          },
          body: JSON.stringify({
            email: email,
            password: password,
            data: {
              hunter_name: hunterName,
              penalty_mode: mode
            }
          })
        });

        var json = await res.json();
        if (!res.ok) throw new Error(json.msg || json.error_description || json.error || 'Registration failed');

        var token = json.access_token || (json.session ? json.session.access_token : null);
        var user = {
          id: json.user ? json.user.id : json.id,
          email: email,
          hunterName: hunterName
        };

        api.setSession(token, user);
        return { user: user, token: token };

      } else if (api.provider === 'custom') {
        var res2 = await fetch(api.customUrl + '/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, hunterName: hunterName, password: password, mode: mode })
        });
        var json2 = await res2.json();
        if (!res2.ok) throw new Error(json2.error || 'Server registration failed');

        api.setSession(json2.token, json2.user);
        return json2;

      } else {
        // Local Account Simulation
        var localId = 'local_' + Date.now();
        var localUser = { id: localId, email: email, hunterName: hunterName };
        api.setSession('local_token_' + Date.now(), localUser);
        return { user: localUser, token: 'local_token' };
      }
    },

    // ==========================================================================
    // Authentication: Login (System Link)
    // ==========================================================================
    login: async function (emailOrName, password) {
      if (api.provider === 'supabase') {
        if (!api.supabaseUrl || !api.supabaseAnonKey) {
          throw new Error('Supabase database configuration missing.');
        }

        // Supabase standard signin requires email
        var res = await fetch(api.supabaseUrl + '/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': api.supabaseAnonKey
          },
          body: JSON.stringify({
            email: emailOrName,
            password: password
          })
        });

        var json = await res.json();
        if (!res.ok) throw new Error(json.error_description || json.msg || 'Authentication failed. Check credentials.');

        var token = json.access_token;
        var meta = json.user.user_metadata || {};
        var hunterName = meta.hunter_name || json.user.email.split('@')[0];

        var user = {
          id: json.user.id,
          email: json.user.email,
          hunterName: hunterName
        };

        api.setSession(token, user);
        return { user: user, token: token };

      } else if (api.provider === 'custom') {
        var res2 = await fetch(api.customUrl + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrName: emailOrName, password: password })
        });
        var json2 = await res2.json();
        if (!res2.ok) throw new Error(json2.error || 'Server login failed.');

        api.setSession(json2.token, json2.user);
        return json2;

      } else {
        // Local mode fallback
        var storedUser = api.user || { id: 'local_user', email: emailOrName, hunterName: emailOrName };
        api.setSession('local_token', storedUser);
        return { user: storedUser, token: 'local_token' };
      }
    },

    logout: function () {
      if (api.provider === 'supabase' && api.token && api.supabaseUrl && api.supabaseAnonKey) {
        fetch(api.supabaseUrl + '/auth/v1/logout', {
          method: 'POST',
          headers: {
            'apikey': api.supabaseAnonKey,
            'Authorization': 'Bearer ' + api.token
          }
        }).catch(function () {});
      }
      api.clearSession();
    },

    // ==========================================================================
    // Real People Global Leaderboards (Database Query)
    // ==========================================================================
    fetchLeaderboard: async function (view, targetTierIndex) {
      view = (view || 'VANGUARD').toUpperCase();

      if (api.provider === 'supabase' && api.supabaseUrl && api.supabaseAnonKey) {
        var orderParam = 'hrs_score.desc';
        if (view === 'HALL') {
          orderParam = 'combat_power.desc,level.desc';
        }

        var filterParam = '';
        if (view === 'DIVISION' && targetTierIndex !== undefined && targetTierIndex !== null) {
          filterParam = '&rank_tier_index=eq.' + targetTierIndex;
        }

        var endpoint = api.supabaseUrl + '/rest/v1/hunter_profiles?select=id,hunter_name,level,rank_code,rank_tier_index,streak_days,hrs_score,combat_power,total_focus_minutes,total_km_run&order=' + orderParam + filterParam + '&limit=50';

        var res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': api.supabaseAnonKey,
            'Authorization': 'Bearer ' + (api.token || api.supabaseAnonKey)
          }
        });

        if (!res.ok) {
          throw new Error('Failed to query Supabase leaderboard (HTTP ' + res.status + ')');
        }

        var rows = await res.json();
        var currentUserId = api.user ? api.user.id : null;

        return rows.map(function (r, idx) {
          var isYou = currentUserId && (r.id === currentUserId || r.hunter_name.toLowerCase() === (api.user.hunterName || '').toLowerCase());
          return {
            pos: idx + 1,
            id: r.id,
            name: r.hunter_name.toUpperCase(),
            tier: r.rank_code || 'E-IV',
            tierIndex: r.rank_tier_index || 0,
            level: r.level || 1,
            streak: r.streak_days || 0,
            score: view === 'HALL' ? (r.combat_power || 120) : (r.hrs_score || 0),
            combatPower: r.combat_power || 120,
            totalKmRun: r.total_km_run || 0,
            focusMins: r.total_focus_minutes || 0,
            you: isYou
          };
        });

      } else if (api.provider === 'custom' && api.customUrl) {
        var query = '?view=' + view + (targetTierIndex !== undefined ? '&tier=' + targetTierIndex : '');
        var res2 = await fetch(api.customUrl + '/api/leaderboard' + query, { method: 'GET' });
        if (!res2.ok) throw new Error('Custom server leaderboard query failed');

        var json = await res2.json();
        var curName = api.user ? (api.user.hunterName || '').toUpperCase() : '';

        return (json.leaderboard || []).map(function (r) {
          r.you = curName && r.name.toUpperCase() === curName;
          return r;
        });

      } else {
        // Offline / Local fallback: Calculate from local state
        return null;
      }
    },

    // ==========================================================================
    // Cloud Synchronization: Sync Up (Save Points, Stats, Quests, Runs, Vault)
    // ==========================================================================
    syncUp: async function (state, trackerHistory) {
      if (!api.user || !api.token) return { success: false, reason: 'unauthenticated' };

      var p = state.profile;
      var profilePayload = {
        hunterName: p.hunterName,
        level: p.level,
        currentXp: p.currentXp,
        ap: p.ap,
        str: p.str,
        agi: p.agi,
        vit: p.vit,
        int: p.int,
        per: p.per,
        gold: p.gold,
        essence: p.essence,
        rankTierIndex: p.rankTierIndex,
        rankCode: S.rank().code,
        streakDays: p.streakDays,
        maxStreak: p.maxStreak,
        hrsScore: S.seasonHrs().total,
        combatPower: S.combatPower(),
        totalFocusMinutes: p.totalFocusMinutes || 0,
        totalKmRun: p.totalKmRun || 0,
        penaltyMode: p.penaltyMode,
        inPenaltyZone: p.inPenaltyZone,
        activeTitle: p.activeTitle || '',
        activeSkinId: p.activeSkinId || 'default',
        activeBorderId: p.activeBorderId || '',
        activeShadowId: p.activeShadowId || '',
        equippedRelicIds: p.equippedRelicIds || []
      };

      if (api.provider === 'supabase') {
        var headers = {
          'Content-Type': 'application/json',
          'apikey': api.supabaseAnonKey,
          'Authorization': 'Bearer ' + api.token,
          'Prefer': 'resolution=merge-duplicates'
        };

        // 1. Upsert Profile
        var dbProfile = {
          id: api.user.id,
          hunter_name: p.hunterName,
          email: api.user.email,
          level: p.level,
          current_xp: p.currentXp,
          ap: p.ap,
          str: p.str,
          agi: p.agi,
          vit: p.vit,
          int: p.int,
          per: p.per,
          gold: p.gold,
          essence: p.essence,
          rank_tier_index: p.rankTierIndex,
          rank_code: S.rank().code,
          streak_days: p.streakDays,
          max_streak: p.maxStreak,
          hrs_score: S.seasonHrs().total,
          combat_power: S.combatPower(),
          total_focus_minutes: p.totalFocusMinutes || 0,
          total_km_run: p.totalKmRun || 0,
          penalty_mode: p.penaltyMode,
          in_penalty_zone: p.inPenaltyZone,
          active_title: p.activeTitle || '',
          active_skin_id: p.activeSkinId || 'default',
          active_border_id: p.activeBorderId || '',
          active_shadow_id: p.activeShadowId || '',
          equipped_relic_ids: p.equippedRelicIds || [],
          updated_at: new Date().toISOString()
        };

        var pReq = fetch(api.supabaseUrl + '/rest/v1/hunter_profiles', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(dbProfile)
        });

        // 2. Upsert Inventory
        var dbInv = {
          user_id: api.user.id,
          owned_items: state.inventory.owned,
          boxes: state.inventory.boxes,
          unlocked_skins: state.unlockedSkins,
          unlocked_titles: state.unlockedTitles,
          unlocked_borders: state.unlockedBorders,
          shadows: state.inventory.shadows,
          updated_at: new Date().toISOString()
        };

        var iReq = fetch(api.supabaseUrl + '/rest/v1/hunter_inventory', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(dbInv)
        });

        // 3. Upsert Quests
        var dbQuests = (state.quests || []).map(function (q) {
          return {
            id: q.id,
            user_id: api.user.id,
            title: q.title,
            category: q.category,
            unit: q.unit,
            target_progress: q.targetProgress,
            current_progress: q.currentProgress,
            is_completed: q.isCompleted,
            preset: q.preset || null,
            is_penalty_quest: !!q.isPenaltyQuest,
            is_exam: !!q.isExam,
            is_bonus: !!q.isBonus,
            created_date: q.createdDate || S.today(),
            updated_at: new Date().toISOString()
          };
        });

        var qReq = dbQuests.length ? fetch(api.supabaseUrl + '/rest/v1/hunter_quests', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(dbQuests)
        }) : Promise.resolve();

        await Promise.all([pReq, iReq, qReq]);
        return { success: true, timestamp: new Date().toISOString() };

      } else if (api.provider === 'custom') {
        var res = await fetch(api.customUrl + '/api/sync/up', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + api.token
          },
          body: JSON.stringify({
            profile: profilePayload,
            quests: state.quests,
            runs: trackerHistory || [],
            inventory: {
              owned: state.inventory.owned,
              boxes: state.inventory.boxes,
              unlockedSkins: state.unlockedSkins,
              unlockedTitles: state.unlockedTitles,
              unlockedBorders: state.unlockedBorders,
              shadows: state.inventory.shadows
            },
            log: state.log
          })
        });

        if (!res.ok) throw new Error('Cloud sync failed with status ' + res.status);
        return await res.json();

      } else {
        return { success: true, offline: true };
      }
    },

    // ==========================================================================
    // Cloud Synchronization: Sync Down (Hydrate State from Database)
    // ==========================================================================
    syncDown: async function () {
      if (!api.user || !api.token) return null;

      if (api.provider === 'supabase') {
        var headers = {
          'apikey': api.supabaseAnonKey,
          'Authorization': 'Bearer ' + api.token
        };

        // 1. Fetch Profile
        var pRes = await fetch(api.supabaseUrl + '/rest/v1/hunter_profiles?id=eq.' + api.user.id, {
          method: 'GET',
          headers: headers
        });
        var pData = await pRes.json();
        var remoteProfile = pData && pData.length ? pData[0] : null;

        // 2. Fetch Quests
        var qRes = await fetch(api.supabaseUrl + '/rest/v1/hunter_quests?user_id=eq.' + api.user.id, {
          method: 'GET',
          headers: headers
        });
        var remoteQuests = await qRes.json();

        // 3. Fetch Inventory
        var iRes = await fetch(api.supabaseUrl + '/rest/v1/hunter_inventory?user_id=eq.' + api.user.id, {
          method: 'GET',
          headers: headers
        });
        var iData = await iRes.json();
        var remoteInv = iData && iData.length ? iData[0] : null;

        return {
          profile: remoteProfile,
          quests: remoteQuests,
          inventory: remoteInv
        };

      } else if (api.provider === 'custom') {
        var res = await fetch(api.customUrl + '/api/sync/down', {
          method: 'GET',
          headers: { 'Authorization': 'Bearer ' + api.token }
        });
        if (!res.ok) throw new Error('Failed to fetch data from cloud server');
        var json = await res.json();
        return json.data;
      }

      return null;
    }
  };

  api.init();
})(window.SYS);

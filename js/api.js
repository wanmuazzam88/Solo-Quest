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
  var REGISTRY_KEY = 'solo_quest_hunter_registry_v1';
  var LAST_NAME_KEY = 'solo_quest_last_signup_name';

  function sanitizeHunterName(name, emailToExclude) {
    if (!name || typeof name !== 'string') return '';
    var trimmed = name.trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return '';
    var up = trimmed.toUpperCase();
    if (up === 'PLAYER' || up === 'HUNTER' || up === 'UNKNOWN') return '';
    if (/^HUNTER_[0-9A-F]{4,}$/i.test(trimmed)) return '';
    if (emailToExclude && typeof emailToExclude === 'string') {
      var prefix = emailToExclude.trim().split('@')[0];
      if (prefix && trimmed.toLowerCase() === prefix.toLowerCase()) {
        // Only treat as email prefix if we aren't explicitly registering
      }
    }
    return trimmed.slice(0, 24);
  }

  function cleanUrl(raw) {
    if (!raw) return '';
    var u = String(raw).trim();
    if (!u) return '';
    u = u.replace(/^['"]|['"]$/g, '');

    // Check if user accidentally pasted postgresql:// string
    if (/^postgres(ql)?:\/\//i.test(u)) {
      var m = u.match(/@db\.([a-z0-9_-]+)\.supabase\.co/i);
      if (m && m[1]) {
        u = 'https://' + m[1] + '.supabase.co';
      } else {
        throw new Error('You entered a PostgreSQL connection string. Please copy the Project URL (https://xyz.supabase.co) from Supabase Dashboard -> Project Settings -> API.');
      }
    }

    // If user entered only the project reference id (e.g. "aivdoxwzkpyvbnqm")
    if (!u.includes('.') && /^[a-z0-9_-]{10,50}$/i.test(u)) {
      u = 'https://' + u + '.supabase.co';
    }

    if (!/^https?:\/\//i.test(u)) {
      u = 'https://' + u;
    }

    u = u.replace(/\/+$/, '');
    u = u.replace(/\/(rest|auth)\/v1\/?$/i, '');
    return u;
  }

  function cleanKey(raw) {
    if (!raw) return '';
    var k = String(raw).trim();
    k = k.replace(/^['"]|['"]$/g, '');
    k = k.replace(/^Bearer\s+/i, '');
    k = k.replace(/\s+/g, '');
    return k;
  }

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
    isManagedCloud: false,
    managedPlatform: null,

    rememberHunterName: function (email, name, isExplicit) {
      var clean = sanitizeHunterName(name);
      if (!clean) return;

      try {
        var map = {};
        try {
          var raw = localStorage.getItem(REGISTRY_KEY);
          if (raw) map = JSON.parse(raw);
        } catch (e) {
          map = {};
        }

        if (email && typeof email === 'string') {
          var em = email.trim().toLowerCase();
          if (em) {
            var userPart = em.split('@')[0];
            var existing = localStorage.getItem('solo_quest_name_' + em) || map['exact:' + em] || map[em];
            // Never overwrite a real custom hunter name with a generic email-prefix fallback
            if (!isExplicit && existing && sanitizeHunterName(existing) && userPart && clean.toLowerCase() === userPart.toLowerCase() && existing.toLowerCase() !== userPart.toLowerCase()) {
              return;
            }
            map[em] = clean;
            map['exact:' + em] = clean;
            map['name:' + clean.toLowerCase()] = em;
            localStorage.setItem('solo_quest_name_' + em, clean);
            if (userPart) map[userPart] = clean;
          }
        }

        localStorage.setItem(LAST_NAME_KEY, clean);
        localStorage.setItem('solo_quest_remembered_name', clean);
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(map));
      } catch (e) {
        console.warn('[REGISTRY NOTICE]', e);
      }
    },

    getRememberedHunterName: function (identifier) {
      try {
        var raw = localStorage.getItem(REGISTRY_KEY);
        var map = raw ? JSON.parse(raw) : {};

        if (identifier && typeof identifier === 'string') {
          var key = identifier.trim().toLowerCase();
          var userPart = key.split('@')[0];

          var indiv = localStorage.getItem('solo_quest_name_' + key);
          if (indiv && sanitizeHunterName(indiv)) {
            if (!key.includes('@') || indiv.toLowerCase() !== userPart.toLowerCase()) {
              return sanitizeHunterName(indiv);
            }
          }

          if (map['exact:' + key] && sanitizeHunterName(map['exact:' + key])) {
            return sanitizeHunterName(map['exact:' + key]);
          }
          if (map[key] && sanitizeHunterName(map[key])) {
            return sanitizeHunterName(map[key]);
          }
          if (userPart && map[userPart] && sanitizeHunterName(map[userPart])) {
            return sanitizeHunterName(map[userPart]);
          }
          if (indiv && sanitizeHunterName(indiv)) {
            return sanitizeHunterName(indiv);
          }
        }

        var last = localStorage.getItem(LAST_NAME_KEY) || localStorage.getItem('solo_quest_remembered_name');
        if (last && sanitizeHunterName(last)) return sanitizeHunterName(last);

        if (S.state && S.state.profile && S.state.profile.hunterName) {
          var fromState = sanitizeHunterName(S.state.profile.hunterName);
          if (fromState) return fromState;
        }
      } catch (e) {}

      return null;
    },

    getRememberedEmailByHunterName: function (hunterName) {
      try {
        if (!hunterName || typeof hunterName !== 'string') return null;
        var clean = hunterName.trim().toLowerCase();
        var raw = localStorage.getItem(REGISTRY_KEY);
        if (!raw) return null;
        var map = JSON.parse(raw);
        if (map['name:' + clean]) return map['name:' + clean];
        for (var k in map) {
          if (Object.prototype.hasOwnProperty.call(map, k) && k.includes('@') && !k.startsWith('exact:') && !k.startsWith('name:')) {
            if (String(map[k]).toLowerCase() === clean) return k;
          }
        }
      } catch (e) {}
      return null;
    },

    init: function () {
      api.token = localStorage.getItem(TOKEN_KEY) || null;
      try {
        var rawUser = localStorage.getItem(USER_KEY);
        if (rawUser) {
          api.user = JSON.parse(rawUser);
          if (api.user && (!api.user.hunterName || api.user.hunterName.includes('@') || api.user.hunterName === 'Hunter')) {
            var remembered = api.getRememberedHunterName(api.user.email);
            if (remembered) {
              api.user.hunterName = remembered;
              localStorage.setItem(USER_KEY, JSON.stringify(api.user));
            }
          }
        }
      } catch (e) {
        api.user = null;
      }

      try {
        var rawCfg = localStorage.getItem(CONFIG_KEY);
        if (rawCfg) {
          var cfg = JSON.parse(rawCfg);
          api.provider = cfg.provider || 'local';
          api.supabaseUrl = cleanUrl(cfg.supabaseUrl);
          api.supabaseAnonKey = cleanKey(cfg.supabaseAnonKey);
          api.customUrl = cleanUrl(cfg.customUrl || 'http://localhost:3000');
          api.isManagedCloud = Boolean(cfg.isManagedCloud);
          api.managedPlatform = cfg.managedPlatform || null;
        }
      } catch (e) {}

      // Auto-detect Cloudflare Pages managed Supabase environment
      api.autoDetectCloudflare().then(function (detected) {
        if (!detected && api.provider !== 'local') {
          api.testConnection().catch(function () {});
        }
      });
    },

    autoDetectCloudflare: async function () {
      try {
        var res = await fetch('/api/config', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          var data = await res.json();
          if (data && data.configured && data.supabaseUrl && data.supabaseAnonKey) {
            api.isManagedCloud = true;
            api.managedPlatform = data.platform || 'Cloudflare Pages';
            api.provider = 'supabase';
            api.supabaseUrl = cleanUrl(data.supabaseUrl);
            api.supabaseAnonKey = cleanKey(data.supabaseAnonKey);

            try {
              localStorage.setItem(CONFIG_KEY, JSON.stringify({
                provider: 'supabase',
                supabaseUrl: api.supabaseUrl,
                supabaseAnonKey: api.supabaseAnonKey,
                isManagedCloud: true,
                managedPlatform: api.managedPlatform
              }));
            } catch (err) {}

            var ping = await api.testConnection();
            if (S.emit) {
              S.emit('cloudConfigDetected', {
                provider: 'supabase',
                managed: true,
                platform: api.managedPlatform,
                ping: ping
              });
            }
            if (S.auth && typeof S.auth.updateStatus === 'function') {
              S.auth.updateStatus();
            }
            return true;
          }
        }
      } catch (e) {
        // Fallback silently if offline or running in standalone static environment
      }
      return false;
    },

    saveConfig: function (cfg) {
      api.provider = cfg.provider || api.provider;
      api.supabaseUrl = cleanUrl(cfg.supabaseUrl || api.supabaseUrl);
      api.supabaseAnonKey = cleanKey(cfg.supabaseAnonKey || api.supabaseAnonKey);
      api.customUrl = cleanUrl(cfg.customUrl || api.customUrl);

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
        var rawUrl = overrideCfg ? overrideCfg.supabaseUrl : api.supabaseUrl;
        var rawKey = overrideCfg ? overrideCfg.supabaseAnonKey : api.supabaseAnonKey;
        var url, key;

        try {
          url = cleanUrl(rawUrl);
          key = cleanKey(rawKey);
        } catch (e) {
          api.isConnected = false;
          throw e;
        }

        if (!url || !key) {
          api.isConnected = false;
          throw new Error('Supabase Project URL and Anon API Key are required.');
        }

        // Validate key format if it's a JWT
        if (key.startsWith('eyJ')) {
          var parts = key.split('.');
          if (parts.length < 3) {
            api.isConnected = false;
            throw new Error('Anon Key is incomplete (only ' + parts.length + '/3 parts). On iPhone, tap the Copy button in Supabase rather than highlighting with your finger.');
          }
          if (key.length < 150) {
            api.isConnected = false;
            throw new Error('Anon Key is cut off (' + key.length + ' characters, should be ~200+). Please use the copy button in Supabase to copy the full key.');
          }
        }

        try {
          // Stage 1: Ping Supabase Auth health endpoint (/auth/v1/health)
          var pingRes = await fetch(url + '/auth/v1/health', {
            method: 'GET',
            headers: {
              'apikey': key,
              'Authorization': 'Bearer ' + key
            }
          });

          api.lastPingMs = Math.max(1, Date.now() - t0);

          if (!pingRes.ok) {
            if (pingRes.status === 401 || pingRes.status === 403) {
              api.isConnected = false;
              var errDetail = '';
              try {
                var errJson = await pingRes.json();
                if (errJson && (errJson.message || errJson.hint)) {
                  errDetail = ': ' + (errJson.message || errJson.hint);
                }
              } catch (e) {}
              var projectRef = url.match(/https:\/\/([^.]+)\./) ? url.match(/https:\/\/([^.]+)\./)[1] : '';
              throw new Error('Supabase Project URL reached, but Anon Key was rejected (HTTP ' + pingRes.status + errDetail + '). Ensure you copied the "anon" "public" key for project ' + projectRef + '.');
            }
            throw new Error('Supabase health check responded with HTTP ' + pingRes.status);
          }

          api.isConnected = true;

          // Stage 2: Check if hunter_profiles table exists
          var tableRes = await fetch(url + '/rest/v1/hunter_profiles?select=id&limit=1', {
            method: 'GET',
            headers: {
              'apikey': key,
              'Authorization': 'Bearer ' + key
            }
          });

          var schemaInstalled = true;
          var warningMsg = null;

          if (!tableRes.ok) {
            schemaInstalled = false;
            warningMsg = 'Supabase server connected (' + api.lastPingMs + ' ms), but the "hunter_profiles" table was not found. Please paste and run supabase/schema.sql in your Supabase SQL Editor.';
          }

          return {
            ok: true,
            pingMs: api.lastPingMs,
            latencyMs: api.lastPingMs,
            provider: 'supabase',
            schemaInstalled: schemaInstalled,
            warning: warningMsg
          };

        } catch (err) {
          api.isConnected = false;
          throw new Error('Unable to connect to Supabase: ' + err.message);
        }
      } else if (prov === 'custom') {
        var host = cleanUrl(overrideCfg ? overrideCfg.customUrl : api.customUrl);
        try {
          var res2 = await fetch(host + '/api/health', { method: 'GET' });
          api.lastPingMs = Math.max(1, Date.now() - t0);
          if (res2.ok) {
            var data = await res2.json();
            api.isConnected = true;
            return { ok: true, pingMs: api.lastPingMs, latencyMs: api.lastPingMs, provider: 'custom', info: data };
          }
          throw new Error('Server responded with HTTP ' + res2.status);
        } catch (err2) {
          api.isConnected = false;
          throw new Error('Cannot connect to custom server at ' + host + ': ' + err2.message);
        }
      } else {
        api.isConnected = true;
        api.lastPingMs = 0;
        return { ok: true, pingMs: 0, latencyMs: 0, provider: 'local' };
      }
    },

    // ==========================================================================
    // Authentication: Register (Hunter Awakening)
    // ==========================================================================
    register: async function (emailOrObj, arg2, arg3, arg4) {
      var email, password, hunterName, mode;

      if (emailOrObj && typeof emailOrObj === 'object') {
        email = (emailOrObj.email || '').trim().toLowerCase();
        password = emailOrObj.password || '';
        hunterName = (emailOrObj.hunterName || emailOrObj.name || '').trim();
        mode = emailOrObj.mode || 'OPTIONAL';
      } else {
        email = String(emailOrObj || '').trim().toLowerCase();
        // Support both (email, password, hunterName, mode) AND (email, hunterName, password, mode)
        if (typeof arg2 === 'string' && typeof arg3 === 'string') {
          password = arg2;
          hunterName = arg3;
        } else {
          hunterName = arg2 || 'Hunter';
          password = arg3 || '';
        }
        mode = arg4 || 'OPTIONAL';
      }

      if (!hunterName) hunterName = 'Hunter';
      if (!password || password.length < 6) {
        throw new Error('Passcode must be at least 6 characters.');
      }

      var cleanSignupName = sanitizeHunterName(hunterName) || hunterName;
      if (cleanSignupName && sanitizeHunterName(cleanSignupName)) {
        api.rememberHunterName(email, cleanSignupName, true);
      }
      if (S.state && S.state.profile) {
        S.state.profile.hunterName = cleanSignupName;
        if (email) S.state.profile.email = email;
      }

      if (api.provider === 'supabase') {
        if (!api.supabaseUrl || !api.supabaseAnonKey) {
          throw new Error('Supabase database configuration missing. Please enter Project URL and Anon Key in Database Setup.');
        }

        var url = cleanUrl(api.supabaseUrl);
        var key = cleanKey(api.supabaseAnonKey);

        var res = await fetch(url + '/auth/v1/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': key
          },
          body: JSON.stringify({
            email: email,
            password: password,
            data: {
              hunter_name: cleanSignupName,
              display_name: cleanSignupName,
              full_name: cleanSignupName,
              name: cleanSignupName,
              penalty_mode: mode
            }
          })
        });

        var json = await res.json();
        if (!res.ok) {
          var msg = json.msg || json.error_description || json.error || (json.error && json.error.message);
          if (json.code === 'user_already_exists' || (msg && msg.toLowerCase().includes('already registered'))) {
            throw new Error('This email is already registered. Please click SYSTEM LINK to log in with your password.');
          }
          throw new Error(msg || 'Registration failed');
        }

        var token = json.access_token || (json.session ? json.session.access_token : null);
        var user = {
          id: json.user ? json.user.id : json.id,
          email: email,
          hunterName: cleanSignupName,
          isNewRegistration: true
        };

        if (token) {
          // Immediately ensure hunter_profiles row has the user's chosen hunter_name
          try {
            await fetch(url + '/rest/v1/hunter_profiles', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': key,
                'Authorization': 'Bearer ' + token,
                'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify({
                id: user.id,
                hunter_name: cleanSignupName,
                email: email,
                penalty_mode: mode,
                updated_at: new Date().toISOString()
              })
            });
          } catch (e) {}

          api.setSession(token, user);
        } else {
          // Email confirmation is required by Supabase project settings
          return {
            user: user,
            token: null,
            emailConfirmationRequired: true,
            message: 'Awakening registered! Please check ' + email + ' to confirm, or turn off "Confirm email" in Supabase -> Authentication -> Providers -> Email.'
          };
        }

        return { user: user, token: token };

      } else if (api.provider === 'custom') {
        var host = cleanUrl(api.customUrl);
        var res2 = await fetch(host + '/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, hunterName: cleanSignupName, password: password, mode: mode })
        });
        var json2 = await res2.json();
        if (!res2.ok) throw new Error(json2.error || 'Server registration failed');

        if (json2.user) {
          json2.user.hunterName = cleanSignupName;
          json2.user.isNewRegistration = true;
        }

        api.setSession(json2.token, json2.user);
        return json2;

      } else {
        // Local Account Simulation
        var localId = 'local_' + Date.now();
        var localUser = { id: localId, email: email, hunterName: cleanSignupName, isNewRegistration: true };
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
          throw new Error('Supabase database configuration missing. Please enter Project URL and Anon Key in Database Setup.');
        }

        var url = cleanUrl(api.supabaseUrl);
        var key = cleanKey(api.supabaseAnonKey);
        var rawInput = String(emailOrName || '').trim();
        var email = rawInput.toLowerCase();
        var typedHunterName = !rawInput.includes('@') ? sanitizeHunterName(rawInput) : '';
        var lookedUpProfileName = '';

        // If user typed hunter name instead of email:
        if (!email.includes('@')) {
          try {
            var lookupRes = await fetch(url + '/rest/v1/hunter_profiles?hunter_name=ilike.' + encodeURIComponent(rawInput) + '&select=email,hunter_name&limit=1', {
              headers: { 'apikey': key }
            });
            if (lookupRes.ok) {
              var rows = await lookupRes.json();
              if (rows && rows.length) {
                if (rows[0].email) email = rows[0].email.trim().toLowerCase();
                if (rows[0].hunter_name) lookedUpProfileName = sanitizeHunterName(rows[0].hunter_name);
              }
            }
          } catch (e) {}

          if (!email.includes('@')) {
            var remEmail = api.getRememberedEmailByHunterName(rawInput);
            if (remEmail) email = remEmail;
          }
        }

        var res = await fetch(url + '/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': key
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        });

        var json = await res.json();
        if (!res.ok) {
          var errMsg = json.error_description || json.msg || json.error || 'Authentication failed.';
          if (errMsg.toLowerCase().includes('email not confirmed')) {
            throw new Error('Email not confirmed. Check your inbox for confirmation link, or disable "Confirm email" in Supabase -> Authentication -> Providers -> Email.');
          }
          if (errMsg.toLowerCase().includes('invalid login credentials')) {
            throw new Error('Invalid email or password. Verify credentials or register a new hunter account.');
          }
          throw new Error(errMsg);
        }

        var token = json.access_token;
        var userEmail = (json.user && json.user.email) ? json.user.email.trim().toLowerCase() : email;
        var emailPrefix = userEmail.includes('@') ? userEmail.split('@')[0].toLowerCase() : '';
        var meta = (json.user && (json.user.user_metadata || json.user.raw_user_meta_data)) || {};

        var metaName = sanitizeHunterName(meta.hunter_name || meta.display_name || meta.full_name || meta.name);
        var dbName = lookedUpProfileName;

        // Query hunter_profiles table directly for hunter_name
        if (!dbName && json.user && json.user.id) {
          try {
            var profileRes = await fetch(url + '/rest/v1/hunter_profiles?id=eq.' + json.user.id + '&select=hunter_name&limit=1', {
              headers: {
                'apikey': key,
                'Authorization': 'Bearer ' + token
              }
            });
            if (profileRes.ok) {
              var pRows = await profileRes.json();
              if (pRows && pRows.length && pRows[0].hunter_name) {
                dbName = sanitizeHunterName(pRows[0].hunter_name);
              }
            }
          } catch (e) {}
        }

        var rememberedName = api.getRememberedHunterName(userEmail) || (typedHunterName ? api.getRememberedHunterName(typedHunterName) : null);

        // Priority resolution: prefer non-email-prefix custom hunter names
        var candidates = [metaName, dbName, rememberedName, typedHunterName];
        var hunterName = '';
        for (var cIdx = 0; cIdx < candidates.length; cIdx++) {
          var cand = candidates[cIdx];
          if (cand && cand.toLowerCase() !== emailPrefix) {
            hunterName = cand;
            break;
          }
        }
        if (!hunterName) {
          hunterName = metaName || dbName || rememberedName || typedHunterName;
        }

        if (hunterName) {
          api.rememberHunterName(userEmail, hunterName);
          // Ensure Supabase Auth user_metadata also holds this hunter_name for future logins on any device
          if (meta.hunter_name !== hunterName) {
            fetch(url + '/auth/v1/user', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'apikey': key,
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({
                data: {
                  hunter_name: hunterName,
                  display_name: hunterName
                }
              })
            }).catch(function () {});
          }
        } else {
          // Display fallback only — do NOT call rememberHunterName so we never overwrite a real name with email prefix
          var cleanPart = (userEmail ? userEmail.split('@')[0] : 'Hunter');
          hunterName = cleanPart.charAt(0).toUpperCase() + cleanPart.slice(1);
        }

        var user = {
          id: json.user.id,
          email: userEmail,
          hunterName: hunterName
        };

        api.setSession(token, user);
        return { user: user, token: token };

      } else if (api.provider === 'custom') {
        var host = cleanUrl(api.customUrl);
        var res2 = await fetch(host + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrName: emailOrName, password: password })
        });
        var json2 = await res2.json();
        if (!res2.ok) throw new Error(json2.error || 'Server login failed.');

        var customName = sanitizeHunterName(json2.user.hunterName) || api.getRememberedHunterName(json2.user.email || emailOrName);
        if (customName) {
          api.rememberHunterName(json2.user.email, customName);
        } else {
          customName = json2.user.email ? json2.user.email.split('@')[0] : 'Hunter';
        }
        json2.user.hunterName = customName;

        api.setSession(json2.token, json2.user);
        return json2;

      } else {
        // Local mode fallback
        var localResolved = api.getRememberedHunterName(emailOrName);
        if (!localResolved) {
          if (S.state && S.state.profile && S.state.profile.hunterName && sanitizeHunterName(S.state.profile.hunterName)) {
            localResolved = sanitizeHunterName(S.state.profile.hunterName);
          } else if (!emailOrName.includes('@') && sanitizeHunterName(emailOrName)) {
            localResolved = sanitizeHunterName(emailOrName);
          }
        }
        var cleanLocalEmail = emailOrName.includes('@') ? emailOrName.trim().toLowerCase() : (api.getRememberedEmailByHunterName(emailOrName) || (S.state && S.state.profile && S.state.profile.email ? S.state.profile.email : emailOrName + '@solo.quest'));
        if (!localResolved) {
          localResolved = api.getRememberedHunterName(cleanLocalEmail);
        }
        if (localResolved) {
          api.rememberHunterName(cleanLocalEmail, localResolved);
        } else {
          var localPart = cleanLocalEmail.includes('@') ? cleanLocalEmail.split('@')[0] : emailOrName;
          localResolved = localPart ? (localPart.charAt(0).toUpperCase() + localPart.slice(1)) : 'Hunter';
        }
        var storedUser = { id: 'local_user', email: cleanLocalEmail, hunterName: localResolved };
        api.setSession('local_token', storedUser);
        return { user: storedUser, token: 'local_token' };
      }
    },

    logout: function () {
      if (api.provider === 'supabase' && api.token && api.supabaseUrl && api.supabaseAnonKey) {
        var url = cleanUrl(api.supabaseUrl);
        var key = cleanKey(api.supabaseAnonKey);
        fetch(url + '/auth/v1/logout', {
          method: 'POST',
          headers: {
            'apikey': key,
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
        var url = cleanUrl(api.supabaseUrl);
        var key = cleanKey(api.supabaseAnonKey);

        var orderParam = 'hrs_score.desc';
        if (view === 'HALL') {
          orderParam = 'combat_power.desc,level.desc';
        }

        var filterParam = '';
        if (view === 'DIVISION' && targetTierIndex !== undefined && targetTierIndex !== null) {
          filterParam = '&rank_tier_index=eq.' + targetTierIndex;
        }

        var endpoint = url + '/rest/v1/hunter_profiles?select=id,hunter_name,level,rank_code,rank_tier_index,streak_days,hrs_score,combat_power,total_focus_minutes,total_km_run&order=' + orderParam + filterParam + '&limit=50';

        try {
          var res = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'apikey': key,
              'Authorization': 'Bearer ' + (api.token || key)
            }
          });

          if (!res.ok) {
            return null; // Gracefully fallback if table does not exist
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
        } catch (e) {
          return null;
        }

      } else if (api.provider === 'custom' && api.customUrl) {
        var host = cleanUrl(api.customUrl);
        var query = '?view=' + view + (targetTierIndex !== undefined ? '&tier=' + targetTierIndex : '');
        var res2 = await fetch(host + '/api/leaderboard' + query, { method: 'GET' });
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
      var stats = p.stats || {};
      var resolvedHunterName = sanitizeHunterName(p.hunterName) ||
        (api.user && sanitizeHunterName(api.user.hunterName)) ||
        api.getRememberedHunterName(api.user && api.user.email) ||
        p.hunterName ||
        (api.user && api.user.hunterName) ||
        'Hunter';

      if (sanitizeHunterName(resolvedHunterName)) {
        p.hunterName = resolvedHunterName;
        if (api.user) api.user.hunterName = resolvedHunterName;
      }

      var apVal = p.unallocatedAp !== undefined ? p.unallocatedAp : (p.ap || 0);
      var strVal = stats.STR !== undefined ? stats.STR : (p.str || 10);
      var agiVal = stats.AGI !== undefined ? stats.AGI : (p.agi || 10);
      var vitVal = stats.VIT !== undefined ? stats.VIT : (p.vit || 10);
      var intVal = stats.INT !== undefined ? stats.INT : (p.int || 10);
      var perVal = stats.PER !== undefined ? stats.PER : (p.per || 10);
      var essenceVal = p.essenceStones !== undefined ? p.essenceStones : (p.essence || 0);

      var profilePayload = {
        hunterName: resolvedHunterName,
        level: p.level,
        currentXp: p.currentXp,
        ap: apVal,
        str: strVal,
        agi: agiVal,
        vit: vitVal,
        int: intVal,
        per: perVal,
        gold: p.gold || 0,
        essence: essenceVal,
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
        var url = cleanUrl(api.supabaseUrl);
        var key = cleanKey(api.supabaseAnonKey);
        var token = api.token || key;
        var headers = {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': 'Bearer ' + token,
          'Prefer': 'resolution=merge-duplicates'
        };

        // 1. Upsert Profile
        var dbProfile = {
          id: api.user.id,
          hunter_name: resolvedHunterName,
          email: api.user.email,
          level: p.level,
          current_xp: p.currentXp,
          ap: apVal,
          str: strVal,
          agi: agiVal,
          vit: vitVal,
          int: intVal,
          per: perVal,
          gold: p.gold || 0,
          essence: essenceVal,
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

        var pReq = fetch(url + '/rest/v1/hunter_profiles', {
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

        var iReq = fetch(url + '/rest/v1/hunter_inventory', {
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

        var qReq = dbQuests.length ? fetch(url + '/rest/v1/hunter_quests', {
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
        var url = cleanUrl(api.supabaseUrl);
        var key = cleanKey(api.supabaseAnonKey);
        var headers = {
          'apikey': key,
          'Authorization': 'Bearer ' + api.token
        };

        try {
          // 1. Fetch Profile
          var pRes = await fetch(url + '/rest/v1/hunter_profiles?id=eq.' + api.user.id, {
            method: 'GET',
            headers: headers
          });
          var pData = pRes.ok ? await pRes.json() : null;
          var remoteProfile = pData && pData.length ? pData[0] : null;

          // 2. Fetch Quests
          var qRes = await fetch(url + '/rest/v1/hunter_quests?user_id=eq.' + api.user.id, {
            method: 'GET',
            headers: headers
          });
          var remoteQuests = qRes.ok ? await qRes.json() : [];

          // 3. Fetch Inventory
          var iRes = await fetch(url + '/rest/v1/hunter_inventory?user_id=eq.' + api.user.id, {
            method: 'GET',
            headers: headers
          });
          var iData = iRes.ok ? await iRes.json() : null;
          var remoteInv = iData && iData.length ? iData[0] : null;

          return {
            profile: remoteProfile,
            quests: remoteQuests,
            inventory: remoteInv
          };
        } catch (e) {
          console.warn('[SYNC DOWN ERROR]', e);
          return null;
        }

      } else if (api.provider === 'custom') {
        var host = cleanUrl(api.customUrl);
        var res = await fetch(host + '/api/sync/down', {
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

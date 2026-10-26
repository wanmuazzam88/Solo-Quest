/* ==============================================================================
   PROJECT: ARISE — THE SYSTEM // DEDICATED BACKEND SERVER
   Zero-dependency Node.js REST API with authentication, real hunter leaderboards,
   and persistent JSON/relational database storage.
   ============================================================================== */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'solo_quest_monarch_shadow_secret_key_2026';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'system_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory Database State with Disk Persistence
let db = {
  users: [],       // { id, email, hunterName, passwordHash, salt, createdAt }
  profiles: {},    // { [userId]: { hunterName, email, level, xp, ap, str, agi, vit, int, per, gold, essence, rankTierIndex, rankCode, streakDays, maxStreak, hrsScore, combatPower, totalFocusMins, totalKmRun, penaltyMode, inPenaltyZone, activeTitle, activeSkinId, activeBorderId, activeShadowId, equippedRelicIds, updatedAt } }
  quests: {},      // { [userId]: [ { id, title, category, unit, targetProgress, currentProgress, isCompleted, preset, isPenaltyQuest, isExam, isBonus, createdDate } ] }
  runs: {},        // { [userId]: [ { id, date, distanceKm, distanceMeters, durationSec, movingSec, avgPaceStr, maxSpeedKmh, totalSteps, avgCadenceSpm, calories, elevationGainMeters, splits, routeSample } ] }
  inventories: {}, // { [userId]: { ownedItems, boxes, unlockedSkins, unlockedTitles, unlockedBorders, shadows } }
  logs: {}         // { [userId]: { [date]: { xp, hrsXp, verifiedMins, focusMins, quests, failed, resolved } } }
};

// Load database from disk if present
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const loaded = JSON.parse(raw);
      db = Object.assign(db, loaded);
      console.log(`[DATABASE] Loaded ${db.users.length} registered hunters from storage.`);
    } else {
      saveDatabase();
      console.log('[DATABASE] Initialized fresh system database storage.');
    }
  } catch (err) {
    console.error('[DATABASE] Error reading database file:', err);
  }
}

// Atomic save to disk
function saveDatabase() {
  try {
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DATABASE] Error writing database file:', err);
  }
}

// ==============================================================================
// Cryptographic & JWT Authentication Helpers
// ==============================================================================
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(Object.assign({}, payload, {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 86400) // 30-day session
  }))).toString('base64url');
  
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
    
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const header = parts[0];
  const body = parts[1];
  const sig = parts[2];
  
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
    
  if (sig !== expectedSig) return null;
  
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

function extractBearer(req) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

// JSON Body Parser helper
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
  });
  res.end(payload);
}

// ==============================================================================
// HTTP Request Router
// ==============================================================================
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // 1. Health & Server Info
    if (pathname === '/api/health' || pathname === '/') {
      return sendJson(res, 200, {
        status: 'ONLINE',
        system: 'PROJECT: ARISE // THE SYSTEM BACKEND',
        version: '1.0.0',
        totalHunters: db.users.length,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Authentication: Register (Hunter Awakening)
    if (pathname === '/api/auth/register' && method === 'POST') {
      const data = await readJsonBody(req);
      const email = (data.email || '').trim().toLowerCase();
      const hunterName = (data.hunterName || '').trim();
      const password = data.password || '';
      const mode = data.mode === 'HARDCORE' ? 'HARDCORE' : 'OPTIONAL';

      if (!email || !hunterName || !password) {
        return sendJson(res, 400, { error: 'Email, hunter designation, and password are required.' });
      }
      if (password.length < 6) {
        return sendJson(res, 400, { error: 'Password must be at least 6 characters long.' });
      }

      // Check if email or hunter name already registered
      const existingUser = db.users.find(u => u.email === email || u.hunterName.toLowerCase() === hunterName.toLowerCase());
      if (existingUser) {
        return sendJson(res, 409, { error: 'A hunter with this email or designation is already awakened.' });
      }

      const userId = crypto.randomUUID();
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);

      const newUser = {
        id: userId,
        email,
        hunterName,
        passwordHash,
        salt,
        createdAt: new Date().toISOString()
      };

      // Initial Hunter Profile
      const initialProfile = {
        id: userId,
        hunterName,
        email,
        level: 1,
        currentXp: 0,
        ap: 0,
        str: 10,
        agi: 10,
        vit: 10,
        int: 10,
        per: 10,
        gold: 100,
        essence: 0,
        rankTierIndex: 0,
        rankCode: 'E-IV',
        streakDays: 0,
        maxStreak: 0,
        hrsScore: 0,
        combatPower: 120,
        totalFocusMinutes: 0,
        totalKmRun: 0,
        penaltyMode: mode,
        inPenaltyZone: false,
        activeTitle: '',
        activeSkinId: 'default',
        activeBorderId: '',
        activeShadowId: '',
        equippedRelicIds: [],
        updatedAt: new Date().toISOString()
      };

      db.users.push(newUser);
      db.profiles[userId] = initialProfile;
      db.quests[userId] = [];
      db.runs[userId] = [];
      db.inventories[userId] = {
        ownedItems: { c_pot_low: 1, c_key_subway: 1 },
        boxes: { BLESSED: 0, CURSED: 0 },
        unlockedSkins: ['default'],
        unlockedTitles: [],
        unlockedBorders: [],
        shadows: {}
      };
      db.logs[userId] = {};

      saveDatabase();

      const token = generateToken({ id: userId, hunterName, email });
      return sendJson(res, 201, {
        message: 'Hunter successfully awakened.',
        token,
        user: { id: userId, hunterName, email },
        profile: initialProfile
      });
    }

    // 3. Authentication: Login (System Link)
    if (pathname === '/api/auth/login' && method === 'POST') {
      const data = await readJsonBody(req);
      const emailOrName = (data.emailOrName || data.email || '').trim().toLowerCase();
      const password = data.password || '';

      if (!emailOrName || !password) {
        return sendJson(res, 400, { error: 'Identification and password are required.' });
      }

      const user = db.users.find(u => u.email === emailOrName || u.hunterName.toLowerCase() === emailOrName);
      if (!user) {
        return sendJson(res, 401, { error: 'Invalid hunter credentials. No records found in System.' });
      }

      const hashedInput = hashPassword(password, user.salt);
      if (hashedInput !== user.passwordHash) {
        return sendJson(res, 401, { error: 'Invalid hunter credentials. Passcode mismatch.' });
      }

      const token = generateToken({ id: user.id, hunterName: user.hunterName, email: user.email });
      const profile = db.profiles[user.id] || { id: user.id, hunterName: user.hunterName, email: user.email };

      return sendJson(res, 200, {
        message: 'System link authorized.',
        token,
        user: { id: user.id, hunterName: user.hunterName, email: user.email },
        profile
      });
    }

    // 4. Current User Session Check
    if (pathname === '/api/auth/me' && method === 'GET') {
      const token = extractBearer(req);
      const payload = verifyToken(token);
      if (!payload) {
        return sendJson(res, 401, { error: 'Unauthorized or expired session.' });
      }

      const user = db.users.find(u => u.id === payload.id);
      if (!user) {
        return sendJson(res, 404, { error: 'Hunter account not found.' });
      }

      const profile = db.profiles[user.id] || {};
      return sendJson(res, 200, {
        user: { id: user.id, hunterName: user.hunterName, email: user.email },
        profile
      });
    }

    // 5. Global Leaderboard (Query Real Registered People)
    if (pathname === '/api/leaderboard' && method === 'GET') {
      const view = (parsedUrl.query.view || 'VANGUARD').toUpperCase();
      const targetTier = parseInt(parsedUrl.query.tier, 10);

      // Collect all registered hunter profiles
      const allProfiles = Object.values(db.profiles);

      let sorted = [];
      if (view === 'DIVISION') {
        const divisionProfiles = isNaN(targetTier) ? allProfiles : allProfiles.filter(p => p.rankTierIndex === targetTier);
        sorted = divisionProfiles.sort((a, b) => (b.hrsScore || 0) - (a.hrsScore || 0));
      } else if (view === 'HALL') {
        sorted = allProfiles.sort((a, b) => {
          if ((b.combatPower || 0) !== (a.combatPower || 0)) {
            return (b.combatPower || 0) - (a.combatPower || 0);
          }
          return (b.level || 1) - (a.level || 1);
        });
      } else {
        // Seasonal Vanguard (Overall HRS)
        sorted = allProfiles.sort((a, b) => (b.hrsScore || 0) - (a.hrsScore || 0));
      }

      const formatted = sorted.slice(0, 50).map((p, idx) => ({
        pos: idx + 1,
        id: p.id,
        name: p.hunterName.toUpperCase(),
        tier: p.rankCode || 'E-IV',
        tierIndex: p.rankTierIndex || 0,
        level: p.level || 1,
        streak: p.streakDays || 0,
        score: view === 'HALL' ? (p.combatPower || 120) : (p.hrsScore || 0),
        combatPower: p.combatPower || 120,
        totalKmRun: p.totalKmRun || 0,
        focusMins: p.totalFocusMinutes || 0
      }));

      return sendJson(res, 200, {
        view,
        totalRegisteredHunters: allProfiles.length,
        leaderboard: formatted,
        timestamp: new Date().toISOString()
      });
    }

    // 6. Data Synchronization: Sync Up (Save Client State to Database)
    if (pathname === '/api/sync/up' && method === 'POST') {
      const token = extractBearer(req);
      const payload = verifyToken(token);
      if (!payload) {
        return sendJson(res, 401, { error: 'Authentication required to sync with database.' });
      }

      const userId = payload.id;
      const data = await readJsonBody(req);

      // 1. Update Profile & Points & Stats
      if (data.profile) {
        const existing = db.profiles[userId] || {};
        db.profiles[userId] = Object.assign(existing, {
          hunterName: data.profile.hunterName || existing.hunterName || payload.hunterName,
          level: data.profile.level !== undefined ? data.profile.level : existing.level,
          currentXp: data.profile.currentXp !== undefined ? data.profile.currentXp : existing.currentXp,
          ap: data.profile.ap !== undefined ? data.profile.ap : existing.ap,
          str: data.profile.str !== undefined ? data.profile.str : existing.str,
          agi: data.profile.agi !== undefined ? data.profile.agi : existing.agi,
          vit: data.profile.vit !== undefined ? data.profile.vit : existing.vit,
          int: data.profile.int !== undefined ? data.profile.int : existing.int,
          per: data.profile.per !== undefined ? data.profile.per : existing.per,
          gold: data.profile.gold !== undefined ? data.profile.gold : existing.gold,
          essence: data.profile.essence !== undefined ? data.profile.essence : existing.essence,
          rankTierIndex: data.profile.rankTierIndex !== undefined ? data.profile.rankTierIndex : existing.rankTierIndex,
          rankCode: data.profile.rankCode || existing.rankCode,
          streakDays: data.profile.streakDays !== undefined ? data.profile.streakDays : existing.streakDays,
          maxStreak: data.profile.maxStreak !== undefined ? data.profile.maxStreak : existing.maxStreak,
          hrsScore: data.profile.hrsScore !== undefined ? data.profile.hrsScore : existing.hrsScore,
          combatPower: data.profile.combatPower !== undefined ? data.profile.combatPower : existing.combatPower,
          totalFocusMinutes: data.profile.totalFocusMinutes !== undefined ? data.profile.totalFocusMinutes : existing.totalFocusMinutes,
          totalKmRun: data.profile.totalKmRun !== undefined ? data.profile.totalKmRun : existing.totalKmRun,
          inPenaltyZone: !!data.profile.inPenaltyZone,
          penaltyMode: data.profile.penaltyMode || existing.penaltyMode,
          activeTitle: data.profile.activeTitle || existing.activeTitle,
          activeSkinId: data.profile.activeSkinId || existing.activeSkinId,
          activeBorderId: data.profile.activeBorderId || existing.activeBorderId,
          activeShadowId: data.profile.activeShadowId || existing.activeShadowId,
          equippedRelicIds: data.profile.equippedRelicIds || existing.equippedRelicIds,
          updatedAt: new Date().toISOString()
        });
      }

      // 2. Update Quests
      if (Array.isArray(data.quests)) {
        db.quests[userId] = data.quests;
      }

      // 3. Update Runs
      if (Array.isArray(data.runs)) {
        db.runs[userId] = data.runs;
      }

      // 4. Update Inventory & Vault
      if (data.inventory) {
        db.inventories[userId] = data.inventory;
      }

      // 5. Update Day Logs
      if (data.log) {
        db.logs[userId] = data.log;
      }

      saveDatabase();

      return sendJson(res, 200, {
        success: true,
        message: 'Hunter state and telemetry saved to database.',
        syncedAt: new Date().toISOString()
      });
    }

    // 7. Data Synchronization: Sync Down (Fetch Hunter State from Database)
    if (pathname === '/api/sync/down' && method === 'GET') {
      const token = extractBearer(req);
      const payload = verifyToken(token);
      if (!payload) {
        return sendJson(res, 401, { error: 'Authentication required to retrieve database state.' });
      }

      const userId = payload.id;
      const profile = db.profiles[userId] || null;
      const quests = db.quests[userId] || [];
      const runs = db.runs[userId] || [];
      const inventory = db.inventories[userId] || null;
      const log = db.logs[userId] || {};

      return sendJson(res, 200, {
        success: true,
        data: {
          profile,
          quests,
          runs,
          inventory,
          log
        },
        syncedAt: new Date().toISOString()
      });
    }

    // Default 404
    sendJson(res, 404, { error: 'Endpoint not found in Hunter System Protocol.' });

  } catch (err) {
    console.error('[SERVER ERROR]', err);
    sendJson(res, 500, { error: 'Internal system anomaly occurred.', details: err.message });
  }
});

// Boot Server
loadDatabase();
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`[PROJECT: ARISE] Hunter System Server Active on port ${PORT}`);
  console.log(`REST API Endpoint: http://localhost:${PORT}/api`);
  console.log(`Database storage: ${DB_FILE}`);
  console.log(`======================================================\n`);
});

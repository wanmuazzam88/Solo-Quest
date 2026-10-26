# SOLO QUEST // HUNTER DATABASE & AUTHENTICATION SETUP GUIDE
**THE SYSTEM // PROJECT: ARISE — CLOUD & LOCAL DATABASE ARCHITECTURE**

Welcome, Hunter. Solo Quest features a database and authentication architecture designed to preserve your hunter progression (points, stats, daily quests, running GPS telemetry, and vault relics) and power the real global Hunter Association leaderboards.

---

## 1. ARCHITECTURE OVERVIEW

Solo Quest supports two database options depending on your preference:

| Feature | Option A: Supabase Cloud (Recommended) | Option B: Local Node.js Server |
| :--- | :--- | :--- |
| **Hosting** | Free Cloud PostgreSQL (Supabase) | Local Machine / Self-Hosted VPS |
| **Setup Time** | ~3 Minutes (Zero code installation) | ~1 Minute (Requires Node.js runtime) |
| **Global Leaderboard** | Real hunters worldwide across the internet | Local LAN / Single server users |
| **Cross-Device Sync** | Yes (Phone, PC, Tablet, PWA) | Only when server is online and port-forwarded |
| **Dependencies** | Zero (Direct browser fetch to REST API) | Zero npm dependencies (Native `http`, `crypto`) |
| **Security** | PostgreSQL Row Level Security (RLS) & JWT | Salted PBKDF2 Password Hashing & HS256 JWT |

---

## 2. OPTION A: SUPABASE CLOUD SETUP (RECOMMENDED)

Supabase gives you a 100% free hosted PostgreSQL database with built-in authentication and REST APIs. No Node.js or command-line installation is required on your machine.

### Step 1: Create a Free Supabase Account
1. Open [https://supabase.com](https://supabase.com) in your web browser.
2. Sign in with GitHub or create a free account.
3. Click **New Project** and name it (e.g., `solo-quest`).
4. Set a strong database password and select the region nearest to you.
5. Click **Create new project** and wait ~1 minute for deployment.

### Step 2: Initialize Database Tables & Security Policies
1. In the Supabase project sidebar, click the **SQL Editor** icon (shaped like a console or `>_`).
2. Click **New Query**.
3. Open the file [`supabase/schema.sql`](file:///c:/Users/wanmu/OneDrive/Desktop/Solo%20quest/supabase/schema.sql) in this repository.
4. Copy the entire contents of `supabase/schema.sql` and paste it into the Supabase SQL Editor.
5. Click **Run** (green button).

> **What this creates in PostgreSQL:**
> - `hunter_profiles`: Stores Level, XP, AP, STR, AGI, VIT, INT, PER, Gold, Essence, Rank Code, Streak, HRS Score, and Combat Power.
> - `hunter_quests`: Stores all daily quests, custom forged quests, completion states, and progress.
> - `hunter_runs`: Stores GPS route coordinates, kilometer splits, pace, cadence, and distance.
> - `hunter_inventory`: Stores owned relics, loot boxes, monarch shadows, skins, and titles.
> - `hunter_logs`: Real-time audit history of quest completions and rank exams.
> - **Row Level Security (RLS)**: Public read access for global leaderboards, private authenticated write access for user accounts.
> - **Trigger `handle_new_hunter()`**: Automatically initializes a hunter profile when a new user signs up.

### Step 3: Copy Your API Keys
1. In Supabase, click **Project Settings** (gear icon at the bottom of the sidebar).
2. Click **API** under Configuration.
3. Copy the following two credentials:
   - **Project URL** (e.g., `https://abcdefghijkl.supabase.co`)
   - **Project API Keys** -> `anon` / `public` (starts with `eyJ...`)

### Step 4: Configure Solo Quest
1. Open Solo Quest in your browser (e.g. `index.html` or your live URL).
2. Click the **SYSTEM LINK** button in the top navigation bar (or go to **Config** -> **AWAKEN / LINK DATABASE**).
3. Switch to the **DATABASE SETUP & PING** tab.
4. Select **Supabase Cloud (PostgreSQL REST API)** from the dropdown.
5. Paste your **Supabase Project URL** and **Anon Public Key**.
6. Click **TEST PING** — the indicator will turn green and display your live latency (e.g. `ONLINE // 35 MS`).
7. Click **SAVE CONFIGURATION**.

### Step 5: Awaken Your Hunter Account
1. In the terminal modal, click the **AWAKENING (REGISTER)** tab.
2. Enter your **Hunter Name** (e.g. `Sung Jin-Woo`), **Email**, and **Passcode** (minimum 6 characters).
3. Choose your Accountability Directive:
   - *Standard*: Optional penalty quest with streak recovery.
   - *Hardcore Manhwa*: Mandatory Blood Crimson penalty zone if daily quests are missed by midnight.
4. Click **AWAKEN & SAVE PROGRESS**.
5. Your account is awakened, all local stats are uploaded to PostgreSQL, and your name appears on the live global leaderboard!

---

## 3. OPTION B: LOCAL NODE.JS REST SERVER SETUP

If you prefer to host your own backend locally or on your own server:

### Step 1: Start the Backend
Open PowerShell or your terminal:
```powershell
cd "c:\Users\wanmu\OneDrive\Desktop\Solo quest\server"
node server.js
```
The server will boot with zero external npm dependencies:
```
[THE SYSTEM // SERVER ONLINE]
Database initialized: SQLite/Memory Matrix Ready
HTTP REST API active on port: 3000
Base URL: http://localhost:3000
```

### Step 2: Configure Solo Quest
1. In Solo Quest, click **SYSTEM LINK** in the topbar.
2. Switch to **DATABASE SETUP & PING**.
3. Select **Self-Hosted Node.js / SQLite Server**.
4. Set Server URL to `http://localhost:3000`.
5. Click **TEST PING** & **SAVE CONFIGURATION**.
6. Switch to **AWAKENING (REGISTER)** to create your hunter profile.

---

## 4. HOW LIVE LEADERBOARDS WORK

Unlike hardcoded mock data, the Solo Quest leaderboard connects directly to your database:

1. **Seasonal Vanguard**: Ranks all verified registered hunters by total **HRS (Hunter Rating Score)**, calculated dynamically from completed quests, workout volume, focus minutes, and running distance.
2. **Division Bracket**: Filters real hunters within your exact rank tier (`E-IV` up to `S-I` and `National Level`).
3. **Hall of Monarchs**: Ranks all-time champions by **Combat Power** and level ascension.

Hunters registered in the database display a `[VERIFIED]` badge in the ranking table. Clicking **SYNC** refreshes the standings with the latest cloud records.

---

## 5. AUTOMATIC BIDIRECTIONAL SYNC

Once authenticated:
- **Instant Save on Mutation**: Earning XP, assigning Ability Points (STR, AGI, VIT, INT, PER), forging custom quests, or collecting Gold/Essence triggers a debounced cloud save.
- **Run Telemetry Sync**: Finishing a GPS run automatically uploads full route coordinates, kilometer split times, cadence, and pace data to `hunter_runs`.
- **Cross-Device Recovery**: Logging in from any device restores your level, attributes, daily quests, and inventory items automatically.

---

## 6. TROUBLESHOOTING

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **Ping shows "OFFLINE // UNREACHABLE"** | Invalid Supabase URL or Anon Key | Double check `https://` prefix and ensure you copied the `anon` public key (not the service_role key). |
| **"Authentication failed" on register** | Email already in use or password < 6 chars | Use a unique email or log in using the **SYSTEM LINK (LOGIN)** tab. |
| **"Failed to query Supabase leaderboard"** | `schema.sql` was not run in Supabase | Open the SQL Editor in Supabase, paste `supabase/schema.sql`, and execute it to enable public read policies. |
| **Location permission denied during run** | Browser security restriction | Allow location in browser site settings or use the built-in Satellite Demo Simulation. |

---
*THE SYSTEM // NEVER SINK INTO WEAKNESS. ARISE.*

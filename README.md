# PROJECT: ARISE — THE SYSTEM
## Solo Leveling Gamified Habit, Workout & Focus Web Application

*"You versus your old self, one quest at a time."*

A dark-futuristic, tactical manhwa-styled web application modeled directly after the omniscient "System" from *Solo Leveling*.

---

### Features Implemented (Per Architecture Plan `v1.0`):

1. **22 Hunter Tiers & Progression Engine:**
   - From `E-IV (Weakest Hunter)` up to `MONARCH (Shadow Monarch)`.
   - Polynomial leveling curve: $\text{XP}_{\text{req}}(L) = \lfloor 100 \cdot L^{1.65} + 50 \cdot (L - 1) \rfloor$.
   - Promotion Exams (Rank Advancement Dungeons) required to advance between tiers.
   - Dynamic 5-axis SVG Radar Chart tracking `STR`, `AGI`, `VIT`, `INT`, and `PER`.
   - `+5 AP` awarded per level up for custom attribute allocation.

2. **Daily Quests & Fast 1-Tap Logging:**
   - Canonical System Preset: Push-ups, Sit-ups, and Squats.
   - Fast rep log buttons (`+1`, `+5`, `+10`, `+25`, `MAX`) designed for mid-workout logging in under 1.5 seconds.
   - Hold-to-confirm holographic seal interaction for binary habit checks.
   - Modular Custom Quest Forge (Calisthenics, Gym, Study, Focus, Habit).
   - Bonus Quest re-roll system (cooldown reduced by your `AGI` stat).


3. **Midnight Evaluation & The Dreaded Penalty Zone:**
   - Real-time countdown timer to `00:00:00` local time.
   - **Hardcore Manhwa Mode:** Uncompleted daily quests trigger a full application override into **Blood Crimson (`#FF003C`)**, freezing the Vault and normal XP gains until surviving a mandatory Penalty Quest or 45-minute Dark Lock session.
   - **Standard Mode:** Optional redemption quests and streak preservation.

4. **Focus Gate & "Dark Lock" Distraction Shield:**
   - Four dungeon tiers: E-Rank (15m), C-Rank (25m), A-Rank (50m), and the brutal S-Rank Red Gate (90m unbroken).
   - Fullscreen API and Screen WakeLock integration.
   - Tab visibility & window blur telemetry with a **15-second grace countdown**.
   - Failing to return in time triggers a **Gate Breach (`[FOCUS BROKEN]`)**, corrupting bonus loot and cutting XP yield by 50%.
   - Companion Chrome/Edge Manifest V3 extension in `extension/` using `declarativeNetRequest`.

5. **Hunter's Vault & Rewards (165 Items):**
   - 45 Hunter Weapons & Relics with passive buffs (equip up to 2).
   - 30 Consumables, Keys, and Skill Runes.
   - 25 System UI Hologram Skins with live dynamic theme switching.
   - 40 Hunter Titles unlocked via feats and milestones.
   - 25 Shadow Army summons & holographic avatar borders unlocked via `[ARISE]` at Level 40.
   - Gacha Loot Box opening sequence (Blessed & Cursed boxes).
   - Hunter Association Commissary (Gold & Essence store).


6. **Zero-Emoji Mandate & Manhwa Aesthetics:**
   - 100% bespoke SVG geometric glyphs with glowing neon drop-shadows.
   - Native **Web Audio API** procedural synthesizer (no external audio files required).

7. **Progressive Web App (PWA) & Offline Ready:**
   - **Standalone Installable:** Complete Web App Manifest (`manifest.json`) with bespoke 192px/512px tactical Shadow Monarch Sovereign Sword crest icons, maskable formats, theme color `#04060A`, and 3 app shortcuts (`Quests`, `Gate`, `Status`).
   - **Offline-First Service Worker (`sw.js`):** Pre-caches core shell assets, scripts, styles, and fonts with a Stale-While-Revalidate caching strategy and offline fallback.
   - **Native Install Prompt:** Top-bar holographic `INSTALL APP` button dynamically unhides upon `beforeinstallprompt` event and registers standalone launch upon installation.

8. **Full Authentication System & Cloud Database Sync:**
    - **Universal Database Adapter (`js/api.js`):** Dual architecture supporting **Supabase Cloud (PostgreSQL REST API)** and **Self-Hosted Node.js / SQLite Server (`server/server.js`)**, with seamless offline local fallback.
    - **Hunter Awakening & Authentication:** System registration, encrypted login, secure token management, and session recovery across devices.
    - **Automatic Bidirectional Progression Sync:** All player points (XP, AP), attributes (STR, AGI, VIT, INT, PER, Gold, Essence), daily & custom forged quests, and inventory relics synchronize directly to PostgreSQL.
    - **Database Health & Ping Diagnostics:** Real-time ping latency monitor in the HUD to measure and verify cloud database connectivity.
    - **Complete Setup Documentation:** Read [`DATABASE_SETUP_GUIDE.md`](DATABASE_SETUP_GUIDE.md) for 3-minute step-by-step instructions with the complete SQL schema.

---

### How to Run & Connect:

1. **Direct Web Browser:**
   - Simply open `index.html` in any modern web browser (Chrome, Edge, Firefox, Brave, Safari, Opera).
   - No build tools or compilers required.

2. **Connect Cloud Database & Sync:**
   - Click **SYSTEM LINK** in the top navigation bar.
   - Follow the simple instructions in [`DATABASE_SETUP_GUIDE.md`](DATABASE_SETUP_GUIDE.md) to link a free Supabase PostgreSQL cloud database or start the local Node.js server.
   - Awaken your Hunter profile to back up and synchronize progression across devices.

3. **Install as Progressive Web App (PWA):**
   - **Desktop (Chrome/Edge):** Click the `INSTALL APP` button in the top navigation bar, or click the install icon in your browser's address bar.
   - **Android (Chrome):** Tap the `INSTALL APP` button or open the menu and select *"Install app"* / *"Add to Home screen"*.
   - **iOS (Safari):** Tap the Share button and select *"Add to Home Screen"*.
   - The app launches in full standalone immersive display without browser address bars.

4. **Deploy to Cloudflare Pages (Recommended):**
   - Push your code to GitHub.
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) &rarr; **Workers & Pages** &rarr; **Create application** &rarr; **Pages** &rarr; **Connect to Git**.
   - Select your repository (`Solo-Quest`).
   - Build settings: Framework: `None`, Build command: *(leave empty)*, Output directory: `/` or `.`.
   - In project **Settings** &rarr; **Environment variables**, add:
     - `SUPABASE_URL` = your Supabase project URL (`https://xyz.supabase.co`)
     - `SUPABASE_ANON_KEY` = your Supabase anon public key
   - Click **Save & Deploy**. Cloudflare Pages automatically configures Supabase for all hunters!

5. **Data Persistence & Portability:**
   - All progress, items, and settings synchronize automatically with your connected database and persist offline in local storage.
   - Full backup JSON import/export is available in the **Config** tab.

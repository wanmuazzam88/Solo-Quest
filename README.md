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
   - Canonical System Preset: Push-ups, Sit-ups, Squats, and 10 km Run.
   - Fast rep log buttons (`+1`, `+5`, `+10`, `+25`, `MAX`) designed for mid-workout logging in under 1.5 seconds.
   - Hold-to-confirm holographic seal interaction for binary habit checks.
   - Modular Custom Quest Forge (Calisthenics, Gym, Running, Study, Focus, Habit).
   - Bonus Quest re-roll system (cooldown reduced by your `AGI` stat).

3. **Strava-Style Tactical GPS & Step Run Tracker (OpenStreetMap):**
   - **Real-Time Geolocation & Device Permissions:** Proactive satellite authorization HUD with browser permission query lifecycle, high-accuracy GPS fix locking, iOS motion sensor authorization, and in-app permission troubleshooting directives.
   - **Haversine Distance Telemetry:** High-precision distance accumulator displayed in kilometers with live sub-counters.
   - **OpenStreetMap & Leaflet Integration:** Official standard free OpenStreetMap tile API (`tile.openstreetmap.org`) with glowing neon cyan route polylines and a pulsing radar hunter beacon.
   - **Live Pace & Velocity HUD:** Instantaneous rolling pace and overall average pace (`MM'SS"/KM`), current speed (`KM/H`), and maximum speed.
   - **Motion Sensor Step Counter & Cadence:** Dynamic accelerometer peak-detection algorithm using `DeviceMotionEvent` with rolling Steps-Per-Minute (`SPM`) cadence calculation and stride-length fallback.
   - **1 KM Split Breakdowns:** Automatic split time and pace recording at every kilometer mark accompanied by procedural audio announcements.
   - **Quest Sync & History:** Direct integration with running quests (auto-increments progress upon run completion) and persistent local run dossier.
   - **Desktop/Indoor Demo Mode:** Built-in GPS simulation route with realistic coordinates and steps for immediate testing on laptops.

4. **Midnight Evaluation & The Dreaded Penalty Zone:**
   - Real-time countdown timer to `00:00:00` local time.
   - **Hardcore Manhwa Mode:** Uncompleted daily quests trigger a full application override into **Blood Crimson (`#FF003C`)**, freezing the Vault and normal XP gains until surviving a mandatory Penalty Quest or 45-minute Dark Lock session.
   - **Standard Mode:** Optional redemption quests and streak preservation.

5. **Focus Gate & "Dark Lock" Distraction Shield:**
   - Four dungeon tiers: E-Rank (15m), C-Rank (25m), A-Rank (50m), and the brutal S-Rank Red Gate (90m unbroken).
   - Fullscreen API and Screen WakeLock integration.
   - Tab visibility & window blur telemetry with a **15-second grace countdown**.
   - Failing to return in time triggers a **Gate Breach (`[FOCUS BROKEN]`)**, corrupting bonus loot and cutting XP yield by 50%.
   - Companion Chrome/Edge Manifest V3 extension in `extension/` using `declarativeNetRequest`.

6. **Hunter's Vault & Rewards (165 Items):**
   - 45 Hunter Weapons & Relics with passive buffs (equip up to 2).
   - 30 Consumables, Keys, and Skill Runes.
   - 25 System UI Hologram Skins with live dynamic theme switching.
   - 40 Hunter Titles displayed on global leaderboards.
   - 25 Shadow Army summons & holographic avatar borders unlocked via `[ARISE]` at Level 40.
   - Gacha Loot Box opening sequence (Blessed & Cursed boxes).
   - Hunter Association Commissary (Gold & Essence store).

7. **Global Leaderboards & Anti-Cheat HRS:**
   - Seasonal Vanguard, Division Brackets, and All-Time Hall of Monarchs.
   - Anti-cheat Hunter Rating Score ($\text{HRS}$) weighting verified focus minutes and streak consistency while capping daily quest spam.

8. **Zero-Emoji Mandate & Manhwa Aesthetics:**
   - 100% bespoke SVG geometric glyphs with glowing neon drop-shadows.
   - Native **Web Audio API** procedural synthesizer (no external audio files required).

9. **Progressive Web App (PWA) & Offline Ready:**
   - **Standalone Installable:** Complete Web App Manifest (`manifest.json`) with bespoke 192px/512px tactical manhwa System crest icons, maskable formats, theme color `#04060A`, and 4 app shortcuts (`Quests`, `Run`, `Gate`, `Status`).
   - **Offline-First Service Worker (`sw.js`):** Pre-caches 19 core shell assets, scripts, styles, and fonts with a Stale-While-Revalidate caching strategy, dynamic OpenStreetMap tile caching, and offline fallback.
   - **Native Install Prompt:** Top-bar holographic `INSTALL APP` button dynamically unhides upon `beforeinstallprompt` event and registers standalone launch upon installation.

---

### How to Run & Install:

1. **Direct Web Browser:**
   - Simply open `index.html` in any modern web browser (Chrome, Edge, Firefox, Brave, Safari, Opera).
   - No build tools, runtime dependencies, or external servers required!

2. **Install as Progressive Web App (PWA):**
   - **Desktop (Chrome/Edge):** Click the `INSTALL APP` button in the top navigation bar, or click the install icon in your browser's address bar.
   - **Android (Chrome):** Tap the `INSTALL APP` button or open the menu and select *"Install app"* / *"Add to Home screen"*.
   - **iOS (Safari):** Tap the Share button and select *"Add to Home Screen"*.
   - The app launches in full standalone immersive display without browser address bars.

3. **Data Persistence & Portability:**
   - All progress, runs, items, and settings are saved automatically in your device's `localStorage`.
   - Full backup JSON import/export is available in the **SETTINGS** tab.

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
   - 40 Hunter Titles displayed on global leaderboards.
   - 25 Shadow Army summons & holographic avatar borders unlocked via `[ARISE]` at Level 40.
   - Gacha Loot Box opening sequence (Blessed & Cursed boxes).
   - Hunter Association Commissary (Gold & Essence store).

6. **Global Leaderboards & Anti-Cheat HRS:**
   - Seasonal Vanguard, Division Brackets, and All-Time Hall of Monarchs.
   - Anti-cheat Hunter Rating Score ($\text{HRS}$) weighting verified focus minutes and streak consistency while capping daily quest spam.

7. **Zero-Emoji Mandate & Manhwa Aesthetics:**
   - 100% bespoke SVG geometric glyphs with glowing neon drop-shadows.
   - Native **Web Audio API** procedural synthesizer (no external audio files required).

---

### How to Run:

Simply double-click `index.html` or open it in any web browser (Chrome, Edge, Firefox, Brave, Safari, Opera).  
No build tools, dependencies, or server installations are needed! All data is saved automatically in your browser's `localStorage` and can be exported or imported anytime from the **SETTINGS** tab.

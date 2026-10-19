# THE SYSTEM: SOLO LEVELING HABIT, WORKOUT & FOCUS WEB APPLICATION
## Comprehensive Product, Design & Technical Architecture Plan (`v1.0`)

---

## 1. Executive Summary & Narrative Philosophy

**Project Codename:** `PROJECT: ARISE` (The System)  
**Core Premise:** A gamified self-improvement, workout tracking, and deep-focus web application modeled directly after the omniscient "System" from the *Solo Leveling* manhwa.  
**Narrative Hook:** *"You versus your old self, one quest at a time."*  
Instead of cheerful, cartoon-styled habit trackers, **The System** treats the user ("The Player") with cold, authoritative, high-stakes precision. Workouts, study sessions, and daily habits are framed as **Daily Quests** and **Dungeon Raids**. Consistency elevates the Player through **22 Hunter Tiers** from the weakest E-Rank Hunter to the Shadow Monarch, while complacency triggers the dreaded **Penalty Zone**.

### The 3-Step Core Loop
1. **01 // TAKE THE QUEST:** Select from System-assigned Daily Presets ("Preparation to Become Strong") or forge custom quests across Calisthenics, Gym, Running, Study, or Deep Focus.
2. **02 // EARN XP & LOOT:** Complete objectives with fast 1-tap logging or lock into a distraction-blocked **Focus Gate**. Earn Experience Points ($\text{XP}$), Ability Points ($\text{AP}$), Gold, and Random Cursed/Blessed Loot Boxes.
3. **03 // RULE THE LEADERBOARD:** Allocate stats (`STR`, `AGI`, `VIT`, `INT`, `PER`), unlock 160+ Vault artifacts and UI skins, maintain streaks, survive Penalty Quests, and climb the Global Hunter Association Rankings.

---

## 2. Visual Identity & Manhwa Design System (Zero-Emoji Mandate)

### 2.1 Aesthetic Direction
* **Tone:** Minimalist, tactical, dark-futuristic arcane HUD. High contrast, razor-sharp edges, chamfered corners (`clip-path`), subtle scanlines, and chromatic aberration on critical alerts.
* **Strict Zero-Emoji Policy:** No Unicode emojis are permitted anywhere in the UI, notifications, or database seed data. Every icon, rank crest, weapon, potion, and status indicator must be rendered via **bespoke monochrome/duotone inline SVGs** with glowing CSS `drop-shadow` filters or procedural HTML5 Canvas shaders.

### 2.2 Color Palette Specification (Manhwa-Accurate)

| Token Name | Hex Code | RGB / Alpha | Usage & Narrative Context |
| :--- | :--- | :--- | :--- |
| `--bg-abyss-void` | `#04060A` | `rgb(4, 6, 10)` | Primary viewport background (deep dungeon darkness) |
| `--bg-system-panel` | `#0A111F` | `rgba(10, 17, 31, 0.88)` | Translucent System window background with `backdrop-filter: blur(12px)` |
| `--sys-blue-core` | `#00E5FF` | `rgb(0, 229, 255)` | Classic Phase-1 System border, active text glow, primary HUD accents |
| `--sys-blue-deep` | `#0066FF` | `rgb(0, 102, 255)` | Outer bloom aura, secondary borders, progress bar fills |
| `--monarch-violet` | `#8A2BE2` | `rgb(138, 43, 226)` | Phase-2 "Awakened / Shadow Monarch" theme primary accent |
| `--monarch-glow` | `#C77DFF` | `rgb(199, 125, 255)` | High-tier skill highlights, Shadow Extraction UI, S-Rank aura |
| `--penalty-crimson` | `#FF003C` | `rgb(255, 0, 60)` | Penalty Zone UI override, Red Gate lock screen, failed quest alerts |
| `--loot-mythic-gold` | `#FFB703` | `rgb(255, 183, 3)` | Legendary/Mythic loot drops, S-Rank insignias, Level-Up flare |
| `--text-primary` | `#F0F6FC` | `rgb(240, 246, 252)` | Crisp holographic white-blue body and header typography |
| `--text-muted` | `#6E85A6` | `rgb(110, 133, 166)` | Inactive labels, historical logs, metadata |

### 2.3 Typography System
* **System Headers & Alerts (`--font-display`):** `Rajdhani` or `Orbitron` (Uppercase, `letter-spacing: 0.14em`, `font-weight: 700`). Used for `[NOTICE]`, `[QUEST INFO]`, `[LEVEL UP!]`, and Rank titles.
* **UI Body & Quest Descriptions (`--font-sans`):** `Space Grotesk` or `Inter` (`font-weight: 400/500`). Clean, geometric, highly legible on mobile screens.
* **Tactical Numerals, Timers & Stats (`--font-mono`):** `JetBrains Mono` (`font-variant-numeric: tabular-nums`). Used for countdown timers, $\text{XP}$ bars, stat counters, and leaderboard ranks.

### 2.4 Custom SVG & Procedural Graphic Specification (Replacing All Emojis)
Every visual symbol is constructed using geometric SVG paths (`stroke-width="1.5"`, `stroke="currentColor"`, `fill="none"`) enhanced with SVG `<filter id="system-glow">`:
1. **System Alert Exclamation Mark:** A sharp diamond-headed exclamation frame enclosed within a double hexagon (`[!]`).
2. **Quest Type Icons:**
   * *Calisthenics / STR:* Angular twin-blade gauntlet wireframe.
   * *Gym / VIT:* Hexagonal heavy barbell plate with circuit lines.
   * *Running / AGI:* Winged boot silhouette with velocity chevrons.
   * *Study / INT:* Arcane geometric tome with an illuminated eye rune.
   * *Focus / PER:* Concentric Dungeon Gate portal ring with locking pins.
3. **5-Axis Stat Radar Chart:** Drawn dynamically via `<svg>` polygon coordinates mapping `STR`, `AGI`, `VIT`, `INT`, and `PER` inside an arcane pentagram grid.
4. **Holographic Panel Framing:** All cards use CSS `clip-path: polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))` with glowing corner bracket SVG overlays.

---

## 3. Mathematical Progression Engine & 22-Tier Rank Hierarchy

### 3.1 Experience Points ($\text{XP}$) & Leveling Curve
Players start at **Level 1** (`E-Rank Tier IV`). There is no hard level cap, though **Level 100** marks the threshold of the **Shadow Monarch**. The $\text{XP}$ required to advance from level $L$ to $L+1$ follows a polynomial-exponential hybrid curve to ensure fast early dopamine and deep late-game prestige:

$$\text{XP}_{\text{req}}(L) = \lfloor 100 \cdot L^{1.65} + 50 \cdot (L - 1) \rfloor$$

* **Level 1 $\rightarrow$ 2:** $100\text{ XP}$ (1–2 Daily Quests)
* **Level 10 $\rightarrow$ 11:** $4,916\text{ XP}$
* **Level 50 $\rightarrow$ 51:** $66,184\text{ XP}$
* **Level 99 $\rightarrow$ 100:** $202,430\text{ XP}$

### 3.2 Quest $\text{XP}$ Payout Formula
When a Player completes a quest $q$, the total $\text{XP}$ earned is computed from base difficulty, duration/volume, current streak multiplier, and equipped Vault relic bonuses:

$$\text{XP}_{\text{earned}}(q) = \left\lfloor \left( B_q \cdot D_q \right) \cdot \left( 1 + \min(0.50, 0.02 \cdot S_{\text{days}}) \right) \cdot \left( 1 + \sum R_{\text{bonus}} \right) \right\rfloor$$

Where:
* $B_q \in \{25, 50, 100, 200, 400\}$ is the base $\text{XP}$ for Quest Rank (`E`, `D`, `C`, `B`, `A/S`).
* $D_q$ is the volume/duration scalar (e.g., $1.0$ for standard preset, up to $2.5$ for 90+ minute Focus Gate raids).
* $S_{\text{days}}$ is the active consecutive daily streak (caps at a $+50\%$ streak bonus at $25\text{ days}$).
* $\sum R_{\text{bonus}}$ is the sum of passive $\text{XP}$ buffs from equipped Hunter's Vault items (capped at $+25\%$).

### 3.3 The 22 Hunter Tiers (E-Rank to Monarch)
Progression across the **22 Tiers** requires both reaching the minimum Level threshold **and** completing a special **Rank Advancement Dungeon (Promotion Exam)**—a high-intensity challenge Day where no quests can be skipped.

| Tier # | Rank Code | Official System Title | Min Level | Min Streak | Aura Color |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `E-IV` | E-Rank Initiate ("Weakest Hunter") | Lv. 1 | 0 Days | Dim Slate `#4A5568` |
| **02** | `E-III` | E-Rank Porter | Lv. 3 | 2 Days | Dim Slate `#4A5568` |
| **03** | `E-II` | E-Rank Survivor | Lv. 6 | 4 Days | Steel Blue `#3182CE` |
| **04** | `E-I` | E-Rank Awakened | Lv. 9 | 7 Days | Steel Blue `#3182CE` |
| **05** | `D-IV` | D-Rank Rookie | Lv. 12 | 10 Days | Cyan Glow `#00B4D8` |
| **06** | `D-III` | D-Rank Raider | Lv. 16 | 14 Days | Cyan Glow `#00B4D8` |
| **07** | `D-II` | D-Rank Vanguard | Lv. 20 | 18 Days | Cyan Glow `#00B4D8` |
| **08** | `D-I` | D-Rank Dungeon Striker | Lv. 24 | 21 Days | System Blue `#00E5FF` |
| **09** | `C-IV` | C-Rank Hunter | Lv. 28 | 28 Days | System Blue `#00E5FF` |
| **10** | `C-III` | C-Rank Assault Specialist | Lv. 33 | 35 Days | Cobalt Flare `#0077FF` |
| **11** | `C-II` | C-Rank Strike Captain | Lv. 38 | 42 Days | Cobalt Flare `#0077FF` |
| **12** | `C-I` | C-Rank Gate Breaker | Lv. 43 | 50 Days | Emerald Pulse `#10B981` |
| **13** | `B-IV` | B-Rank Elite | Lv. 48 | 60 Days | Emerald Pulse `#10B981` |
| **14** | `B-III` | B-Rank Guild Officer | Lv. 53 | 70 Days | Royal Indigo `#6366F1` |
| **15** | `B-II` | B-Rank Red Gate Survivor | Lv. 58 | 80 Days | Royal Indigo `#6366F1` |
| **16** | `B-I` | B-Rank High Awakened | Lv. 64 | 90 Days | Violet Surge `#8B5CF6` |
| **17** | `A-III` | A-Rank Master Hunter | Lv. 70 | 105 Days | Violet Surge `#8B5CF6` |
| **18** | `A-II` | A-Rank Guild Master | Lv. 76 | 120 Days | Crimson Flame `#F43F5E` |
| **19** | `A-I` | A-Rank Peak Awakened | Lv. 82 | 140 Days | Crimson Flame `#F43F5E` |
| **20** | `S-RANK` | S-Rank Immeasurable | Lv. 88 | 165 Days | Sovereign Gold `#FFB703` |
| **21** | `NAT-S` | National Level Hunter | Lv. 94 | 200 Days | Astral Platinum `#E2E8F0` |
| **22** | `MONARCH` | Shadow Monarch (Sovereign) | Lv. 100+ | 250 Days | Abyssal Purple `#9D4EDD` |

### 3.4 The 5 Core Hunter Attributes
Every quest completion increments its linked primary stat by $+1$ to $+3$ automatically, and every Level Up grants **$+5\text{ Unallocated Ability Points (AP)}$** for manual customization:
* **`STR` (Strength):** Grown via Gym, Weightlifting, and Calisthenics quests. Increases Base $\text{XP}$ from physical quests by $+0.2\%$ per point.
* **`AGI` (Agility):** Grown via Running, Cardio, HIIT, and Mobility quests. Reduces cooldown on Daily Quest re-rolls and speeds up animation cadences.
* **`VIT` (Vitality):** Grown via Sleep consistency, Hydration, Stretching, and Streak preservation. Reduces **Fatigue** accumulation and softens Penalty Zone severity.
* **`INT` (Intelligence):** Grown via Study, Coding, Reading, and Skill-acquisition quests. Increases $\text{XP}$ gained from Focus Gate Pomodoro sessions by $+0.25\%$ per point.
* **`PER` (Perception):** Grown via Meditation, Journaling, and zero-distraction Dark Lock sessions. Increases Loot Drop rarity probability by $+0.15\%$ per point.

---

## 4. Daily Quests, Fast Logging & The Penalty Zone Engine

### 4.1 Quest Presets & Modular Builder
Players can operate in two modes or combine both:
1. **The Canonical System Preset ("Preparation to Become Strong"):**
   * Push-ups: `0 / 100` (Scales by Rank: E-Rank starts at `25`, S-Rank at `100+`)
   * Sit-ups / Core: `0 / 100`
   * Squats: `0 / 100`
   * Running: `0 / 10 km` (Scales from `2 km` at E-Rank to `10 km` at A/S-Rank)
2. **Custom Quest Forging & Fast Templates:**
   * **Categories:** `CALISTHENICS` | `GYM` | `RUNNING` | `STUDY` | `FOCUS` | `HABIT`
   * **Tracking Modes:**
     * *Counter / Reps Mode:* Fast $+1$, $+5$, $+10$, $+25$, and `MAX` quick-tap HUD buttons so logging mid-workout takes $<1.5\text{ seconds}$.
     * *Duration Mode:* Linked directly to the **Focus Gate** timer.
     * *Binary Check Mode:* Hold-to-confirm holographic seal (prevents accidental taps; fills a glowing cyan border over $0.8\text{ seconds}$ with Web Audio API sci-fi chime).

### 4.2 Streaks, Midnight Evaluation & The Penalty Zone
At `00:00:00` local Player time, the System evaluates the Daily Quest log.

```
[SYSTEM WARNING]
FAILURE TO COMPLETE THE DAILY QUEST WILL RESULT IN AN APPROPRIATE PENALTY.
TIME REMAINING: 02:14:55
```

#### Penalty Mode Options (Configurable in System Settings)
* **Standard Accountability Mode (Optional Penalty):** Missing a mandatory Daily Quest resets the daily multiplier growth by $-5\text{ days}$ (unless a *Rune of Protection* is consumed) and issues an optional **Redemption Penalty Quest** to recover the lost streak within 24 hours.
* **Hardcore Manhwa Mode (Mandatory Penalty Zone):**
  If mandatory Daily Quests remain incomplete at midnight:
  1. **UI Override:** The entire application shifts from System Blue (`#00E5FF`) to **Penalty Zone Blood Crimson (`#FF003C`)**.
  2. **Vault & Leaderboard Lockout:** The Hunter's Vault, Shop, and standard $\text{XP}$ gains are frozen.
  3. **The Survival Directive ("Survive in the Penalty Zone"):** The Player must complete a System-assigned **Penalty Quest** before regular progression resumes:
     * *Physical Penalty Option:* e.g., `150 Burpees`, `5-Minute Cumulative Plank`, or `3 km Penalty Run`.
     * *Focus Penalty Option:* Complete a mandatory **45-Minute Dark Lock Focus Gate** at $0\text{ XP}$ payout just to clear the `[DEBUFF: EXHAUSTED]` status and restore the System.

---

## 5. App Blocking + Focus Gate ("Dark Lock" & Pomodoro Raids)

### 5.1 Dungeon Gate Focus Architecture
Instead of a plain Pomodoro timer, focus sessions are framed as **Entering a Dungeon Gate**.
* **E-Rank Gate:** $15\text{ min}$ Focus / $3\text{ min}$ Rest
* **C-Rank Gate:** $25\text{ min}$ Focus / $5\text{ min}$ Rest (Classic Pomodoro)
* **A-Rank Gate:** $50\text{ min}$ Focus / $10\text{ min}$ Rest
* **S-Rank Red Gate (Deep Work):** $90\text{ min}$ unbroken Focus (Cannot be paused without forfeiting all Gate loot).

### 5.2 "Dark Lock" Distraction Blocking Mechanics
When **Dark Lock** is toggled ON and the Player steps through the Gate:
1. **Fullscreen & WakeLock Engagement:** The web app requests `document.documentElement.requestFullscreen()` and `navigator.wakeLock.request('screen')` so the mobile or desktop screen displays a stark, minimal glowing Dungeon Timer HUD.
2. **Focus Integrity Telemetry (`VisibilityChange` & `Window Blur`):**
   * If the Player switches tabs, minimizes the browser, or opens another mobile app (`document.hidden === true`), a **15-second Grace Countdown** triggers with an audio-visual pulse.
   * Failing to return within 15 seconds triggers a **Gate Breach (`[FOCUS BROKEN]`)**, corrupting the session's bonus Loot Box or reducing $\text{XP}$ yield by $50\%$.
3. **Companion Browser Extension / PWA Focus Shield:**
   * Includes a lightweight Chrome/Firefox Manifest V3 declarativeNetRequest rule specification (and mobile Guided Access / Screen Time shortcut integration) that redirects blacklisted distraction domains (e.g., social feeds, short-form video sites) to a custom System Lock Screen:
     `[ACCESS DENIED BY THE SYSTEM: COMPLETE YOUR ACTIVE QUEST FIRST]`.

---

## 6. Hunter's Vault & Rewards (160+ Item Loot Matrix)

Completing Daily Quests, clearing Focus Gates, and hitting streak milestones reward **Gold**, **Essence Stones**, and **Random Cursed/Blessed Boxes**. The Hunter's Vault houses **165 distinct collectible items** across 5 categories and 5 rarity tiers (`COMMON`, `RARE`, `HEROIC`, `LEGENDARY`, `MYTHIC`).

### 6.1 Category Breakdown (165 Total Unlocks)

#### A. Hunter Weapons & Relics (45 Items — Equip up to 2 for Passive Buffs)
* **E–C Rank Relics (15 Items):** *Steel Rations Dagger*, *Kim Sangshik's Broadsword*, *Kasaka's Venom Fang* (`+3% STR XP`), *Rasaka's Scale Shield* (`-10% Fatigue build-up`), *High Orc Waraxe*, *Rock Golem Core*, *Assassin's Cloak Fragment*, etc.
* **B–A Rank Relics (18 Items):** *Knight Killer* (`+5% Gym XP`), *Baruka's Dagger* (`+6% AGI XP`), *Orb of Avarice* (`+8% INT/Study XP`), *Vulcan's Horn*, *Metus's Soul Lantern*, *Kargalgan's Tusk Necklace*, *Demon Monarch's Ring*, *Demon Monarch's Earring*, *Demon Monarch's Necklace* (Set bonus: `+10% All Stats`), etc.
* **S-Rank & Mythic Relics (12 Items):** *Demon King's Shortsword (Dual)*, *Demon King's Longsword (Storm of White Flames)*, *Kamish's Wrath* (`+15% All Quest XP`), *Shadow Monarch's Mantle*, *Fragment of Brilliant Light's Spear*, *Cup of Reincarnation*, *Ruler's Authority Signet*, *Heart of the Black Shadow*.

#### B. Consumables, Keys & Runes (30 Items — Active Utility)
* **Dungeon Keys (8 Items):** *E-Rank Subway Key*, *C-Rank Lizardmen Den Key*, *A-Rank Demon Castle Key*, *S-Rank Jeju Island Raid Key*, *Red Gate Key*, *Double Dungeon Cartenon Key*, *Architect's Trial Key*, *Instant Dungeon Reset Key*.
* **Potions & Elixirs (10 Items):** *Low-Grade Healing Potion* (Clears $25\%$ Fatigue), *High-Grade Stamina Potion*, *Kasaka's Venom Elixir* (Permanent $+2\text{ VIT}$, $-1\text{ STR}$ lore item), *Holy Water of Life* (Repairs a broken streak up to 48 hours late), *Purification Stone* (Cancels an active Penalty Zone once).
* **Skill Runes (12 Items):** *Rune: Stealth*, *Rune: Bloodlust*, *Rune: Sprint*, *Rune: Dagger Throw*, *Rune: Mutilation*, *Rune: Ruler's Touch*, *Rune: Shadow Exchange*, *Rune: Domain of the Monarch* (`+20% Focus Gate XP for 24h`).

#### C. System UI Skins & Hologram Themes (25 Items — Visual Customization)
Unlocks full CSS Variable theme overrides, custom SVG corner borders, and sound synthesis profiles:
1. *Classic System Cyan* (Default)
2. *Cartenon Temple Stone & Gold*
3. *Penalty Desert Blood Red*
4. *Kasaka's Poison Teal*
5. *Red Gate Frozen Tundra*
6. *Demon Castle Hellfire Amber*
7. *Shadow Extraction Abyssal Violet*
8. *Hunter Association Executive White/Gold*
9. *Ahjin Guild Tactical Obsidian*
10. *Jeju Island Ant Queen Bio-Crimson*
11. *Architect's Golden Matrix*
12. *Frost Monarch Glacial Blue*
13. *Beast Monarch Savage Ochre*
14. *Plague Monarch Toxic Emerald*
15. *Iron Body Monarch Titanium*
16. *Monarch of Beginning Emerald Void*
17. *Monarch of Transfiguration Arcane Magenta*
18. *Monarch of White Flames Plasma Silver*
19. *Dragon Monarch Destruction Scarlet*
20. *Ruler's Celestial Radiance*
21. *Ashborn's True Shadow Sovereign*
22. *Terminal Wireframe Green (Retro HUD)*
23. *Stealth Mode Ultra-OLED Pitch Black*
24. *Double Dungeon Eclipse*
25. *Cup of Reincarnation Chrono-Gold*

#### D. Hunter Titles & Insignia Badges (40 Items — Displayed on Global Leaderboard)
* **Progression & Combat Titles (20):** *The Weakest Hunter of All Mankind*, *Wolf Slayer*, *Calamity Survivor*, *One Who Overcame Adversity*, *Spider Boss Executioner*, *Cerberus Gatekeeper*, *Necromancer*, *Shadow Monarch*, *Demon Castle Conqueror*, *Jeju Island Savior*, *Giant Slayer*, *Guild Master of Ahjin*, *King of the Dead*, *Ninth Sovereign*, *Architect Defier*, etc.
* **Consistency & Focus Titles (20):** *7-Day Awakening*, *14-Day Iron Will*, *30-Day Unbroken*, *60-Day Relentless*, *100-Day Centurion*, *365-Day Immortal*, *Deep Work Sovereign*, *100-Hour Gate Raider*, *500-Hour Void Walker*, *Dawn Grinder (5 AM Quest Cleared)*, *Midnight Survivor*, *Penalty Zone Veteran*, etc.

#### E. Shadow Army Summons & Avatar Frames (25 Items — Collectible Companions)
At **Level 40 (Job Change Quest: Necromancer $\rightarrow$ Shadow Monarch)**, the command **`[ARISE]`** unlocks. Players can extract and level up 25 Shadow Soldiers (rendered as intricate SVG geometric crests and animated aura frames around their profile):
* *Shadow Infantry*, *Shadow Blade*, *Shadow Mage*, *Shadow Bear*, *Fang (High Orc Shaman)*, *Iron*, *Tank*, *Kaisel (Wyvern)*, *Jima*, *Greed*, *Igris the Bloodred*, *Beru the Ant King*, *Bellion the Grand Marshal*, and 12 Rank-specific Holographic Avatar Borders.

---

## 7. Global Leaderboard & Social Accountability

### 7.1 Hunter Association Rankings
To prevent high-level veterans from permanently locking out new Players, the Leaderboard operates across **three concurrent views**:
1. **Seasonal Vanguard Board (Weekly/Monthly Reset):** Ranks Players by **Hunter Rating Score ($\text{HRS}$)** earned during the current season.
2. **Division Bracket League:** Matches Players strictly against 50 peers within their exact Rank Tier (e.g., `C-Rank Division III`). Top 10 promote at week's end; bottom 5 face demotion danger.
3. **All-Time Hall of Monarchs:** Permanent global ranking by Total Level, Total Streak, and Combat Power.

### 7.2 Anti-Cheat & Consistency Weighting Formula
To ensure a user cannot spam 50 trivial 1-minute quests to beat someone doing honest workouts and deep focus, the Leaderboard **Hunter Rating Score ($\text{HRS}$)** weights consistency, Focus Gate integrity, and daily cap limits:

$$\text{HRS} = \left( \sum_{i=1}^{N_{\text{capped}}} \text{XP}_i \right) \cdot \left( 1 + \frac{\ln(S_{\text{days}} + 1)}{4} \right) + \left( 15 \cdot M_{\text{focus}} \right) - \left( 250 \cdot P_{\text{failed}} \right)$$

Where:
* $N_{\text{capped}}$ limits daily $\text{XP}$-yielding quests to a maximum of **6 Primary Quests + 4 Hrs of Focus Gates per 24 hours** (preventing fake tap-spamming).
* $M_{\text{focus}}$ is verified, unbroken Dark Lock Focus minutes.
* $P_{\text{failed}}$ is the number of unresolved Penalty Zone infractions in the current cycle.

---

## 8. Responsive UI/UX Wireframe Blueprints (Mobile-First, Desktop-Compatible)

### 8.1 Mobile Viewport (`375px - 767px`) — Single-Handed Tactical HUD
Designed like the floating vertical translucent window Sung Jin-Woo sees in the manhwa. Bottom navigation dock uses geometric SVG glyphs.

```
+---------------------------------------------------+
| [!] SYSTEM STATUS          [STREAK: 14D] [GOLD:420]|
|---------------------------------------------------|
|  PLAYER: JIN-WOO               RANK: [ C-RANK II ]|
|  TITLE:  ONE WHO OVERCAME ADVERSITY               |
|  LV. 38  [================------] 24,500/31,200 XP|
|  FATIGUE: 18%                  AP AVAILABLE: [+5] |
+---------------------------------------------------+
| [QUEST INFO: DAILY PREPARATION TO BECOME STRONG]  |
|                                                   |
|  [ ] PUSH-UPS              [ 75 / 100 ] [+10][MAX]|
|      [==================------]  +50 XP  [STR +1] |
|                                                   |
|  [X] SQUATS                [100 / 100 ] [COMPLETE]|
|      [========================]  +50 XP  [VIT +1] |
|                                                   |
|  [ ] DEEP STUDY GATE       [ 25 / 50m ] [ENTER >>]|
|      [============------------] +120 XP  [INT +2] |
|                                                   |
|  +---------------------------------------------+  |
|  |       [ + FORGE CUSTOM DAILY QUEST ]        |  |
|  +---------------------------------------------+  |
|                                                   |
|  [WARNING: INCOMPLETE QUESTS TRIGGER PENALTY AT   |
|   00:00:00. REMAINING TIME: 04:12:09]             |
+---------------------------------------------------+
|  [QUESTS]   [STATUS]   [GATE/LOCK]  [VAULT] [RANK]|
+---------------------------------------------------+
```

### 8.2 Desktop Viewport (`1024px - 1920px+`) — 3-Column Command Center
Expands into a multi-panel holographic cockpit without losing the vertical System window aesthetic.

```
+--------------------------------------------------------------------------------------------------+
| [SYSTEM OS v2.4] // HUNTER ASSOCIATION NETWORK          [THEME: SHADOW MONARCH] [STREAK: 14 DAYS]|
+-----------------------------+--------------------------------------+-----------------------------+
| COL 1: HUNTER STATUS WINDOW | COL 2: ACTIVE QUESTS & FOCUS GATE    | COL 3: VAULT & LEADERBOARD  |
|                             |                                      |                             |
|  [HEXAGONAL AVATAR CREST]   |  [TAB: DAILY QUESTS | DUNGEON GATE]  |  [EQUIPPED RELICS (2/2)]    |
|  LV. 38 // C-RANK TIER II   |                                      |  1. KASAKA'S VENOM FANG     |
|  "Wolf Slayer"              |  +--------------------------------+  |  2. ORB OF AVARICE          |
|                             |  | 01 // CALISTHENICS: PUSH-UPS   |  |                             |
|  HP: 4,250    MP: 890       |  | Progress: 75/100  [+5][+25][V] |  |  [RECENT LOOT DROPS]        |
|  FATIGUE: 18%               |  +--------------------------------+  |  > [BLESSED RANDOM BOX x1]  |
|                             |  | 02 // FOCUS GATE: SYSTEM DESIGN|  |  > [RUNE: STEALTH]          |
|  --- ATTRIBUTES (AP: 5) --- |  | 50:00 A-RANK GATE [DARK LOCK]  |  |                             |
|  STR: 64 [+]   INT: 58 [+]  |  +--------------------------------+  |  [C-RANK DIVISION II BOARD] |
|  AGI: 51 [+]   PER: 49 [+]  |                                      |  #01 HUNTER_CHA   14,920 HRS|
|  VIT: 60 [+]                |  [QUICK PRESETS: GYM | RUN | STUDY]  |  #02 JIN-WOO (YOU)14,410 HRS|
|                             |                                      |  #03 BAEK_YOON    13,880 HRS|
|  [5-AXIS SVG RADAR CHART]   |  [PENALTY TIMER: 04:12:09 REMAINING] |  #04 HWANG_DONG   12,100 HRS|
+-----------------------------+--------------------------------------+-----------------------------+
```

---

## 9. Technical Architecture & Data Schema

### 9.1 Recommended Tech Stack
* **Frontend Framework:** React 19 + TypeScript + Vite (or Next.js App Router for SSR + API routes).
* **Styling & Holographic Effects:** Tailwind CSS + Custom CSS Variables for dynamic skin switching (`data-theme="system-blue" | "monarch-violet" | "penalty-crimson"`) + SVG Filters (`feGaussianBlur`, `feMerge`) for authentic manhwa neon bloom.
* **Audio Engine:** Native **Web Audio API** procedural synthesizer (zero external `.mp3` dependencies required). Generates metallic System window open chimes, quest check pulses, level-up sub-bass drops, and Penalty Zone klaxons in real time.
* **State & Persistence:** Zustand / Redux Toolkit with `IndexedDB` / `localStorage` offline-first sync (plus Supabase / PostgreSQL backend for Global Leaderboard and cross-device Hunter Profile sync).

### 9.2 Core Database / State Schema (TypeScript Interfaces)

```typescript
export type HunterRankTier =
  | 'E-IV' | 'E-III' | 'E-II' | 'E-I'
  | 'D-IV' | 'D-III' | 'D-II' | 'D-I'
  | 'C-IV' | 'C-III' | 'C-II' | 'C-I'
  | 'B-IV' | 'B-III' | 'B-II' | 'B-I'
  | 'A-III' | 'A-II' | 'A-I'
  | 'S-RANK' | 'NAT-S' | 'MONARCH';

export type StatType = 'STR' | 'AGI' | 'VIT' | 'INT' | 'PER';
export type QuestCategory = 'CALISTHENICS' | 'GYM' | 'RUNNING' | 'STUDY' | 'FOCUS' | 'PENALTY';

export interface HunterProfile {
  id: string;
  hunterName: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  rankTierIndex: number; // 0 to 21 (22 Tiers)
  rankCode: HunterRankTier;
  activeTitle: string;
  activeSkinId: string;
  equippedRelicIds: [string | null, string | null];
  activeShadowId: string | null;
  gold: number;
  essenceStones: number;
  unallocatedAp: number;
  fatigue: number; // 0 to 100
  streakDays: number;
  lastEvaluatedDate: string; // YYYY-MM-DD
  penaltyMode: 'OPTIONAL' | 'HARDCORE';
  inPenaltyZone: boolean;
  stats: Record<StatType, number>;
}

export interface QuestItem {
  id: string;
  title: string;
  category: QuestCategory;
  difficulty: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  primaryStat: StatType;
  currentProgress: number;
  targetProgress: number;
  unit: 'REPS' | 'KM' | 'MINS' | 'SETS' | 'CHECK';
  xpReward: number;
  goldReward: number;
  isCompleted: boolean;
  isMandatory: boolean;
  isPenaltyQuest?: boolean;
}

export interface VaultItem {
  id: string; // 165 unique IDs
  name: string;
  category: 'RELIC' | 'CONSUMABLE' | 'SKIN' | 'TITLE' | 'SHADOW';
  rarity: 'COMMON' | 'RARE' | 'HEROIC' | 'LEGENDARY' | 'MYTHIC';
  loreDescription: string;
  buffDescription: string;
  svgIconKey: string;
  unlocked: boolean;
  unlockRequirementText: string;
}
```

---

## 10. Phased Implementation Roadmap

### Phase 1: Core System Engine & Manhwa HUD Shell
* Build the translucent System Window container with chamfered corners, glowing borders, scanline shaders, and Web Audio API procedural sound effects.
* Implement the custom SVG Iconography Library (zero emojis) and the 5-Axis SVG Stat Radar Chart.
* Build the Leveling & 22-Tier Rank Progression Engine with real-time $\text{XP}$ bar animations and `[LEVEL UP!]` modal interrupts.

### Phase 2: Daily Quests, Fast Logging & Penalty Zone
* Implement the "Preparation to Become Strong" preset and the Custom Quest Builder (Calisthenics, Gym, Running, Study, Focus).
* Add 1-tap fast increment buttons (`+1`, `+5`, `+10`, `MAX`) and hold-to-seal completion interactions.
* Build the Midnight Evaluation countdown clock and the **Penalty Zone** Crimson UI override with survival redemption quests.

### Phase 3: Dark Lock & Focus Gate Pomodoro
* Build the Dungeon Gate timer (`E-Rank` to `S-Rank Red Gate`).
* Integrate Fullscreen API, Screen WakeLock API, and `visibilitychange` tab-leave detection with a 15-second grace warning before Gate Breach.

### Phase 4: Hunter's Vault (160+ Items), Shadow Army & Global Leaderboard
* Populate the 165-item catalog across Relics, Consumables, UI Skins, Titles, and Shadow Summons, plus the Loot Box opening sequence and Gold/Essence Shop.
* Build the Hunter Association Leaderboard with Division Brackets,Seasonal Hunter Rating Scores ($\text{HRS}$), and live theme switching.
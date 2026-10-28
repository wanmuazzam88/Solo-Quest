/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Static Data
   22 Hunter Tiers, difficulty tables, Dungeon Gates and the 165-item Vault.
   Zero-emoji mandate: every visual is referenced by an SVG icon key.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  /* ---------- 22 Hunter Tiers (plan section 3.3) ---------- */
  S.RANKS = [
    ['E-IV', 'E-Rank Initiate', 'Weakest Hunter', 1, 0, '#4A5568'],
    ['E-III', 'E-Rank Porter', '', 3, 2, '#4A5568'],
    ['E-II', 'E-Rank Survivor', '', 6, 4, '#3182CE'],
    ['E-I', 'E-Rank Awakened', '', 9, 7, '#3182CE'],
    ['D-IV', 'D-Rank Rookie', '', 12, 10, '#00B4D8'],
    ['D-III', 'D-Rank Raider', '', 16, 14, '#00B4D8'],
    ['D-II', 'D-Rank Vanguard', '', 20, 18, '#00B4D8'],
    ['D-I', 'D-Rank Dungeon Striker', '', 24, 21, '#00E5FF'],
    ['C-IV', 'C-Rank Hunter', '', 28, 28, '#00E5FF'],
    ['C-III', 'C-Rank Assault Specialist', '', 33, 35, '#0077FF'],
    ['C-II', 'C-Rank Strike Captain', '', 38, 42, '#0077FF'],
    ['C-I', 'C-Rank Gate Breaker', '', 43, 50, '#10B981'],
    ['B-IV', 'B-Rank Elite', '', 48, 60, '#10B981'],
    ['B-III', 'B-Rank Guild Officer', '', 53, 70, '#6366F1'],
    ['B-II', 'B-Rank Red Gate Survivor', '', 58, 80, '#6366F1'],
    ['B-I', 'B-Rank High Awakened', '', 64, 90, '#8B5CF6'],
    ['A-III', 'A-Rank Master Hunter', '', 70, 105, '#8B5CF6'],
    ['A-II', 'A-Rank Guild Master', '', 76, 120, '#F43F5E'],
    ['A-I', 'A-Rank Peak Awakened', '', 82, 140, '#F43F5E'],
    ['S-RANK', 'S-Rank Immeasurable', '', 88, 165, '#FFB703'],
    ['NAT-S', 'National Level Hunter', '', 94, 200, '#E2E8F0'],
    ['MONARCH', 'Shadow Monarch (Sovereign)', '', 100, 250, '#9D4EDD']
  ].map(function (r, i) {
    var code = r[0];
    var letter = (code === 'S-RANK' || code === 'NAT-S' || code === 'MONARCH') ? 'S' : code.charAt(0);
    return { index: i, code: code, title: r[1], sub: r[2], minLevel: r[3], minStreak: r[4], color: r[5], letter: letter };
  });

  S.rankLabel = function (r) {
    if (r.code === 'S-RANK') return 'S-RANK';
    if (r.code === 'NAT-S') return 'NATIONAL LEVEL';
    if (r.code === 'MONARCH') return 'SHADOW MONARCH';
    var p = r.code.split('-');
    return p[0] + '-RANK TIER ' + p[1];
  };

  /* ---------- Quest difficulty table (plan 3.2) ---------- */
  S.DIFF = {
    E: { base: 25, gold: 10, stat: 1, fatigue: 3, color: '#9AA8BC' },
    D: { base: 50, gold: 20, stat: 1, fatigue: 4, color: '#3B9EFF' },
    C: { base: 100, gold: 40, stat: 2, fatigue: 6, color: '#00E5FF' },
    B: { base: 200, gold: 80, stat: 2, fatigue: 8, color: '#10B981' },
    A: { base: 400, gold: 150, stat: 3, fatigue: 10, color: '#B26BFF' },
    S: { base: 400, gold: 220, stat: 3, fatigue: 12, color: '#FFB703' }
  };

  S.STATS = ['STR', 'AGI', 'VIT', 'INT', 'PER'];
  S.STAT_INFO = {
    STR: { name: 'Strength', icon: 'gauntlet', desc: '+0.2% Base XP on physical quests per point.' },
    AGI: { name: 'Agility', icon: 'boot', desc: 'Reduces Bonus Quest re-roll cooldown (2 min per point).' },
    VIT: { name: 'Vitality', icon: 'vit', desc: 'Reduces Fatigue build-up and softens Penalty severity.' },
    INT: { name: 'Intelligence', icon: 'tome', desc: '+0.25% Focus Gate & Study XP per point.' },
    PER: { name: 'Perception', icon: 'eye', desc: '+0.15% Loot rarity probability per point.' }
  };

  S.CATS = {
    CALISTHENICS: { stat: 'STR', icon: 'gauntlet', physical: true, label: 'Calisthenics' },
    GYM: { stat: 'STR', icon: 'barbell', physical: true, label: 'Gym' },
    RUNNING: { stat: 'AGI', icon: 'boot', physical: true, label: 'Running' },
    STUDY: { stat: 'INT', icon: 'tome', physical: false, label: 'Study' },
    FOCUS: { stat: 'PER', icon: 'gate', physical: false, label: 'Focus' },
    HABIT: { stat: 'VIT', icon: 'vit', physical: false, label: 'Habit' },
    PENALTY: { stat: 'VIT', icon: 'skull', physical: true, label: 'Penalty' }
  };

  S.UNITS = { REPS: 'reps', KM: 'km', MINS: 'min', SETS: 'sets', STEPS: 'steps', CHECK: '' };

  /* ---------- Dungeon Gates (plan 5.1) ---------- */
  S.GATES = [
    { id: 'E', name: 'E-Rank Gate', focus: 15, rest: 3, scalar: 1.2, diff: 'E', pausable: true, color: '#3182CE', essence: 1, lootChance: 0.25, desc: 'Short skirmish. Ideal warm-up.' },
    { id: 'C', name: 'C-Rank Gate', focus: 25, rest: 5, scalar: 1.5, diff: 'C', pausable: true, color: '#00E5FF', essence: 2, lootChance: 0.4, desc: 'Classic Pomodoro raid.' },
    { id: 'A', name: 'A-Rank Gate', focus: 50, rest: 10, scalar: 2.0, diff: 'A', pausable: true, color: '#8B5CF6', essence: 4, lootChance: 0.65, desc: 'Extended deep work assault.' },
    { id: 'S', name: 'S-Rank Red Gate', focus: 90, rest: 0, scalar: 2.5, diff: 'S', pausable: false, color: '#FF003C', essence: 8, lootChance: 1, desc: '90 min unbroken. Pausing is impossible.' }
  ];
  S.PENALTY_GATE = { id: 'P', name: 'Penalty Zone Gate', focus: 45, rest: 0, scalar: 0, diff: 'E', pausable: false, color: '#FF003C', essence: 0, lootChance: 0, desc: 'Survive. 0 XP.' };

  S.PENALTY_PALETTE = { a: '#FF003C', d: '#8A0020', g: '#FF6B88', bg: '#080203', panel: '28,6,10', wave: 'sawtooth' };

  S.RARITIES = ['COMMON', 'RARE', 'HEROIC', 'LEGENDARY', 'MYTHIC'];
  S.RARITY_COLOR = { COMMON: '#9AA8BC', RARE: '#3B9EFF', HEROIC: '#B26BFF', LEGENDARY: '#FFB703', MYTHIC: '#FF3D6E' };
  S.DUP_ESSENCE = { COMMON: 2, RARE: 5, HEROIC: 10, LEGENDARY: 25, MYTHIC: 60 };

  /* ---------- Buff text helper ---------- */
  var TARGET_LABEL = { ALL: 'All Quest', FOCUS: 'Focus Gate', STUDY: 'Study', GYM: 'Gym', CALISTHENICS: 'Calisthenics', RUNNING: 'Running', HABIT: 'Habit', STR: 'STR', AGI: 'AGI', VIT: 'VIT', INT: 'INT', PER: 'PER' };
  S.buffText = function (b) {
    if (!b || !b.length) return '';
    return b.map(function (x) {
      var pct = Math.round(Math.abs(x.v) * 100);
      if (x.k === 'xp') return '+' + pct + '% ' + TARGET_LABEL[x.t] + ' XP';
      if (x.k === 'fatigue') return '-' + pct + '% Fatigue build-up';
      if (x.k === 'gold') return '+' + pct + '% Gold';
      if (x.k === 'loot') return '+' + pct + '% Loot rarity';
      return '';
    }).join(' / ');
  };

  var V = [];

  /* ---------- A. Relics (45) ---------- */
  function R(id, name, rarity, icon, b, lore, extra) {
    var it = { id: 'r_' + id, name: name, category: 'RELIC', rarity: rarity, svgIconKey: icon, b: b, loreDescription: lore, unlockRequirementText: 'Drops from Random Boxes.' };
    if (extra) for (var k in extra) it[k] = extra[k];
    it.buffDescription = S.buffText(b) + (it.set ? ' / Set (2 of 3 Demon Monarch pieces): +10% All Quest XP' : '');
    V.push(it);
  }
  // E-C Rank (15)
  R('rations_dagger', 'Steel Rations Dagger', 'COMMON', 'dagger', [{ k: 'xp', t: 'ALL', v: 0.01 }], 'Standard-issue Association blade. Dull, but it has seen more dungeons than you.');
  R('sangshik_sword', "Kim Sangshik's Broadsword", 'COMMON', 'sword', [{ k: 'xp', t: 'STR', v: 0.02 }], 'Heavy, honest steel carried by a veteran E-Rank who never gave up.');
  R('kasaka_fang', "Kasaka's Venom Fang", 'RARE', 'dagger', [{ k: 'xp', t: 'STR', v: 0.03 }], 'Harvested from the blue venom-fanged serpent of the Instant Dungeon.');
  R('rasaka_shield', "Rasaka's Scale Shield", 'RARE', 'shield', [{ k: 'fatigue', v: 0.10 }], 'Overlapping scales that drink the shock of every impact.');
  R('high_orc_axe', 'High Orc Waraxe', 'RARE', 'axe', [{ k: 'xp', t: 'GYM', v: 0.03 }], 'Too heavy for most humans. Lifting it is a workout in itself.');
  R('golem_core', 'Rock Golem Core', 'RARE', 'core', [{ k: 'xp', t: 'VIT', v: 0.03 }], 'A pulsing mana heart, still warm with stubborn endurance.');
  R('assassin_cloak', "Assassin's Cloak Fragment", 'RARE', 'cloak', [{ k: 'xp', t: 'AGI', v: 0.03 }], 'Torn shadow-cloth that makes footsteps soundless.');
  R('rusted_knife', "Rusted Hunter's Knife", 'COMMON', 'dagger', [{ k: 'xp', t: 'ALL', v: 0.01 }], 'Found in a collapsed D-Rank gate. Still sharp enough.');
  R('goblin_staff', 'Goblin Shaman Staff', 'COMMON', 'spear', [{ k: 'xp', t: 'INT', v: 0.02 }], 'Crude totem humming with primitive arcane formulas.');
  R('subway_gauntlets', 'Iron Gauntlets of the Subway', 'COMMON', 'gauntlet', [{ k: 'xp', t: 'CALISTHENICS', v: 0.02 }], 'Dented knuckles from the first gate you ever survived.');
  R('lizard_bracer', "Lizardman's Scale Bracer", 'COMMON', 'shield', [{ k: 'fatigue', v: 0.05 }], 'Cold-blooded resilience bound in leather straps.');
  R('wolf_pelt', 'Steel-Fanged Wolf Pelt', 'RARE', 'cloak', [{ k: 'xp', t: 'RUNNING', v: 0.03 }], 'The pack ran all night. So can you.');
  R('cerberus_collar', 'Cerberus Collar Shard', 'HEROIC', 'necklace', [{ k: 'loot', v: 0.02 }, { k: 'xp', t: 'PER', v: 0.02 }], 'A link from the chain of the Gatekeeper of Hell.');
  R('red_knight_helm', "Red Knight's Helm Fragment", 'RARE', 'shield', [{ k: 'xp', t: 'STR', v: 0.02 }], 'Crimson plate shaved from a loyal knight of the Demon Castle gate.');
  R('hob_drum', 'Hobgoblin War Drum', 'COMMON', 'core', [{ k: 'gold', v: 0.05 }], 'Its rhythm attracts coin and courage alike.');
  // B-A Rank (18)
  R('knight_killer', 'Knight Killer', 'HEROIC', 'dagger', [{ k: 'xp', t: 'GYM', v: 0.05 }], 'A dagger forged to pierce plate armor. Every rep, a little sharper.');
  R('baruka_dagger', "Baruka's Dagger", 'HEROIC', 'dagger', [{ k: 'xp', t: 'AGI', v: 0.06 }], 'Taken from the fastest Ice Elf chieftain. Light as breath.');
  R('orb_avarice', 'Orb of Avarice', 'LEGENDARY', 'orb', [{ k: 'xp', t: 'INT', v: 0.08 }], 'Amplifies every thought. Craves more knowledge, always.');
  R('vulcan_horn', "Vulcan's Horn", 'HEROIC', 'horn', [{ k: 'xp', t: 'STR', v: 0.05 }], 'Torn from the Demon Castle gatekeeper. Still radiates heat.');
  R('metus_lantern', "Metus's Soul Lantern", 'HEROIC', 'lantern', [{ k: 'xp', t: 'FOCUS', v: 0.06 }], 'A lich-light that burns away distraction.');
  R('kargalgan_tusk', "Kargalgan's Tusk Necklace", 'HEROIC', 'necklace', [{ k: 'xp', t: 'ALL', v: 0.03 }], 'Trophy of the High Orc commander. Carries his war cry.');
  R('dm_ring', "Demon Monarch's Ring", 'LEGENDARY', 'ring', [{ k: 'xp', t: 'ALL', v: 0.02 }], 'One of three seals of the Demon Monarch.', { set: 'demon_monarch' });
  R('dm_earring', "Demon Monarch's Earring", 'LEGENDARY', 'ring', [{ k: 'xp', t: 'ALL', v: 0.02 }], 'Whispers forgotten names when worn.', { set: 'demon_monarch' });
  R('dm_necklace', "Demon Monarch's Necklace", 'LEGENDARY', 'necklace', [{ k: 'xp', t: 'ALL', v: 0.02 }], 'The heaviest of the three seals.', { set: 'demon_monarch' });
  R('ice_elf_bow', 'Ice Elf Bow', 'HEROIC', 'bow', [{ k: 'xp', t: 'PER', v: 0.05 }], 'Strung with frozen sinew. Never misses what it sees.');
  R('esil_circlet', "Esil's Horn Circlet", 'HEROIC', 'horn', [{ k: 'xp', t: 'INT', v: 0.05 }], 'Gift of a demon noble daughter. Sharpens the mind.');
  R('snow_bear_gauntlet', 'Snow Bear Gauntlet', 'RARE', 'gauntlet', [{ k: 'xp', t: 'CALISTHENICS', v: 0.04 }], 'Thick-furred fists that never tire of the floor.');
  R('black_heart', 'Black Heart Talisman', 'HEROIC', 'core', [{ k: 'xp', t: 'VIT', v: 0.05 }], 'Beats a second rhythm beside your own.');
  R('bloodred_greatsword', "Blood-Red Commander's Greatsword", 'LEGENDARY', 'sword', [{ k: 'xp', t: 'STR', v: 0.07 }], 'The blade of a knight who waited centuries for a worthy foe.');
  R('frost_crown', 'Frost Elf Crown', 'HEROIC', 'rank', [{ k: 'fatigue', v: 0.15 }], 'Cold clarity that numbs exhaustion.');
  R('noble_signet', "Demon Noble's Signet", 'HEROIC', 'ring', [{ k: 'gold', v: 0.10 }], 'Demon nobility never paid full price.');
  R('radiru_eye', "Radiru's Eye", 'HEROIC', 'eye', [{ k: 'loot', v: 0.03 }], 'Sees the glint of treasure through solid stone.');
  R('ant_carapace', "Ant Soldier's Carapace", 'RARE', 'shield', [{ k: 'xp', t: 'VIT', v: 0.04 }], 'A Jeju Island exoskeleton plate. Nearly indestructible.');
  // S-Rank & Mythic (12)
  R('dk_shortsword', "Demon King's Shortsword (Dual)", 'LEGENDARY', 'sword', [{ k: 'xp', t: 'STR', v: 0.10 }], 'Twin blades of Baran. Lightning dances along the edges.');
  R('dk_longsword', "Demon King's Longsword", 'MYTHIC', 'sword', [{ k: 'xp', t: 'ALL', v: 0.10 }], 'Storm of White Flames. Its swing parts the sky.');
  R('kamish_wrath', "Kamish's Wrath", 'MYTHIC', 'dagger', [{ k: 'xp', t: 'ALL', v: 0.15 }], 'Forged from the fang of the dragon that killed five S-Ranks.');
  R('monarch_mantle', "Shadow Monarch's Mantle", 'MYTHIC', 'cloak', [{ k: 'fatigue', v: 0.25 }, { k: 'xp', t: 'ALL', v: 0.05 }], 'Darkness itself, woven into a cloak.');
  R('light_spear', "Fragment of Brilliant Light's Spear", 'LEGENDARY', 'spear', [{ k: 'xp', t: 'FOCUS', v: 0.12 }], 'A splinter of a Ruler weapon. Focus becomes a beam.');
  R('cup_reincarnation', 'Cup of Reincarnation', 'MYTHIC', 'cup', [{ k: 'xp', t: 'ALL', v: 0.08 }, { k: 'gold', v: 0.20 }], 'Turns back time once. Its residue still bends fortune.');
  R('ruler_signet', "Ruler's Authority Signet", 'LEGENDARY', 'ring', [{ k: 'xp', t: 'AGI', v: 0.10 }], 'Grants the invisible hand that moves the world.');
  R('black_shadow_heart', 'Heart of the Black Shadow', 'MYTHIC', 'core', [{ k: 'xp', t: 'ALL', v: 0.12 }], 'The core of Ashborn himself. It recognizes its new host.');
  R('ant_queen_gland', "Ant Queen's Venom Gland", 'LEGENDARY', 'potion', [{ k: 'xp', t: 'VIT', v: 0.10 }], 'Regenerative essence from the queen of Jeju Island.');
  R('architect_shard', "Architect's Blueprint Shard", 'LEGENDARY', 'tome', [{ k: 'xp', t: 'INT', v: 0.12 }], 'A torn page of the System design itself.');
  R('beru_mandible', "Beru's Mandible", 'LEGENDARY', 'gauntlet', [{ k: 'xp', t: 'CALISTHENICS', v: 0.10 }], 'The ant king gave this willingly. Do not disappoint him.');
  R('antares_scale', "Antares' Draconic Scale", 'MYTHIC', 'shield', [{ k: 'loot', v: 0.08 }, { k: 'xp', t: 'ALL', v: 0.06 }], 'Shed by the King of Dragons. Treasure follows destruction.');

  /* ---------- B. Consumables (30) ---------- */
  function C(id, name, rarity, icon, effect, lore, desc) {
    V.push({ id: 'c_' + id, name: name, category: 'CONSUMABLE', rarity: rarity, svgIconKey: icon, effect: effect, loreDescription: lore, buffDescription: desc, unlockRequirementText: 'Random Boxes or the Shop.' });
  }
  // Dungeon Keys (8)
  C('key_subway', 'E-Rank Subway Key', 'COMMON', 'key', { type: 'dungeon', q: { title: 'Instant Dungeon: Subway — 50 Squats', category: 'CALISTHENICS', target: 50, unit: 'REPS', difficulty: 'E', mode: 'COUNTER' } }, 'Opens the gate that started it all.', 'Spawns an E-Rank Instant Dungeon quest. Clear for a Blessed Box.');
  C('key_lizard', 'C-Rank Lizardmen Den Key', 'RARE', 'key', { type: 'dungeon', q: { title: 'Instant Dungeon: Lizardmen Den — 3 km Run', category: 'RUNNING', target: 3, unit: 'KM', difficulty: 'C', mode: 'COUNTER' } }, 'Smells of swamp and scales.', 'Spawns a C-Rank running dungeon.');
  C('key_castle', 'A-Rank Demon Castle Key', 'HEROIC', 'key', { type: 'dungeon', q: { title: 'Instant Dungeon: Demon Castle — 60 min Deep Study', category: 'STUDY', target: 60, unit: 'MINS', difficulty: 'A', mode: 'DURATION' } }, 'One hundred floors of knowledge await.', 'Spawns an A-Rank study dungeon.');
  C('key_jeju', 'S-Rank Jeju Island Raid Key', 'LEGENDARY', 'key', { type: 'dungeon', q: { title: 'Raid: Jeju Island — 200 Push-ups', category: 'CALISTHENICS', target: 200, unit: 'REPS', difficulty: 'S', mode: 'COUNTER' } }, 'Many S-Ranks never returned.', 'Spawns an S-Rank raid quest.');
  C('key_red', 'Red Gate Key', 'LEGENDARY', 'key', { type: 'dungeon', q: { title: 'Red Gate: Frozen Tundra — 90 min Focus Raid', category: 'FOCUS', target: 90, unit: 'MINS', difficulty: 'S', mode: 'DURATION' } }, 'Once inside, the exit closes.', 'Spawns an S-Rank focus raid.');
  C('key_cartenon', 'Double Dungeon Cartenon Key', 'HEROIC', 'key', { type: 'dungeon', q: { title: 'Double Dungeon: Cartenon Temple — 100 Burpees', category: 'CALISTHENICS', target: 100, unit: 'REPS', difficulty: 'B', mode: 'COUNTER' } }, 'Rule one: worship the god. Rule two: praise the god.', 'Spawns a B-Rank dungeon.');
  C('key_architect', "Architect's Trial Key", 'MYTHIC', 'key', { type: 'dungeon', q: { title: "Architect's Trial — 10 km Run", category: 'RUNNING', target: 10, unit: 'KM', difficulty: 'A', mode: 'COUNTER' } }, 'The designer of the System is watching.', 'Spawns an A-Rank endurance trial.');
  C('key_reset', 'Instant Dungeon Reset Key', 'RARE', 'key', { type: 'dungeon', random: true }, 'The dungeon reshapes itself every time.', 'Spawns a random dungeon scaled to your Rank.');
  // Potions & Elixirs (10)
  C('pot_low', 'Low-Grade Healing Potion', 'COMMON', 'potion', { type: 'fatigue', v: 25 }, 'Tastes like copper and mint.', 'Clears 25% Fatigue.');
  C('pot_mid', 'Mid-Grade Healing Potion', 'RARE', 'potion', { type: 'fatigue', v: 50 }, 'Brewed by Association alchemists.', 'Clears 50% Fatigue.');
  C('pot_stamina', 'High-Grade Stamina Potion', 'HEROIC', 'potion', { type: 'fatigue', v: 100 }, 'Full recovery in one swallow.', 'Clears all Fatigue.');
  C('venom_elixir', "Kasaka's Venom Elixir", 'HEROIC', 'potion', { type: 'stat', changes: { VIT: 2, STR: -1 } }, 'Paralysis first. Immunity after.', 'Permanent +2 VIT, -1 STR.');
  C('holy_water', 'Holy Water of Life', 'LEGENDARY', 'potion', { type: 'streakRepair' }, 'Sought by every guild on the continent.', 'Repairs a broken streak up to 48 hours late.');
  C('purify', 'Purification Stone', 'LEGENDARY', 'essence', { type: 'purify' }, 'Washes the curse of failure away.', 'Cancels an active Penalty Zone once.');
  C('mana_draught', 'Mana Recovery Draught', 'RARE', 'potion', { type: 'stat', changes: { INT: 1 } }, 'Blue and bitter. The mind expands.', 'Permanent +1 INT.');
  C('ogre_tonic', "Ogre's Strength Tonic", 'RARE', 'potion', { type: 'stat', changes: { STR: 1 } }, 'Thick as mud. Strong as an ogre.', 'Permanent +1 STR.');
  C('wind_elixir', 'Wind Elixir', 'RARE', 'potion', { type: 'stat', changes: { AGI: 1 } }, 'Your feet forget gravity.', 'Permanent +1 AGI.');
  C('clarity_elixir', 'Elixir of Clarity', 'RARE', 'potion', { type: 'stat', changes: { PER: 1 } }, 'Colors become sharper. Sounds become clearer.', 'Permanent +1 PER.');
  // Skill Runes (12)
  C('rune_stealth', 'Rune: Stealth', 'RARE', 'rune', { type: 'buff', k: 'xp', t: 'FOCUS', v: 0.10, hours: 24 }, 'Vanish from all distraction.', '+10% Focus Gate XP for 24h.');
  C('rune_bloodlust', 'Rune: Bloodlust', 'HEROIC', 'rune', { type: 'buff', k: 'xp', t: 'STR', v: 0.15, hours: 24 }, 'Enemies freeze. Muscles burn.', '+15% STR XP for 24h.');
  C('rune_sprint', 'Rune: Sprint', 'RARE', 'rune', { type: 'buff', k: 'xp', t: 'RUNNING', v: 0.15, hours: 24 }, 'Speed beyond the limit.', '+15% Running XP for 24h.');
  C('rune_dagger', 'Rune: Dagger Throw', 'RARE', 'rune', { type: 'buff', k: 'xp', t: 'CALISTHENICS', v: 0.15, hours: 24 }, 'Precision in every motion.', '+15% Calisthenics XP for 24h.');
  C('rune_mutilation', 'Rune: Mutilation', 'HEROIC', 'rune', { type: 'buff', k: 'xp', t: 'GYM', v: 0.15, hours: 24 }, 'Every set, a critical strike.', '+15% Gym XP for 24h.');
  C('rune_ruler', "Rune: Ruler's Touch", 'LEGENDARY', 'rune', { type: 'buff', k: 'xp', t: 'ALL', v: 0.10, hours: 24 }, 'The invisible hand of authority.', '+10% All Quest XP for 24h.');
  C('rune_exchange', 'Rune: Shadow Exchange', 'RARE', 'rune', { type: 'reroll' }, 'Swap places with your shadow instantly.', 'Resets the Bonus Quest re-roll cooldown.');
  C('rune_domain', 'Rune: Domain of the Monarch', 'LEGENDARY', 'rune', { type: 'buff', k: 'xp', t: 'FOCUS', v: 0.20, hours: 24 }, 'Inside your domain, you are absolute.', '+20% Focus Gate XP for 24h.');
  C('rune_protect', 'Rune of Protection', 'HEROIC', 'shield', { type: 'passive' }, 'A ward against the midnight judgement.', 'Passive: auto-consumed to protect your streak from one missed day.');
  C('rune_quicksilver', 'Rune: Quicksilver Mind', 'RARE', 'rune', { type: 'buff', k: 'xp', t: 'STUDY', v: 0.15, hours: 24 }, 'Thoughts flow like mercury.', '+15% Study XP for 24h.');
  C('rune_goldrush', 'Rune: Gold Rush', 'HEROIC', 'rune', { type: 'buff', k: 'gold', v: 0.50, hours: 24 }, 'Every quest pays in full.', '+50% Gold for 24h.');
  C('rune_fortune', 'Rune: Fortune', 'LEGENDARY', 'rune', { type: 'buff', k: 'loot', v: 0.10, hours: 24 }, 'Fate tilts in your favor.', '+10% Loot rarity for 24h.');

  /* ---------- C. UI Skins (25) ---------- */
  function K(id, name, rarity, pal, cost, req, cond) {
    V.push({ id: 'skin_' + id, name: name, category: 'SKIN', rarity: rarity, svgIconKey: 'skin', palette: pal, cost: cost, cond: cond || null, loreDescription: 'Full hologram theme override with custom glow and synth profile.', buffDescription: 'Theme: accent ' + pal.a + ' / synth: ' + (pal.wave || 'triangle'), unlockRequirementText: req || (cost ? cost + ' Gold' : 'Default') });
  }
  function P(a, d, g, bg, panel, wave) { return { a: a, d: d, g: g, bg: bg, panel: panel, wave: wave || 'triangle' }; }
  K('classic', 'Classic System Cyan', 'COMMON', P('#00E5FF', '#0066FF', '#7DF9FF', '#04060A', '10,17,31', 'triangle'), 0, 'Default');
  K('cartenon', 'Cartenon Temple Stone & Gold', 'HEROIC', P('#E8C27A', '#8C6A2F', '#FFE3A3', '#0A0806', '24,19,12', 'sine'), 1200);
  K('penalty_desert', 'Penalty Desert Blood Red', 'RARE', P('#FF3B4E', '#A3001E', '#FF8A94', '#0A0405', '28,8,12', 'sawtooth'), 300, 'Survive the Penalty Zone + 300 Gold', function (s) { return s.records.penaltiesSurvived >= 1; });
  K('kasaka', "Kasaka's Poison Teal", 'RARE', P('#19F5C1', '#0B8F7A', '#8BFFE4', '#03090A', '8,24,24', 'triangle'), 500);
  K('tundra', 'Red Gate Frozen Tundra', 'HEROIC', P('#9FD8FF', '#3F7FBF', '#E6F6FF', '#05080C', '14,22,34', 'sine'), 1000, 'Clear an S-Rank Red Gate + 1000 Gold', function (s) { return s.records.redGates >= 1; });
  K('hellfire', 'Demon Castle Hellfire Amber', 'HEROIC', P('#FF8A1F', '#B33A00', '#FFC27A', '#0A0603', '28,14,6', 'sawtooth'), 1100);
  K('abyssal', 'Shadow Extraction Abyssal Violet', 'LEGENDARY', P('#A855F7', '#5B21B6', '#C77DFF', '#05030A', '18,10,32', 'sine'), 2000, 'Reach Lv. 40 (Job Change) + 2000 Gold', function (s) { return s.profile.level >= 40; });
  K('executive', 'Hunter Association Executive White/Gold', 'HEROIC', P('#F5F1E6', '#C9A227', '#FFE7A0', '#07070A', '22,22,28', 'sine'), 1400);
  K('ahjin', 'Ahjin Guild Tactical Obsidian', 'RARE', P('#A0AEC0', '#2D3748', '#E2E8F0', '#030304', '14,15,18', 'square'), 700);
  K('ant_queen', 'Jeju Island Ant Queen Bio-Crimson', 'LEGENDARY', P('#FF2E63', '#8F0033', '#FF8FAE', '#090306', '26,8,16', 'sawtooth'), 2200, 'Reach B-Rank + 2200 Gold', function (s) { return s.profile.rankTierIndex >= 12; });
  K('architect', "Architect's Golden Matrix", 'LEGENDARY', P('#FFD000', '#A88600', '#FFF099', '#070600', '22,20,6', 'square'), 2500, 'Pass 3 Promotion Exams + 2500 Gold', function (s) { return s.records.examsPassed >= 3; });
  K('frost', 'Frost Monarch Glacial Blue', 'HEROIC', P('#5CC8FF', '#1A5FB4', '#C8EEFF', '#03070C', '8,18,32', 'sine'), 1300);
  K('beast', 'Beast Monarch Savage Ochre', 'HEROIC', P('#D9973B', '#7A4A12', '#F5C987', '#080603', '24,17,8', 'sawtooth'), 1300);
  K('plague', 'Plague Monarch Toxic Emerald', 'HEROIC', P('#39FF88', '#0F8A3E', '#A6FFC9', '#030805', '8,24,14', 'square'), 1300);
  K('iron_body', 'Iron Body Monarch Titanium', 'HEROIC', P('#C0CCDA', '#5E6B7D', '#EEF3F8', '#050607', '18,20,24', 'square'), 1300);
  K('beginning', 'Monarch of Beginning Emerald Void', 'LEGENDARY', P('#10B981', '#065F46', '#6EE7B7', '#02070A', '6,22,22', 'sine'), 2400, 'Reach A-Rank + 2400 Gold', function (s) { return s.profile.rankTierIndex >= 16; });
  K('transfiguration', 'Monarch of Transfiguration Arcane Magenta', 'LEGENDARY', P('#FF3DF2', '#8A0F8F', '#FF9CF9', '#08030A', '26,8,30', 'triangle'), 2400, 'Reach Lv. 60 + 2400 Gold', function (s) { return s.profile.level >= 60; });
  K('white_flames', 'Monarch of White Flames Plasma Silver', 'LEGENDARY', P('#E0E7FF', '#7C8DB5', '#FFFFFF', '#06070B', '20,22,32', 'sine'), 2600, '30-Day max streak + 2600 Gold', function (s) { return s.profile.maxStreak >= 30; });
  K('dragon', 'Dragon Monarch Destruction Scarlet', 'MYTHIC', P('#FF4D1F', '#8F1A00', '#FF9A7A', '#0A0302', '30,10,6', 'sawtooth'), 4000, 'Reach S-Rank + 4000 Gold', function (s) { return s.profile.rankTierIndex >= 19; });
  K('ruler', "Ruler's Celestial Radiance", 'MYTHIC', P('#FFF3B0', '#E0A800', '#FFFFFF', '#08070A', '26,24,20', 'sine'), 4500, '100-Hour Gate Raider + 4500 Gold', function (s) { return s.records.focusMins >= 6000; });
  K('ashborn', "Ashborn's True Shadow Sovereign", 'MYTHIC', P('#9D4EDD', '#3C096C', '#E0AAFF', '#020104', '14,6,24', 'sine'), 6000, 'Become the Shadow Monarch + 6000 Gold', function (s) { return s.profile.rankTierIndex >= 21; });
  K('terminal', 'Terminal Wireframe Green (Retro HUD)', 'COMMON', P('#33FF66', '#0A8F2A', '#A8FFBC', '#000400', '4,16,6', 'square'), 250);
  K('oled', 'Stealth Mode Ultra-OLED Pitch Black', 'RARE', P('#8899AA', '#334455', '#CCD6E0', '#000000', '0,0,0', 'triangle'), 400);
  K('eclipse', 'Double Dungeon Eclipse', 'LEGENDARY', P('#FF6A00', '#4A1A7A', '#FFB070', '#040208', '16,8,24', 'sawtooth'), 2000, 'Clear 5 Instant Dungeons + 2000 Gold', function (s) { return s.records.dungeonsCleared >= 5; });
  K('chrono', 'Cup of Reincarnation Chrono-Gold', 'MYTHIC', P('#FFB703', '#B36B00', '#FFE08A', '#070502', '24,16,4', 'sine'), 3500, '60-Day max streak + 3500 Gold', function (s) { return s.profile.maxStreak >= 60; });

  /* ---------- D. Titles (40) ---------- */
  function T(id, name, group, rarity, req, cond) {
    V.push({ id: 't_' + id, name: name, category: 'TITLE', group: group, rarity: rarity, svgIconKey: 'title', cond: cond, loreDescription: 'Displayed beneath your name on the Hunter Association boards.', buffDescription: 'Cosmetic title', unlockRequirementText: req });
  }
  var r = function (s) { return s.records; }, p = function (s) { return s.profile; };
  // Progression & Combat (20)
  T('weakest', 'The Weakest Hunter of All Mankind', 'COMBAT', 'COMMON', 'Awaken as a Player', function () { return true; });
  T('wolf', 'Wolf Slayer', 'COMBAT', 'COMMON', 'Clear 10 quests', function (s) { return r(s).questsCompleted >= 10; });
  T('calamity', 'Calamity Survivor', 'COMBAT', 'RARE', 'Survive the Penalty Zone', function (s) { return r(s).penaltiesSurvived >= 1; });
  T('adversity', 'One Who Overcame Adversity', 'COMBAT', 'RARE', 'Reach Lv. 10', function (s) { return p(s).level >= 10; });
  T('spider', 'Spider Boss Executioner', 'COMBAT', 'RARE', 'Reach Lv. 20', function (s) { return p(s).level >= 20; });
  T('cerberus', 'Cerberus Gatekeeper', 'COMBAT', 'HEROIC', 'Clear 10 Focus Gates', function (s) { return r(s).gatesCleared >= 10; });
  T('necromancer', 'Necromancer', 'COMBAT', 'HEROIC', 'Complete the Job Change (Lv. 40)', function (s) { return p(s).level >= 40; });
  T('demon_castle', 'Demon Castle Conqueror', 'COMBAT', 'HEROIC', 'Clear 5 Instant Dungeons', function (s) { return r(s).dungeonsCleared >= 5; });
  T('jeju', 'Jeju Island Savior', 'COMBAT', 'LEGENDARY', 'Reach B-Rank', function (s) { return p(s).rankTierIndex >= 12; });
  T('giant', 'Giant Slayer', 'COMBAT', 'RARE', 'Clear an A or S difficulty quest', function (s) { return r(s).highRankQuests >= 1; });
  T('ahjin', 'Guild Master of Ahjin', 'COMBAT', 'LEGENDARY', 'Reach A-Rank Tier II', function (s) { return p(s).rankTierIndex >= 17; });
  T('king_dead', 'King of the Dead', 'COMBAT', 'LEGENDARY', 'Extract 5 Shadow Soldiers', function (s) { return r(s).shadowsExtracted >= 5; });
  T('ninth', 'Ninth Sovereign', 'COMBAT', 'MYTHIC', 'Reach the Monarch Tier', function (s) { return p(s).rankTierIndex >= 21; });
  T('architect', 'Architect Defier', 'COMBAT', 'LEGENDARY', 'Pass 5 Promotion Exams', function (s) { return r(s).examsPassed >= 5; });
  T('red_gate', 'Red Gate Survivor', 'COMBAT', 'HEROIC', 'Clear an S-Rank Red Gate', function (s) { return r(s).redGates >= 1; });
  T('double', 'Double Dungeon Survivor', 'COMBAT', 'HEROIC', 'Clear 100 quests', function (s) { return r(s).questsCompleted >= 100; });
  T('subway', 'Hunter of the Subway', 'COMBAT', 'COMMON', 'Clear an Instant Dungeon', function (s) { return r(s).dungeonsCleared >= 1; });
  T('ice_bear', 'Ice Bear Hunter', 'COMBAT', 'RARE', 'Log 1,000 total reps', function (s) { return r(s).repsLogged >= 1000; });
  T('orc_bane', 'Orc Chieftain Slayer', 'COMBAT', 'HEROIC', 'Log 50 km total distance', function (s) { return r(s).kmLogged >= 50; });
  T('shadow_monarch', 'Shadow Monarch', 'COMBAT', 'MYTHIC', 'Reach Lv. 100', function (s) { return p(s).level >= 100; });
  // Consistency & Focus (20)
  T('streak7', '7-Day Awakening', 'CONSISTENCY', 'COMMON', '7-day streak', function (s) { return p(s).maxStreak >= 7; });
  T('streak14', '14-Day Iron Will', 'CONSISTENCY', 'RARE', '14-day streak', function (s) { return p(s).maxStreak >= 14; });
  T('streak30', '30-Day Unbroken', 'CONSISTENCY', 'HEROIC', '30-day streak', function (s) { return p(s).maxStreak >= 30; });
  T('streak60', '60-Day Relentless', 'CONSISTENCY', 'HEROIC', '60-day streak', function (s) { return p(s).maxStreak >= 60; });
  T('streak100', '100-Day Centurion', 'CONSISTENCY', 'LEGENDARY', '100-day streak', function (s) { return p(s).maxStreak >= 100; });
  T('streak365', '365-Day Immortal', 'CONSISTENCY', 'MYTHIC', '365-day streak', function (s) { return p(s).maxStreak >= 365; });
  T('deep_work', 'Deep Work Sovereign', 'CONSISTENCY', 'LEGENDARY', 'Clear 10 S-Rank Red Gates', function (s) { return r(s).redGates >= 10; });
  T('raider100', '100-Hour Gate Raider', 'CONSISTENCY', 'LEGENDARY', '100 hours of Focus Gates', function (s) { return r(s).focusMins >= 6000; });
  T('void500', '500-Hour Void Walker', 'CONSISTENCY', 'MYTHIC', '500 hours of Focus Gates', function (s) { return r(s).focusMins >= 30000; });
  T('dawn', 'Dawn Grinder', 'CONSISTENCY', 'RARE', 'Clear a quest before 06:00', function (s) { return r(s).dawnClears >= 1; });
  T('midnight', 'Midnight Survivor', 'CONSISTENCY', 'RARE', 'Clear a quest between 23:00 and 00:00', function (s) { return r(s).midnightClears >= 1; });
  T('penalty_vet', 'Penalty Zone Veteran', 'CONSISTENCY', 'HEROIC', 'Survive the Penalty Zone 5 times', function (s) { return r(s).penaltiesSurvived >= 5; });
  T('first_gate', 'Gate Initiate', 'CONSISTENCY', 'COMMON', 'Clear your first Focus Gate', function (s) { return r(s).gatesCleared >= 1; });
  T('focus10', '10-Hour Focus Adept', 'CONSISTENCY', 'RARE', '10 hours of Focus Gates', function (s) { return r(s).focusMins >= 600; });
  T('focus50', '50-Hour Focus Master', 'CONSISTENCY', 'HEROIC', '50 hours of Focus Gates', function (s) { return r(s).focusMins >= 3000; });
  T('unbroken', 'Unbroken Will', 'CONSISTENCY', 'HEROIC', 'Clear 5 Dark Lock Gates without a breach', function (s) { return r(s).cleanDarkLocks >= 5; });
  T('hoarder', 'Loot Hoarder', 'CONSISTENCY', 'RARE', 'Open 25 Random Boxes', function (s) { return r(s).boxesOpened >= 25; });
  T('golden', 'Golden Hunter', 'CONSISTENCY', 'HEROIC', 'Earn 10,000 Gold total', function (s) { return r(s).goldEarned >= 10000; });
  T('perfect', 'Monthly Perfectionist', 'CONSISTENCY', 'LEGENDARY', '30 perfect Daily Quest days', function (s) { return r(s).perfectDays >= 30; });
  T('limit', 'Limit Breaker', 'CONSISTENCY', 'LEGENDARY', 'Raise any attribute to 100', function (s) { var st = p(s).stats; return S.STATS.some(function (k) { return st[k] >= 100; }); });

  /* ---------- E. Shadow Army (13) + Avatar Borders (12) ---------- */
  function Sh(id, name, rarity, cost, minTier, b, lore) {
    V.push({ id: 'sh_' + id, name: name, category: 'SHADOW', kind: 'shadow', rarity: rarity, svgIconKey: 'shadow', cost: cost, minTier: minTier, b: b, loreDescription: lore, buffDescription: S.buffText(b) + ' (+10% per Shadow level)', unlockRequirementText: 'ARISE (Lv. 40) / ' + cost + ' Essence' + (minTier ? ' / ' + S.RANKS[minTier].code + ' Rank' : '') });
  }
  Sh('infantry', 'Shadow Infantry', 'COMMON', 20, 0, [{ k: 'xp', t: 'STR', v: 0.02 }], 'The rank and file. Endless, obedient, loyal.');
  Sh('blade', 'Shadow Blade', 'COMMON', 25, 0, [{ k: 'xp', t: 'AGI', v: 0.02 }], 'A fast skirmisher extracted from an assassin.');
  Sh('mage', 'Shadow Mage', 'RARE', 40, 0, [{ k: 'xp', t: 'INT', v: 0.03 }], 'Recites spells it no longer understands.');
  Sh('bear', 'Shadow Bear', 'RARE', 45, 0, [{ k: 'xp', t: 'VIT', v: 0.03 }], 'An ice bear, now made of night.');
  Sh('fang', 'Fang (High Orc Shaman)', 'RARE', 60, 0, [{ k: 'xp', t: 'FOCUS', v: 0.03 }], 'Still chants, but now in your name.');
  Sh('iron', 'Iron', 'HEROIC', 80, 4, [{ k: 'xp', t: 'GYM', v: 0.04 }], 'A loud, proud shield-bearer from a failed raid.');
  Sh('tank', 'Tank', 'HEROIC', 90, 4, [{ k: 'fatigue', v: 0.08 }], 'The ice bear alpha. Absorbs everything.');
  Sh('kaisel', 'Kaisel (Wyvern)', 'HEROIC', 120, 8, [{ k: 'xp', t: 'RUNNING', v: 0.05 }], 'Your mount across the skies of every city.');
  Sh('jima', 'Jima', 'LEGENDARY', 150, 8, [{ k: 'xp', t: 'STUDY', v: 0.05 }], 'A naga general who commands the deep.');
  Sh('greed', 'Greed', 'LEGENDARY', 160, 12, [{ k: 'gold', v: 0.10 }], 'Once an S-Rank criminal. Now he serves.');
  Sh('igris', 'Igris the Bloodred', 'LEGENDARY', 220, 12, [{ k: 'xp', t: 'STR', v: 0.06 }], 'The commander knight. Your first true shadow.');
  Sh('beru', 'Beru the Ant King', 'MYTHIC', 320, 16, [{ k: 'xp', t: 'ALL', v: 0.06 }], 'The strongest ant. My king.');
  Sh('bellion', 'Bellion the Grand Marshal', 'MYTHIC', 450, 19, [{ k: 'xp', t: 'ALL', v: 0.08 }], 'The first and strongest of the Shadow Army.');
  function Bd(id, name, rarity, color, req, cond) {
    V.push({ id: 'br_' + id, name: name, category: 'SHADOW', kind: 'border', rarity: rarity, svgIconKey: 'status', color: color, cond: cond, loreDescription: 'Holographic avatar frame displayed around your crest.', buffDescription: 'Cosmetic avatar border', unlockRequirementText: req });
  }
  function tier(i) { return function (s) { return s.profile.rankTierIndex >= i; }; }
  Bd('e', 'E-Rank Holo Border', 'COMMON', '#4A5568', 'Awaken as a Player', tier(0));
  Bd('d', 'D-Rank Holo Border', 'COMMON', '#00B4D8', 'Reach D-Rank', tier(4));
  Bd('c', 'C-Rank Holo Border', 'RARE', '#00E5FF', 'Reach C-Rank', tier(8));
  Bd('b', 'B-Rank Holo Border', 'RARE', '#10B981', 'Reach B-Rank', tier(12));
  Bd('a', 'A-Rank Holo Border', 'HEROIC', '#8B5CF6', 'Reach A-Rank', tier(16));
  Bd('s', 'S-Rank Sovereign Border', 'LEGENDARY', '#FFB703', 'Reach S-Rank', tier(19));
  Bd('nat', 'National Level Border', 'LEGENDARY', '#E2E8F0', 'Reach National Level', tier(20));
  Bd('monarch', 'Monarch Abyss Border', 'MYTHIC', '#9D4EDD', 'Reach the Monarch Tier', tier(21));
  Bd('penalty', 'Penalty Survivor Border', 'RARE', '#FF003C', 'Survive the Penalty Zone', function (s) { return s.records.penaltiesSurvived >= 1; });
  Bd('redgate', 'Red Gate Frost Border', 'HEROIC', '#9FD8FF', 'Clear an S-Rank Red Gate', function (s) { return s.records.redGates >= 1; });
  Bd('architect', 'Architect Matrix Border', 'LEGENDARY', '#FFD000', 'Pass 3 Promotion Exams', function (s) { return s.records.examsPassed >= 3; });
  Bd('sovereign', 'Shadow Sovereign Border', 'MYTHIC', '#C77DFF', 'Extract all 13 Shadow Soldiers', function (s) { return s.records.shadowsExtracted >= 13; });

  S.VAULT = V;
  S.ITEM = {};
  V.forEach(function (it) { S.ITEM[it.id] = it; });
  S.VAULT_COUNTS = { RELIC: 0, CONSUMABLE: 0, SKIN: 0, TITLE: 0, SHADOW: 0 };
  V.forEach(function (it) { S.VAULT_COUNTS[it.category]++; });

  /* ---------- Shop ---------- */
  S.SHOP = [
    { id: 'box_blessed', name: 'Blessed Random Box', price: 150, cur: 'gold', box: 'BLESSED', icon: 'box', desc: 'Random relic or consumable. Standard rarity table.' },
    { id: 'box_cursed', name: 'Cursed Random Box', price: 90, cur: 'gold', box: 'CURSED', icon: 'box', desc: 'Higher rarity odds. 35% chance of a curse.' },
    { id: 'c_pot_low', price: 60, cur: 'gold' },
    { id: 'c_pot_mid', price: 130, cur: 'gold' },
    { id: 'c_pot_stamina', price: 240, cur: 'gold' },
    { id: 'c_rune_protect', price: 450, cur: 'gold' },
    { id: 'c_key_reset', price: 250, cur: 'gold' },
    { id: 'c_rune_exchange', price: 120, cur: 'gold' },
    { id: 'c_ogre_tonic', price: 500, cur: 'gold' },
    { id: 'c_wind_elixir', price: 500, cur: 'gold' },
    { id: 'c_mana_draught', price: 500, cur: 'gold' },
    { id: 'c_clarity_elixir', price: 500, cur: 'gold' },
    { id: 'c_holy_water', price: 900, cur: 'gold' },
    { id: 'c_purify', price: 1200, cur: 'gold' },
    { id: 'c_rune_domain', price: 25, cur: 'essence' },
    { id: 'c_rune_ruler', price: 30, cur: 'essence' }
  ];

  /* ---------- Fast quest templates ---------- */
  S.TEMPLATES = [
    { title: 'Bench Press', category: 'GYM', difficulty: 'C', mode: 'COUNTER', target: 5, unit: 'SETS' },
    { title: 'Deadlift', category: 'GYM', difficulty: 'C', mode: 'COUNTER', target: 5, unit: 'SETS' },
    { title: 'Pull-ups', category: 'CALISTHENICS', difficulty: 'D', mode: 'COUNTER', target: 50, unit: 'REPS' },
    { title: 'Burpees', category: 'CALISTHENICS', difficulty: 'C', mode: 'COUNTER', target: 100, unit: 'REPS' },
    { title: '5 km Run', category: 'RUNNING', difficulty: 'C', mode: 'COUNTER', target: 5, unit: 'KM' },
    { title: 'Interval Sprints', category: 'RUNNING', difficulty: 'B', mode: 'COUNTER', target: 10, unit: 'SETS' },
    { title: 'Deep Study Gate', category: 'STUDY', difficulty: 'C', mode: 'DURATION', target: 50, unit: 'MINS' },
    { title: 'Read 30 Pages', category: 'STUDY', difficulty: 'D', mode: 'COUNTER', target: 30, unit: 'REPS' },
    { title: 'Code for 60 Minutes', category: 'STUDY', difficulty: 'B', mode: 'DURATION', target: 60, unit: 'MINS' },
    { title: 'Meditation', category: 'FOCUS', difficulty: 'D', mode: 'DURATION', target: 15, unit: 'MINS' },
    { title: 'Journal Entry', category: 'FOCUS', difficulty: 'E', mode: 'CHECK', target: 1, unit: 'CHECK' },
    { title: 'Drink 8 Glasses of Water', category: 'HABIT', difficulty: 'E', mode: 'COUNTER', target: 8, unit: 'REPS' },
    { title: 'Sleep Before 23:00', category: 'HABIT', difficulty: 'D', mode: 'CHECK', target: 1, unit: 'CHECK' },
    { title: 'Stretching Routine', category: 'HABIT', difficulty: 'E', mode: 'CHECK', target: 1, unit: 'CHECK' }
  ];

  S.BONUS_POOL = [
    { title: 'Bonus: 50 Burpees', category: 'CALISTHENICS', target: 50, unit: 'REPS', mode: 'COUNTER' },
    { title: 'Bonus: 3-Minute Plank', category: 'CALISTHENICS', target: 3, unit: 'MINS', mode: 'COUNTER' },
    { title: 'Bonus: 5 Sets of Squats', category: 'GYM', target: 5, unit: 'SETS', mode: 'COUNTER' },
    { title: 'Bonus: 3 km Tempo Run', category: 'RUNNING', target: 3, unit: 'KM', mode: 'COUNTER' },
    { title: 'Bonus: 30 min Focused Reading', category: 'STUDY', target: 30, unit: 'MINS', mode: 'DURATION' },
    { title: 'Bonus: 20 min Meditation', category: 'FOCUS', target: 20, unit: 'MINS', mode: 'DURATION' },
    { title: 'Bonus: Cold Shower', category: 'HABIT', target: 1, unit: 'CHECK', mode: 'CHECK' },
    { title: 'Bonus: 100 Jumping Jacks', category: 'CALISTHENICS', target: 100, unit: 'REPS', mode: 'COUNTER' }
  ];

  S.PENALTY_PHYSICAL = [
    { title: 'Penalty: 150 Burpees', target: 150, unit: 'REPS' },
    { title: 'Penalty: 5-Minute Cumulative Plank', target: 5, unit: 'MINS' },
    { title: 'Penalty: 3 km Penalty Run', target: 3, unit: 'KM' }
  ];

  S.RIVAL_NAMES = ['HUNTER_CHA', 'BAEK_YOON', 'HWANG_DONG', 'CHOI_JONGIN', 'GO_GUNHEE', 'CHA_HAEIN', 'YOO_JINHO', 'LEE_JOOHEE', 'PARK_HEEJIN', 'KIM_CHUL', 'MA_DONGWOOK', 'WOO_JINCHUL', 'THOMAS_A', 'LIU_ZHIGANG', 'CHRIS_REED', 'SIDDHARTH_B', 'MIN_BYUNGGU', 'AHN_SANGMIN', 'NAM_JOONHO', 'JUNG_YERIM', 'SONG_CHIYUL', 'YOON_KIHOON', 'LIM_TAEGYU', 'KANG_TAESHIK', 'HAN_SONGYI', 'JIN_HO', 'SEO_YUNA', 'BAEK_MIRAE', 'OH_DAEJUN', 'KOO_SEOJIN', 'RYU_HAJIN', 'SHIN_DONGWOO', 'JANG_MINSEO', 'CHO_YEJIN', 'DEMON_SLAYER_K', 'IRONGRIP_77', 'NIGHT_RAIDER', 'GATE_BREAKER_9', 'SHADOW_STEP', 'AZURE_FANG', 'VOID_WALKER_X', 'FROST_HUNTER', 'CRIMSON_EDGE', 'SILENT_BLADE', 'ARC_LANCER', 'GOLEM_CRUSHER', 'DAWN_GRINDER', 'RUNE_SEEKER', 'STEEL_WILL', 'HYDRA_HUNTER', 'TITAN_LIFT', 'KASAKA_BANE', 'WOLFSBANE_21', 'ORC_REAPER', 'MANA_SURGE', 'HIGH_ORC_CHIEF', 'OBSIDIAN_EYE', 'STORM_RUNNER', 'ECHO_PRIME', 'NOVA_KNIGHT'];
})(window.SYS);

/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Tactical HUD UI Renderer
   Complete view rendering, 3-column command center, modal system,
   custom SVG radar chart, fast logging buttons, and theme controller.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var currentView = 'quests';
  var activeVaultTab = 'RELIC';
  var activeRankTab = 'VANGUARD';

  var U = S.util;
  var I = S.icon;

  var UI = S.ui = {
    init: function () {
      UI.bindEvents();
      UI.render();
      UI.applyActiveTheme();

      // Listen for system state events
      S.on('change', function () {
        UI.render();
      });

      S.on('notice', function (n) {
        UI.showToast(n.title, n.body, n.type);
      });

      S.on('levelUp', function (ev) {
        UI.openLevelUpModal(ev.level);
      });

      S.on('rankUp', function (ev) {
        UI.openRankUpModal(ev.rank);
      });

      S.on('jobChange', function () {
        UI.openJobChangeModal();
      });

      S.on('penalty', function (ev) {
        UI.openPenaltyModal(ev);
      });

      S.on('penaltyCleared', function (ev) {
        UI.applyActiveTheme();
        UI.showToast('[PENALTY SURVIVED]', 'The Penalty Zone has been cleared. System restored.', 'gold');
        if (S.audio) S.audio.rankUp();
      });

      S.on('examStart', function () {
        UI.showToast('[PROMOTION EXAM]', 'The Rank Promotion Exam has begun. Clear all trials before midnight.', 'gold');
        if (S.audio) S.audio.windowOpen();
      });
    },

    bindEvents: function () {
      // Desktop Nav clicks
      document.querySelectorAll('.nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var view = btn.getAttribute('data-view');
          if (view) UI.setView(view);
        });
      });

      // Mobile Dock clicks
      document.querySelectorAll('.dock-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var view = btn.getAttribute('data-view');
          if (view) UI.setView(view);
        });
      });
    },

    setView: function (view) {
      currentView = view;
      if (S.audio) S.audio.windowOpen();
      // Update active nav classes
      document.querySelectorAll('.nav-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-view') === view);
      });
      document.querySelectorAll('.dock-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-view') === view);
      });
      UI.render();
    },

    applyActiveTheme: function () {
      var skinId = S.state.profile.activeSkinId || 'skin_classic';
      var skin = S.ITEM[skinId];
      var root = document.documentElement;

      if (S.state.profile.inPenaltyZone && S.state.profile.penaltyMode === 'HARDCORE') {
        document.body.classList.add('in-penalty-zone');
        root.style.setProperty('--accent-core', '#FF003C');
        root.style.setProperty('--accent-deep', '#8A0020');
        root.style.setProperty('--accent-glow', '#FF6B88');
        root.style.setProperty('--accent-border', 'rgba(255, 0, 60, 0.45)');
        return;
      }

      document.body.classList.remove('in-penalty-zone');
      if (skin && skin.palette) {
        var p = skin.palette;
        root.style.setProperty('--accent-core', p.a);
        root.style.setProperty('--accent-deep', p.d);
        root.style.setProperty('--accent-glow', p.g);
        root.style.setProperty('--bg-abyss-void', p.bg);
        root.style.setProperty('--bg-panel-rgb', p.panel);
        root.style.setProperty('--accent-border', 'rgba(' + p.panel + ', 0.6)');
      }
    },

    render: function () {
      UI.applyActiveTheme();
      UI.renderTopbar();

      var container = document.getElementById('view-container');
      if (!container) return;

      if (!S.state.initialized) {
        UI.renderAwakeningModal();
        return;
      }

      switch (currentView) {
        case 'quests':
          UI.renderCommandCenter(container);
          break;
        case 'status':
          UI.renderStatusView(container);
          break;
        case 'gate':
          UI.renderGateView(container);
          break;
        case 'vault':
          UI.renderVaultView(container);
          break;
        case 'rank':
          UI.renderRankView(container);
          break;
        case 'settings':
          UI.renderSettingsView(container);
          break;
        default:
          UI.renderCommandCenter(container);
      }
    },

    /* --- Topbar Updates --- */
    renderTopbar: function () {
      var p = S.state.profile;
      var goldEl = document.getElementById('top-gold');
      var essenceEl = document.getElementById('top-essence');
      var streakEl = document.getElementById('top-streak');
      var rankEl = document.getElementById('top-rank-badge');

      if (goldEl) goldEl.textContent = U.fmt(p.gold);
      if (essenceEl) essenceEl.textContent = p.essenceStones;
      if (streakEl) streakEl.textContent = p.streakDays + 'D';
      if (rankEl) {
        rankEl.textContent = S.rank().code;
        rankEl.style.color = S.rank().color;
      }
    },

    /* --- 5-Axis SVG Radar Chart Generator --- */
    renderRadarSvg: function (stats) {
      var cx = 110, cy = 110, r = 70;
      var order = ['STR', 'AGI', 'VIT', 'INT', 'PER'];
      var angles = [-Math.PI / 2, -Math.PI / 2 + (2 * Math.PI / 5), -Math.PI / 2 + (4 * Math.PI / 5), -Math.PI / 2 + (6 * Math.PI / 5), -Math.PI / 2 + (8 * Math.PI / 5)];

      // Find max stat for dynamic scaling (min ceiling 50)
      var maxVal = Math.max(50, stats.STR, stats.AGI, stats.VIT, stats.INT, stats.PER);

      // Grid rings
      var gridRings = '';
      [0.25, 0.5, 0.75, 1.0].forEach(function (frac) {
        var pts = angles.map(function (a) {
          var x = cx + r * frac * Math.cos(a);
          var y = cy + r * frac * Math.sin(a);
          return x.toFixed(1) + ',' + y.toFixed(1);
        }).join(' ');
        gridRings += '<polygon class="radar-grid" points="' + pts + '" />';
      });

      // Axis lines & labels
      var axisLines = '';
      var labels = '';
      angles.forEach(function (a, i) {
        var x2 = cx + r * Math.cos(a);
        var y2 = cy + r * Math.sin(a);
        axisLines += '<line class="radar-axis" x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" />';

        var lx = cx + (r + 18) * Math.cos(a);
        var ly = cy + (r + 18) * Math.sin(a);
        labels += '<text class="radar-label" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '">' + order[i] + ' ' + stats[order[i]] + '</text>';
      });

      // Stat polygon
      var polyPts = angles.map(function (a, i) {
        var statVal = stats[order[i]];
        var frac = Math.min(1.0, statVal / maxVal);
        var x = cx + r * frac * Math.cos(a);
        var y = cy + r * frac * Math.sin(a);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');

      return '<div class="radar-chart-container">' +
        '<svg class="radar-chart-svg" viewBox="0 0 220 220">' +
          gridRings +
          axisLines +
          '<polygon class="radar-poly" points="' + polyPts + '" />' +
          labels +
        '</svg>' +
      '</div>';
    },

    /* ======================================================================
       VIEW: COMMAND CENTER (3-Column Desktop / Single Column Mobile)
       ====================================================================== */
    renderCommandCenter: function (container) {
      container.innerHTML = '<div class="command-center-layout">' +
        '<div class="col-status" id="col-status"></div>' +
        '<div class="col-quests" id="col-quests"></div>' +
        '<div class="col-vault" id="col-vault"></div>' +
      '</div>';

      UI.renderStatusColumn(document.getElementById('col-status'));
      UI.renderQuestsColumn(document.getElementById('col-quests'));
      UI.renderVaultColumn(document.getElementById('col-vault'));
    },

    /* --- Column 1: Hunter Status Window --- */
    renderStatusColumn: function (col) {
      var p = S.state.profile;
      var rank = S.rank();
      var vitals = S.vitals();
      var xpReq = S.xpReq(p.level);
      var xpFrac = Math.min(100, Math.floor((p.currentXp / xpReq) * 100));
      var activeTitleObj = S.ITEM[p.activeTitle];

      col.innerHTML = '<div class="system-panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title">' + I('status', 18) + ' [STATUS WINDOW]</div>' +
          '<div class="sys-badge" style="color:' + rank.color + '">' + rank.code + '</div>' +
        '</div>' +

        // Avatar Crest
        '<div class="hunter-crest-card">' +
          '<div class="avatar-hex" style="border-color:' + rank.color + '">' +
            '<span class="rank-letter" style="color:' + rank.color + '">' + rank.letter + '</span>' +
          '</div>' +
          '<div class="hunter-meta">' +
            '<div class="hunter-name">' + U.esc(p.hunterName) + '</div>' +
            '<div class="hunter-rank-title">' + S.rankLabel(rank) + ' // LV. ' + p.level + '</div>' +
            '<div class="hunter-active-title">"' + (activeTitleObj ? activeTitleObj.name : 'The Weakest Hunter') + '"</div>' +
          '</div>' +
        '</div>' +

        // XP Bar
        '<div style="margin-bottom:12px;">' +
          '<div class="flex-between font-mono" style="font-size:11px; margin-bottom:4px; color:var(--text-muted);">' +
            '<span>EXP PROGRESS</span>' +
            '<span>' + U.fmt(p.currentXp) + ' / ' + U.fmt(xpReq) + ' XP (' + xpFrac + '%)</span>' +
          '</div>' +
          '<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' + xpFrac + '%"></div></div>' +
        '</div>' +

        // HP / MP / Fatigue Vitals
        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">' +
          '<div style="padding:6px 8px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); clip-path:var(--clip-chamfer-sm);">' +
            '<div class="font-mono" style="font-size:10px; color:var(--text-muted);">HP (HEALTH)</div>' +
            '<div class="font-mono" style="font-size:14px; font-weight:700; color:#39FF88;">' + U.fmt(vitals.hp) + '</div>' +
          '</div>' +
          '<div style="padding:6px 8px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); clip-path:var(--clip-chamfer-sm);">' +
            '<div class="font-mono" style="font-size:10px; color:var(--text-muted);">MP (MANA)</div>' +
            '<div class="font-mono" style="font-size:14px; font-weight:700; color:#00E5FF;">' + U.fmt(vitals.mp) + '</div>' +
          '</div>' +
        '</div>' +

        // Fatigue Bar
        '<div style="margin-bottom:16px;">' +
          '<div class="flex-between font-mono" style="font-size:11px; margin-bottom:4px; color:var(--text-muted);">' +
            '<span>FATIGUE</span>' +
            '<span style="color:' + (p.fatigue >= 80 ? 'var(--penalty-crimson)' : 'var(--text-secondary)') + '">' + Math.round(p.fatigue) + '%</span>' +
          '</div>' +
          '<div class="progress-bar-wrap"><div class="progress-bar-fill fatigue" style="width:' + Math.round(p.fatigue) + '%"></div></div>' +
        '</div>' +

        // Attributes Section
        '<div class="panel-header" style="margin-bottom:8px;">' +
          '<div class="panel-title" style="font-size:13px;">' + I('bolt', 16) + ' ATTRIBUTES</div>' +
          (p.unallocatedAp > 0 ? '<div class="sys-badge text-gold font-mono" style="font-size:11px;">+' + p.unallocatedAp + ' AP AVAILABLE</div>' : '') +
        '</div>' +

        '<div class="attributes-list">' +
          S.STATS.map(function (st) {
            var val = p.stats[st];
            var info = S.STAT_INFO[st];
            return '<div class="stat-row">' +
              '<div class="stat-label-group">' +
                I(info.icon, 16) +
                '<div>' +
                  '<div class="stat-code">' + st + ' <span style="font-size:11px; color:var(--text-muted); font-weight:400;">(' + info.name + ')</span></div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex; align-items:center; gap:8px;">' +
                '<span class="stat-value">' + val + '</span>' +
                (p.unallocatedAp > 0 ? '<button class="sys-btn sm primary btn-alloc" data-stat="' + st + '">+</button>' : '') +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +

        // 5-Axis Radar Chart
        UI.renderRadarSvg(p.stats) +

        // Combat Power Footer
        '<div class="flex-between font-mono" style="padding:8px; background:rgba(0,229,255,0.05); border:1px solid var(--accent-border); clip-path:var(--clip-chamfer-sm); font-size:12px;">' +
          '<span style="color:var(--text-muted);">COMBAT POWER:</span>' +
          '<span style="color:var(--accent-core); font-weight:700;">' + U.fmt(S.combatPower()) + '</span>' +
        '</div>' +
      '</div>';

      // Bind AP allocation buttons
      col.querySelectorAll('.btn-alloc').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var stat = btn.getAttribute('data-stat');
          if (stat) {
            if (S.audio) S.audio.tap();
            S.allocate(stat);
          }
        });
      });
    },

    /* --- Column 2: Active Quests & Focus Gate --- */
    renderQuestsColumn: function (col) {
      var quests = S.state.quests;
      var mandDone = S.allMandatoryDone();
      var remainingMs = S.msToMidnight();

      var questsHtml = '';
      if (!quests.length) {
        questsHtml = '<div style="padding:32px; text-align:center; color:var(--text-muted);">' +
          I('quests', 32) +
          '<p style="margin-top:8px;">No active quests found. Install the canonical preset or forge your own below.</p>' +
        '</div>';
      } else {
        questsHtml = '<div class="quest-list">' +
          quests.map(function (q) { return UI.renderQuestCard(q); }).join('') +
        '</div>';
      }

      col.innerHTML = '<div class="system-panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title">' + I('quests', 18) + ' [DAILY QUESTS: PREPARATION TO BECOME STRONG]</div>' +
          '<button class="sys-btn sm" id="btn-reroll-bonus">' + I('reroll', 14) + ' BONUS QUEST</button>' +
        '</div>' +

        questsHtml +

        // Forge Custom Quest + Presets Buttons
        '<div style="display:flex; gap:8px; margin-top:14px; flex-wrap:wrap;">' +
          '<button class="sys-btn primary flex-1" id="btn-forge-quest" style="flex:1;">' + I('forge', 16) + ' FORGE CUSTOM QUEST</button>' +
          '<button class="sys-btn" id="btn-install-preset">' + I('check', 14) + ' RESET CANONICAL PRESET</button>' +
        '</div>' +

        // Midnight Penalty Warning Banner
        '<div class="penalty-timer-card">' +
          '<div style="display:flex; align-items:center; gap:8px;">' +
            I('alert', 18) +
            '<div class="warning-text">' +
              (mandDone ? 'DAILY MANDATE COMPLETE // MULTIPLIER SECURED' : 'WARNING: INCOMPLETE QUESTS TRIGGER PENALTY AT 00:00:00') +
            '</div>' +
          '</div>' +
          '<div class="countdown-clock" id="penalty-countdown">' + U.hms(remainingMs) + '</div>' +
        '</div>' +
      '</div>';

      UI.bindQuestCardEvents(col);

      var btnForge = col.querySelector('#btn-forge-quest');
      if (btnForge) btnForge.addEventListener('click', UI.openForgeModal);

      var btnPreset = col.querySelector('#btn-install-preset');
      if (btnPreset) btnPreset.addEventListener('click', function () {
        if (S.audio) S.audio.windowOpen();
        S.installPreset();
        S.commit();
      });

      var btnReroll = col.querySelector('#btn-reroll-bonus');
      if (btnReroll) btnReroll.addEventListener('click', function () {
        if (S.audio) S.audio.tap();
        S.reroll();
      });
    },

    /* --- Single Quest Card Renderer --- */
    renderQuestCard: function (q) {
      var pct = Math.min(100, Math.floor((q.currentProgress / q.targetProgress) * 100));
      var cat = S.CATS[q.category] || S.CATS.HABIT;
      var xpPay = S.payout(q);
      var goldPay = S.goldPayout(q);

      var cardCls = 'quest-card';
      if (q.isCompleted) cardCls += ' completed';
      if (q.isPenaltyQuest) cardCls += ' penalty-quest';
      if (q.isExam) cardCls += ' exam-quest';

      var progressControls = '';
      if (!q.isCompleted) {
        if (q.mode === 'CHECK') {
          progressControls = '<button class="seal-btn" data-quest-id="' + q.id + '">' +
            '<span class="seal-fill"></span>' +
            I('check', 14) + ' HOLD TO SEAL' +
          '</button>';
        } else if (q.mode === 'DURATION') {
          progressControls = '<div style="display:flex; gap:6px;">' +
            '<button class="sys-btn sm primary btn-enter-gate" data-quest-id="' + q.id + '">' + I('gate', 14) + ' ENTER GATE (' + q.targetProgress + 'M)</button>' +
            '<button class="log-inc-btn" data-quest-id="' + q.id + '" data-inc="10">+10M</button>' +
            '<button class="log-inc-btn" data-quest-id="' + q.id + '" data-inc="MAX">MAX</button>' +
          '</div>';
        } else {
          // Reps / KM Counter mode fast logging buttons
          var isKm = q.unit === 'KM';
          progressControls = '<div class="fast-log-row">' +
            (!isKm ? '<button class="log-inc-btn" data-quest-id="' + q.id + '" data-inc="1">+1</button>' : '') +
            '<button class="log-inc-btn" data-quest-id="' + q.id + '" data-inc="' + (isKm ? '1' : '5') + '">+' + (isKm ? '1' : '5') + '</button>' +
            '<button class="log-inc-btn" data-quest-id="' + q.id + '" data-inc="' + (isKm ? '2' : '10') + '">+' + (isKm ? '2' : '10') + '</button>' +
            '<button class="log-inc-btn" data-quest-id="' + q.id + '" data-inc="' + (isKm ? '5' : '25') + '">+' + (isKm ? '5' : '25') + '</button>' +
            '<button class="log-inc-btn" data-quest-id="' + q.id + '" data-inc="MAX">MAX</button>' +
          '</div>';
        }
      } else {
        progressControls = '<div class="sys-badge font-mono" style="color:#39FF88;">' + I('check', 14) + ' COMPLETED</div>';
      }

      return '<div class="' + cardCls + '" id="quest-' + q.id + '">' +
        '<div class="quest-header-row">' +
          '<div class="quest-title-wrap">' +
            I(cat.icon, 18, 'text-accent') +
            '<span class="quest-title">' + U.esc(q.title) + '</span>' +
          '</div>' +
          '<div style="display:flex; align-items:center; gap:6px;">' +
            '<span class="quest-badge">' + q.difficulty + '-RANK</span>' +
            (!q.isMandatory && !q.isPenaltyQuest && !q.isExam ? '<button class="sys-btn sm danger btn-delete-quest" data-quest-id="' + q.id + '" title="Delete quest">' + I('trash', 12) + '</button>' : '') +
          '</div>' +
        '</div>' +

        '<div class="quest-meta-row">' +
          '<span>PROGRESS: ' + q.currentProgress + ' / ' + q.targetProgress + ' ' + (q.unit !== 'CHECK' ? S.UNITS[q.unit] || '' : '') + '</span>' +
          '<span>+' + xpPay + ' XP // +' + goldPay + ' G // [' + q.primaryStat + ' +' + S.DIFF[q.difficulty].stat + ']</span>' +
        '</div>' +

        '<div class="progress-bar-wrap" style="margin-bottom:8px;"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>' +

        '<div class="flex-between">' +
          progressControls +
          '<span class="font-mono" style="font-size:11px; color:var(--text-muted);">' + pct + '%</span>' +
        '</div>' +
      '</div>';
    },

    /* --- Bind Card Fast Logging & Hold-to-Seal --- */
    bindQuestCardEvents: function (col) {
      // Increments
      col.querySelectorAll('.log-inc-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-quest-id');
          var inc = btn.getAttribute('data-inc');
          if (S.audio) S.audio.tap();
          if (inc === 'MAX') S.maxProgress(id);
          else S.addProgress(id, Number(inc));
        });
      });

      // Enter Gate link
      col.querySelectorAll('.btn-enter-gate').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-quest-id');
          var q = S.getQuest(id);
          if (q && q.isPenaltyQuest) {
            S.startGate('P', { darkLock: true, isPenalty: true, linkedQuestId: id });
          } else {
            UI.pendingLinkedQuestId = id;
          }
          UI.setView('gate');
        });
      });

      // Delete quest
      col.querySelectorAll('.btn-delete-quest').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-quest-id');
          if (id) S.deleteQuest(id);
        });
      });

      // Hold-to-seal button
      col.querySelectorAll('.seal-btn').forEach(function (btn) {
        var id = btn.getAttribute('data-quest-id');
        var timer = null;
        var holdSound = null;

        function startHold(e) {
          e.preventDefault();
          btn.classList.add('holding');
          if (S.audio) holdSound = S.audio.sealHold();
          timer = setTimeout(function () {
            btn.classList.remove('holding');
            if (holdSound && holdSound.osc) {
              try { holdSound.osc.stop(); } catch (err) {}
            }
            if (S.audio) S.audio.questComplete();
            S.sealQuest(id);
          }, 800);
        }

        function cancelHold() {
          btn.classList.remove('holding');
          clearTimeout(timer);
          if (holdSound && holdSound.osc) {
            try { holdSound.osc.stop(); } catch (err) {}
          }
        }

        btn.addEventListener('mousedown', startHold);
        btn.addEventListener('touchstart', startHold, { passive: false });
        btn.addEventListener('mouseup', cancelHold);
        btn.addEventListener('mouseleave', cancelHold);
        btn.addEventListener('touchend', cancelHold);
      });
    },

    /* --- Column 3: Vault & Leaderboard --- */
    renderVaultColumn: function (col) {
      var p = S.state.profile;
      var r1 = p.equippedRelicIds[0] ? S.ITEM[p.equippedRelicIds[0]] : null;
      var r2 = p.equippedRelicIds[1] ? S.ITEM[p.equippedRelicIds[1]] : null;
      var shadow = p.activeShadowId ? S.ITEM[p.activeShadowId] : null;

      var rivals = S.boards('DIVISION').slice(0, 5);

      col.innerHTML = '<div class="system-panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title">' + I('vault', 18) + ' [EQUIPPED RELICS & SHADOW]</div>' +
          '<button class="sys-btn sm primary" id="btn-open-full-vault">OPEN VAULT</button>' +
        '</div>' +

        // Equipped Relics
        '<div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">' +
          UI.renderEquippedSlot(r1, 0) +
          UI.renderEquippedSlot(r2, 1) +
          (shadow ? '<div class="stat-row" style="border-color:var(--monarch-glow);">' +
            '<div class="stat-label-group">' +
              I('shadow', 18, 'ico-glow') +
              '<div>' +
                '<div class="font-mono text-accent" style="font-weight:700;">' + U.esc(shadow.name) + ' (SHADOW)</div>' +
                '<div style="font-size:11px; color:var(--text-muted);">' + shadow.buffDescription + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' : '') +
        '</div>' +

        // Quick Loot Boxes
        '<div class="panel-header" style="margin-bottom:8px;">' +
          '<div class="panel-title" style="font-size:13px;">' + I('box', 16) + ' RANDOM BOXES</div>' +
        '</div>' +

        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px;">' +
          '<button class="sys-btn gold" id="btn-open-blessed" ' + (S.state.inventory.boxes.BLESSED <= 0 ? 'disabled' : '') + '>' +
            I('box', 16) + ' BLESSED BOX (' + S.state.inventory.boxes.BLESSED + ')' +
          '</button>' +
          '<button class="sys-btn danger" id="btn-open-cursed" ' + (S.state.inventory.boxes.CURSED <= 0 ? 'disabled' : '') + '>' +
            I('box', 16) + ' CURSED BOX (' + S.state.inventory.boxes.CURSED + ')' +
          '</button>' +
        '</div>' +

        // Division Leaderboard Preview
        '<div class="panel-header" style="margin-bottom:8px;">' +
          '<div class="panel-title" style="font-size:13px;">' + I('trophy', 16) + ' DIVISION BRACKET</div>' +
          '<span class="font-mono text-accent" style="font-size:11px;">' + S.rank().code + ' LEAGUE</span>' +
        '</div>' +

        '<table class="leaderboard-table">' +
          '<thead><tr><th>#</th><th>HUNTER</th><th>HRS</th></tr></thead>' +
          '<tbody>' +
            rivals.map(function (row) {
              return '<tr class="' + (row.you ? 'user-row' : '') + '">' +
                '<td>' + row.pos + '</td>' +
                '<td>' + U.esc(row.name) + (row.you ? ' (YOU)' : '') + '</td>' +
                '<td style="text-align:right;">' + U.fmt(row.score) + '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';

      var btnFull = col.querySelector('#btn-open-full-vault');
      if (btnFull) btnFull.addEventListener('click', function () { UI.setView('vault'); });

      var btnBlessed = col.querySelector('#btn-open-blessed');
      if (btnBlessed) btnBlessed.addEventListener('click', function () { UI.handleOpenBox('BLESSED'); });

      var btnCursed = col.querySelector('#btn-open-cursed');
      if (btnCursed) btnCursed.addEventListener('click', function () { UI.handleOpenBox('CURSED'); });

      col.querySelectorAll('.btn-unequip').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          if (id) S.unequipRelic(id);
        });
      });
    },

    renderEquippedSlot: function (relic, slot) {
      if (!relic) {
        return '<div class="stat-row" style="opacity:0.5; border-style:dashed;">' +
          '<div class="stat-label-group">' +
            I('plus', 16) +
            '<span class="font-mono" style="font-size:11px; color:var(--text-muted);">RELIC SLOT ' + (slot + 1) + ' (EMPTY)</span>' +
          '</div>' +
        '</div>';
      }
      return '<div class="stat-row">' +
        '<div class="stat-label-group">' +
          I(relic.svgIconKey, 18, 'text-gold') +
          '<div>' +
            '<div class="font-mono" style="font-size:12px; font-weight:700; color:' + S.RARITY_COLOR[relic.rarity] + ';">' + U.esc(relic.name) + '</div>' +
            '<div style="font-size:10px; color:var(--text-muted);">' + relic.buffDescription + '</div>' +
          '</div>' +
        '</div>' +
        '<button class="sys-btn sm danger btn-unequip" data-id="' + relic.id + '">' + I('close', 12) + '</button>' +
      '</div>';
    },

    /* ======================================================================
       VIEW: HUNTER STATUS SHEET (DEDICATED FULL DOSSIER)
       ====================================================================== */
    renderStatusView: function (container) {
      var p = S.state.profile;
      var rank = S.rank();
      var vitals = S.vitals();
      var xpReq = S.xpReq(p.level);
      var xpFrac = Math.min(100, Math.floor((p.currentXp / xpReq) * 100));
      var activeTitleObj = S.ITEM[p.activeTitle];
      var rec = S.state.records;
      var buffs = S.activeBuffs();

      container.innerHTML = '<div class="system-panel" style="max-width:960px; margin:0 auto;">' +
        '<div class="panel-header">' +
          '<div class="panel-title">' + I('status', 20) + ' [HUNTER STATUS DOSSIER]</div>' +
          '<div class="sys-badge" style="color:' + rank.color + '">' + S.rankLabel(rank) + '</div>' +
        '</div>' +

        // Large Hunter Dossier Card
        '<div class="hunter-crest-card" style="padding:18px; margin-bottom:18px;">' +
          '<div class="avatar-hex" style="width:84px; height:84px; border-color:' + rank.color + '; box-shadow:0 0 20px ' + rank.color + '44;">' +
            '<span class="rank-letter" style="font-size:36px; color:' + rank.color + '">' + rank.letter + '</span>' +
          '</div>' +
          '<div class="hunter-meta" style="margin-left:14px;">' +
            '<div class="hunter-name" style="font-size:24px;">' + U.esc(p.hunterName) + '</div>' +
            '<div class="hunter-rank-title" style="font-size:14px; color:' + rank.color + ';">' + rank.title + ' // LEVEL ' + p.level + '</div>' +
            '<div class="hunter-active-title" style="font-size:13px; color:var(--text-muted);">"' + (activeTitleObj ? activeTitleObj.name : 'The Weakest Hunter') + '"</div>' +
            '<div class="flex-between font-mono" style="margin-top:8px; font-size:12px; gap:12px; flex-wrap:wrap;">' +
              '<span class="stat-pill streak">STREAK: ' + p.streakDays + ' DAYS (BEST: ' + p.maxStreak + 'D)</span>' +
              '<span class="stat-pill gold">GOLD: ' + U.fmt(p.gold) + '</span>' +
              '<span class="stat-pill essence">ESSENCE: ' + p.essenceStones + '</span>' +
              '<span class="stat-pill" style="color:var(--accent-core); border-color:var(--accent-core);">COMBAT POWER: ' + U.fmt(S.combatPower()) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // XP & Vitals
        '<div style="margin-bottom:18px;">' +
          '<div class="flex-between font-mono" style="font-size:12px; margin-bottom:4px; color:var(--text-muted);">' +
            '<span>EXPERIENCE PROGRESSION</span>' +
            '<span>' + U.fmt(p.currentXp) + ' / ' + U.fmt(xpReq) + ' XP (' + xpFrac + '%)</span>' +
          '</div>' +
          '<div class="progress-bar-wrap" style="height:12px;"><div class="progress-bar-fill" style="width:' + xpFrac + '%"></div></div>' +
        '</div>' +

        '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:18px;">' +
          '<div style="padding:10px; background:var(--bg-card); border:1px solid rgba(255,255,255,0.06); clip-path:var(--clip-chamfer-sm);">' +
            '<div class="font-mono" style="font-size:11px; color:var(--text-muted);">HEALTH POINTS (HP)</div>' +
            '<div class="font-mono" style="font-size:18px; font-weight:700; color:#39FF88;">' + U.fmt(vitals.hp) + '</div>' +
          '</div>' +
          '<div style="padding:10px; background:var(--bg-card); border:1px solid rgba(255,255,255,0.06); clip-path:var(--clip-chamfer-sm);">' +
            '<div class="font-mono" style="font-size:11px; color:var(--text-muted);">MANA POINTS (MP)</div>' +
            '<div class="font-mono" style="font-size:18px; font-weight:700; color:#00E5FF;">' + U.fmt(vitals.mp) + '</div>' +
          '</div>' +
          '<div style="padding:10px; background:var(--bg-card); border:1px solid rgba(255,255,255,0.06); clip-path:var(--clip-chamfer-sm);">' +
            '<div class="font-mono" style="font-size:11px; color:var(--text-muted);">FATIGUE ACCUMULATION</div>' +
            '<div class="font-mono" style="font-size:18px; font-weight:700; color:' + (p.fatigue >= 80 ? 'var(--penalty-crimson)' : 'var(--text-secondary)') + ';">' + Math.round(p.fatigue) + '%</div>' +
          '</div>' +
        '</div>' +

        // 2-Column Attributes & Radar Chart
        '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px; margin-bottom:18px;">' +
          '<div>' +
            '<div class="panel-header" style="margin-bottom:8px;">' +
              '<div class="panel-title" style="font-size:13px;">' + I('bolt', 16) + ' ATTRIBUTES ALLOCATION</div>' +
              (p.unallocatedAp > 0 ? '<div class="sys-badge text-gold font-mono" style="font-size:11px;">+' + p.unallocatedAp + ' AP AVAILABLE</div>' : '') +
            '</div>' +
            '<div class="attributes-list">' +
              S.STATS.map(function (st) {
                var val = p.stats[st];
                var info = S.STAT_INFO[st];
                return '<div class="stat-row" style="padding:8px 10px; margin-bottom:6px;">' +
                  '<div class="stat-label-group">' +
                    I(info.icon, 18, 'text-accent') +
                    '<div>' +
                      '<div class="stat-code" style="font-size:14px;">' + st + ' <span style="font-weight:400; font-size:12px; color:var(--text-muted);">' + info.name + '</span></div>' +
                      '<div style="font-size:10px; color:var(--text-muted);">' + info.desc + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div style="display:flex; align-items:center; gap:8px;">' +
                    '<span class="stat-value" style="font-size:18px;">' + val + '</span>' +
                    (p.unallocatedAp > 0 ? '<button class="sys-btn sm primary btn-alloc" data-stat="' + st + '">+</button>' : '') +
                  '</div>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +

          '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--bg-card); border:1px solid rgba(255,255,255,0.06); clip-path:var(--clip-chamfer); padding:14px;">' +
            '<div class="font-display" style="font-size:13px; font-weight:700; letter-spacing:0.1em; color:var(--text-muted); margin-bottom:6px;">5-AXIS STAT RADAR MATRIX</div>' +
            UI.renderRadarSvg(p.stats) +
          '</div>' +
        '</div>' +

        // Active Buffs Section
        '<div style="margin-bottom:18px;">' +
          '<div class="panel-header" style="margin-bottom:8px;">' +
            '<div class="panel-title" style="font-size:13px;">' + I('star', 16) + ' ACTIVE RELIC & SHADOW BUFFS</div>' +
          '</div>' +
          (buffs.length ?
            '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:8px;">' +
              buffs.map(function (b) {
                return '<div class="stat-row">' +
                  '<div class="font-mono text-accent" style="font-size:12px; font-weight:700;">' + U.esc(b.src) + '</div>' +
                  '<span class="font-mono text-gold" style="font-size:12px;">' + S.buffText([b]) + '</span>' +
                '</div>';
              }).join('') +
            '</div>' :
            '<div style="padding:14px; text-align:center; font-size:12px; color:var(--text-muted); background:var(--bg-card); clip-path:var(--clip-chamfer-sm);">' +
              'No active buffs. Equip artifacts from the Vault or extract Shadow Soldiers to gain combat passives.' +
            '</div>'
          ) +
        '</div>' +

        // Lifetime Hunter Records
        '<div>' +
          '<div class="panel-header" style="margin-bottom:8px;">' +
            '<div class="panel-title" style="font-size:13px;">' + I('radar', 16) + ' LIFETIME RECORD OF SERVICE</div>' +
          '</div>' +
          '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:8px;">' +
            '<div class="stat-row"><span class="font-mono" style="font-size:11px; color:var(--text-muted);">Quests Completed</span><span class="font-mono text-accent">' + rec.questsCompleted + '</span></div>' +
            '<div class="stat-row"><span class="font-mono" style="font-size:11px; color:var(--text-muted);">Total XP Earned</span><span class="font-mono text-accent">' + U.fmt(rec.totalXp) + '</span></div>' +
            '<div class="stat-row"><span class="font-mono" style="font-size:11px; color:var(--text-muted);">Gold Accumulated</span><span class="font-mono text-gold">' + U.fmt(rec.goldEarned) + '</span></div>' +
            '<div class="stat-row"><span class="font-mono" style="font-size:11px; color:var(--text-muted);">Focus Minutes</span><span class="font-mono text-accent">' + U.fmt(rec.focusMins) + 'm</span></div>' +
            '<div class="stat-row"><span class="font-mono" style="font-size:11px; color:var(--text-muted);">Gates Cleared</span><span class="font-mono text-accent">' + rec.gatesCleared + '</span></div>' +
            '<div class="stat-row"><span class="font-mono" style="font-size:11px; color:var(--text-muted);">Red Gates (S-Rank)</span><span class="font-mono text-danger">' + rec.redGates + '</span></div>' +
            '<div class="stat-row"><span class="font-mono" style="font-size:11px; color:var(--text-muted);">Penalties Survived</span><span class="font-mono text-accent">' + rec.penaltiesSurvived + '</span></div>' +
            '<div class="stat-row"><span class="font-mono" style="font-size:11px; color:var(--text-muted);">Exams Passed</span><span class="font-mono text-gold">' + rec.examsPassed + '</span></div>' +
            '<div class="stat-row"><span class="font-mono" style="font-size:11px; color:var(--text-muted);">Shadows Extracted</span><span class="font-mono" style="color:var(--monarch-glow);">' + rec.shadowsExtracted + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';

      container.querySelectorAll('.btn-alloc').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var stat = btn.getAttribute('data-stat');
          if (stat) {
            if (S.audio) S.audio.tap();
            S.allocate(stat);
            UI.renderStatusView(container);
          }
        });
      });
    },

    /* ======================================================================
       VIEW: DUNGEON GATE & DARK LOCK
       ====================================================================== */
    renderGateView: function (container) {
      var g = S.state.gate;
      if (g) {
        // Active Gate Screen
        var def = S.gateDef(g);
        var rem = S.gateRemaining();
        container.innerHTML = '<div class="system-panel" style="max-width:680px; margin:0 auto;">' +
          '<div class="panel-header">' +
            '<div class="panel-title">' + I('gate', 20) + ' ' + def.name + ' [' + g.phase + ' PHASE]</div>' +
            (g.darkLock ? '<div class="sys-badge text-danger font-mono">' + I('lock', 14) + ' DARK LOCK ACTIVE</div>' : '') +
          '</div>' +

          '<div class="gate-arena-wrap">' +
            '<div class="gate-tier-label">' + (g.breached ? '[GATE BREACHED - 50% XP CORRUPTED]' : def.desc) + '</div>' +
            '<div class="gate-portal-ring">' +
              '<svg class="gate-ring-svg" viewBox="0 0 200 200">' +
                '<circle cx="100" cy="100" r="90" fill="none" stroke="' + def.color + '" stroke-width="2" stroke-dasharray="10 6" opacity="0.4"/>' +
                '<circle cx="100" cy="100" r="75" fill="none" stroke="' + def.color + '" stroke-width="3" stroke-dasharray="25 15"/>' +
              '</svg>' +
              '<div class="gate-time-display" id="gate-timer-display" style="color:' + def.color + '">' + U.mmss(rem) + '</div>' +
            '</div>' +

            '<div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">' +
              (def.pausable && g.phase === 'FOCUS' ? (g.pausedAt ?
                '<button class="sys-btn lg primary" id="btn-gate-resume">' + I('play', 16) + ' RESUME</button>' :
                '<button class="sys-btn lg" id="btn-gate-pause">' + I('pause', 16) + ' PAUSE</button>'
              ) : '') +
              (g.phase === 'REST' ? '<button class="sys-btn lg primary" id="btn-gate-skip-rest">SKIP REST</button>' : '') +
              '<button class="sys-btn lg danger" id="btn-gate-abandon">' + I('exit', 16) + ' ABANDON GATE</button>' +
            '</div>' +
          '</div>' +
        '</div>';

        var btnPause = container.querySelector('#btn-gate-pause');
        if (btnPause) btnPause.addEventListener('click', function () { S.pauseGate(); });

        var btnResume = container.querySelector('#btn-gate-resume');
        if (btnResume) btnResume.addEventListener('click', function () { S.resumeGate(); });

        var btnSkip = container.querySelector('#btn-gate-skip-rest');
        if (btnSkip) btnSkip.addEventListener('click', function () { S.skipRest(); });

        var btnAbandon = container.querySelector('#btn-gate-abandon');
        if (btnAbandon) btnAbandon.addEventListener('click', function () { S.abandonGate(); });
        return;
      }

      // Gate Selector Screen
      var linkedQuest = UI.pendingLinkedQuestId ? S.getQuest(UI.pendingLinkedQuestId) : null;
      var inPenalty = S.state.profile.inPenaltyZone;

      container.innerHTML = '<div class="system-panel" style="max-width:860px; margin:0 auto;">' +
        '<div class="panel-header">' +
          '<div class="panel-title">' + I('gate', 20) + ' [SELECT DUNGEON GATE]</div>' +
          '<div class="flex-between gap-10">' +
            '<label class="flex-between gap-6 font-mono" style="cursor:pointer; font-size:12px; color:var(--text-secondary);">' +
              '<input type="checkbox" id="chk-dark-lock" checked style="accent-color:var(--accent-core);">' +
              I('lock', 14) + ' ENGAGE DARK LOCK (FULLSCREEN + FOCUS SHIELD)' +
            '</label>' +
          '</div>' +
        '</div>' +

        (linkedQuest ?
          '<div class="flex-between font-mono" style="padding:8px 12px; background:rgba(0,229,255,0.08); border:1px solid var(--accent-border); clip-path:var(--clip-chamfer-sm); margin-bottom:14px; font-size:12px;">' +
            '<span style="color:var(--accent-core); font-weight:700;">LINKED QUEST: "' + U.esc(linkedQuest.title) + '"</span>' +
            '<span style="color:var(--text-muted);">' + linkedQuest.targetProgress + ' ' + (S.UNITS[linkedQuest.unit] || 'min') + ' required</span>' +
          '</div>' : ''
        ) +

        (inPenalty ?
          '<div class="vault-card" style="border-color:var(--penalty-crimson); background:rgba(40,6,12,0.85); margin-bottom:14px; box-shadow:0 0 20px rgba(255,0,60,0.3);">' +
            '<div class="flex-between">' +
              '<span class="font-display" style="font-size:18px; font-weight:700; color:var(--penalty-crimson);">' + I('skull', 18) + ' [MANDATORY SURVIVAL GATE] PENALTY ZONE</span>' +
              '<span class="sys-badge" style="color:var(--penalty-crimson);">45 MIN // 0 XP</span>' +
            '</div>' +
            '<p style="font-size:12px; color:var(--text-secondary); margin:6px 0;">Survive 45 minutes of unbroken Dark Lock focus. Pausing and tab-switching are strictly forbidden. Clearing this gate restores normal System progression.</p>' +
            '<button class="sys-btn danger btn-launch-gate" data-gate-id="P" data-is-penalty="true" style="width:100%; margin-top:4px;">' +
              I('play', 14) + ' ENTER PENALTY SURVIVAL GATE' +
            '</button>' +
          '</div>' : ''
        ) +

        '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; margin-top:14px;">' +
          S.GATES.map(function (gate) {
            return '<div class="vault-card" style="border-color:' + gate.color + ';">' +
              '<div class="flex-between">' +
                '<span class="font-display" style="font-size:18px; font-weight:700; color:' + gate.color + ';">' + gate.name + '</span>' +
                '<span class="sys-badge" style="color:' + gate.color + ';">' + gate.focus + ' MIN</span>' +
              '</div>' +
              '<p style="font-size:12px; color:var(--text-muted);">' + gate.desc + '</p>' +
              '<div class="font-mono" style="font-size:11px; color:var(--text-secondary);">' +
                'REST: ' + (gate.rest > 0 ? gate.rest + 'm' : 'NONE') + ' // ESSENCE: +' + gate.essence + ' // LOOT: ' + Math.round(gate.lootChance * 100) + '%' +
              '</div>' +
              '<button class="sys-btn primary btn-launch-gate" data-gate-id="' + gate.id + '" style="margin-top:6px; border-color:' + gate.color + '; color:' + gate.color + ';">' +
                I('play', 14) + ' ENTER GATE' +
              '</button>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

      container.querySelectorAll('.btn-launch-gate').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var gateId = btn.getAttribute('data-gate-id');
          var isPenalty = gateId === 'P' || btn.getAttribute('data-is-penalty') === 'true';
          var chk = document.getElementById('chk-dark-lock');
          var darkLock = isPenalty ? true : (chk ? chk.checked : true);
          var linkedId = UI.pendingLinkedQuestId;
          UI.pendingLinkedQuestId = null;
          S.startGate(gateId, { darkLock: darkLock, isPenalty: isPenalty, linkedQuestId: linkedId });
        });
      });
    },

    /* ======================================================================
       VIEW: HUNTER\'S VAULT & COLLECTION (165 ITEMS)
       ====================================================================== */
    renderVaultView: function (container) {
      var categories = ['RELIC', 'CONSUMABLE', 'SKIN', 'TITLE', 'SHADOW'];
      var items = S.VAULT.filter(function (it) { return it.category === activeVaultTab; });
      var unlockedCount = S.collectionCount();

      container.innerHTML = '<div class="system-panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title">' + I('vault', 20) + ' [HUNTER\'S VAULT & ARSENAL]</div>' +
          '<div class="font-mono text-gold" style="font-size:12px;">UNLOCKED: ' + unlockedCount + ' / ' + S.VAULT.length + ' (' + Math.round((unlockedCount / S.VAULT.length) * 100) + '%)</div>' +
        '</div>' +

        // Tabs
        '<div class="vault-tabs">' +
          categories.map(function (cat) {
            return '<button class="vault-tab-btn ' + (activeVaultTab === cat ? 'active' : '') + '" data-tab="' + cat + '">' +
              cat + 'S (' + S.VAULT_COUNTS[cat] + ')' +
            '</button>';
          }).join('') +
          '<button class="vault-tab-btn" id="btn-shop-tab" style="margin-left:auto; border-color:var(--loot-mythic-gold); color:var(--loot-mythic-gold);">' +
            I('gold', 14) + ' SYSTEM SHOP' +
          '</button>' +
        '</div>' +

        // Item Grid
        '<div class="vault-grid" id="vault-items-grid">' +
          items.map(function (it) { return UI.renderVaultItemCard(it); }).join('') +
        '</div>' +
      '</div>';

      container.querySelectorAll('.vault-tab-btn[data-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeVaultTab = btn.getAttribute('data-tab');
          if (S.audio) S.audio.tap();
          UI.renderVaultView(container);
        });
      });

      var btnShop = container.querySelector('#btn-shop-tab');
      if (btnShop) btnShop.addEventListener('click', function () { UI.openShopModal(); });

      UI.bindVaultItemCardEvents(container);
    },

    renderVaultItemCard: function (it) {
      var unlocked = S.isUnlocked(it);
      var p = S.state.profile;
      var isEquipped = p.equippedRelicIds.indexOf(it.id) >= 0;
      var isActiveSkin = p.activeSkinId === it.id;
      var isActiveTitle = p.activeTitle === it.id;
      var isActiveShadow = p.activeShadowId === it.id;
      var qty = S.qty(it.id);

      var actions = '';
      if (unlocked) {
        if (it.category === 'RELIC') {
          actions = isEquipped ?
            '<button class="sys-btn sm danger btn-unequip-relic" data-id="' + it.id + '">UNEQUIP</button>' :
            '<button class="sys-btn sm primary btn-equip-relic" data-id="' + it.id + '">EQUIP</button>';
        } else if (it.category === 'CONSUMABLE') {
          actions = '<div class="flex-between">' +
            '<span class="font-mono text-accent">x' + qty + '</span>' +
            '<button class="sys-btn sm primary btn-use-consumable" data-id="' + it.id + '" ' + (qty <= 0 ? 'disabled' : '') + '>USE</button>' +
          '</div>';
        } else if (it.category === 'SKIN') {
          actions = isActiveSkin ?
            '<span class="sys-badge font-mono" style="color:var(--accent-core);">ACTIVE</span>' :
            '<button class="sys-btn sm primary btn-apply-skin" data-id="' + it.id + '">APPLY</button>';
        } else if (it.category === 'TITLE') {
          actions = isActiveTitle ?
            '<span class="sys-badge font-mono" style="color:var(--accent-core);">ACTIVE</span>' :
            '<button class="sys-btn sm primary btn-apply-title" data-id="' + it.id + '">EQUIP</button>';
        } else if (it.category === 'SHADOW') {
          if (it.kind === 'shadow') {
            var lvl = S.state.inventory.shadows[it.id] || 1;
            var upCost = S.shadowUpgradeCost(it.id);
            actions = '<div class="flex-between">' +
              '<span class="font-mono text-accent">LV. ' + lvl + '</span>' +
              '<div style="display:flex; gap:4px;">' +
                (!isActiveShadow ? '<button class="sys-btn sm btn-set-shadow" data-id="' + it.id + '">ACTIVE</button>' : '<span class="sys-badge font-mono" style="color:var(--accent-core);">SUMMONED</span>') +
                '<button class="sys-btn sm gold btn-up-shadow" data-id="' + it.id + '" title="' + upCost + ' Essence">EVOLVE (' + upCost + 'E)</button>' +
              '</div>' +
            '</div>';
          } else {
            actions = '<button class="sys-btn sm primary btn-set-border" data-id="' + it.id + '">SET BORDER</button>';
          }
        }
      } else {
        if (it.category === 'SKIN' && it.cost) {
          actions = '<button class="sys-btn sm gold btn-buy-skin" data-id="' + it.id + '">BUY (' + U.fmt(it.cost) + 'G)</button>';
        } else if (it.category === 'SHADOW' && it.kind === 'shadow') {
          actions = '<button class="sys-btn sm primary btn-extract-shadow" data-id="' + it.id + '">[ARISE] (' + it.cost + 'E)</button>';
        } else {
          actions = '<div class="font-mono" style="font-size:10px; color:var(--text-muted);">' + it.unlockRequirementText + '</div>';
        }
      }

      var cardCls = 'vault-card';
      if (!unlocked) cardCls += ' locked';
      if (isEquipped || isActiveSkin || isActiveTitle || isActiveShadow) cardCls += ' equipped';

      return '<div class="' + cardCls + '">' +
        '<div class="flex-between">' +
          '<div style="display:flex; align-items:center; gap:8px;">' +
            I(it.svgIconKey, 18, 'text-accent') +
            '<span class="font-mono" style="font-weight:700; font-size:12px; color:' + S.RARITY_COLOR[it.rarity] + ';">' + U.esc(it.name) + '</span>' +
          '</div>' +
          '<span class="font-mono" style="font-size:9px; color:' + S.RARITY_COLOR[it.rarity] + ';">' + it.rarity + '</span>' +
        '</div>' +

        '<div style="font-size:11px; color:var(--text-secondary); min-height:28px;">' + (it.buffDescription || it.loreDescription) + '</div>' +
        '<div style="margin-top:auto;">' + actions + '</div>' +
      '</div>';
    },

    bindVaultItemCardEvents: function (container) {
      container.querySelectorAll('.btn-equip-relic').forEach(function (btn) {
        btn.addEventListener('click', function () { S.equipRelic(btn.getAttribute('data-id')); });
      });
      container.querySelectorAll('.btn-unequip-relic').forEach(function (btn) {
        btn.addEventListener('click', function () { S.unequipRelic(btn.getAttribute('data-id')); });
      });
      container.querySelectorAll('.btn-use-consumable').forEach(function (btn) {
        btn.addEventListener('click', function () { S.useItem(btn.getAttribute('data-id')); });
      });
      container.querySelectorAll('.btn-apply-skin').forEach(function (btn) {
        btn.addEventListener('click', function () { S.applySkin(btn.getAttribute('data-id')); });
      });
      container.querySelectorAll('.btn-buy-skin').forEach(function (btn) {
        btn.addEventListener('click', function () { S.buySkin(btn.getAttribute('data-id')); });
      });
      container.querySelectorAll('.btn-apply-title').forEach(function (btn) {
        btn.addEventListener('click', function () { S.setTitle(btn.getAttribute('data-id')); });
      });
      container.querySelectorAll('.btn-extract-shadow').forEach(function (btn) {
        btn.addEventListener('click', function () { S.extractShadow(btn.getAttribute('data-id')); });
      });
      container.querySelectorAll('.btn-up-shadow').forEach(function (btn) {
        btn.addEventListener('click', function () { S.upgradeShadow(btn.getAttribute('data-id')); });
      });
      container.querySelectorAll('.btn-set-shadow').forEach(function (btn) {
        btn.addEventListener('click', function () { S.setShadow(btn.getAttribute('data-id')); });
      });
      container.querySelectorAll('.btn-set-border').forEach(function (btn) {
        btn.addEventListener('click', function () { S.setBorder(btn.getAttribute('data-id')); });
      });
    },

    /* ======================================================================
       VIEW: RANKINGS & PROMOTION EXAMS
       ====================================================================== */
    renderRankView: function (container) {
      var p = S.state.profile;
      var canExam = S.isEligibleForExam();
      var nextR = S.nextRank();
      var rows = S.boards(activeRankTab);

      container.innerHTML = '<div class="system-panel">' +
        '<div class="panel-header">' +
          '<div class="panel-title">' + I('trophy', 20) + ' [GLOBAL HUNTER ASSOCIATION RANKINGS]</div>' +
          '<div class="sys-badge font-mono text-gold">HRS: ' + U.fmt(S.seasonHrs().total) + '</div>' +
        '</div>' +

        // Promotion Exam Banner
        (canExam ? '<div class="penalty-timer-card" style="border-color:var(--loot-mythic-gold); background:rgba(255,183,3,0.08); margin-bottom:14px;">' +
          '<div style="display:flex; align-items:center; gap:10px;">' +
            I('star', 20, 'text-gold') +
            '<div>' +
              '<div class="font-display text-gold" style="font-weight:700; font-size:14px;">PROMOTION EXAM AVAILABLE // ADVANCE TO ' + nextR.code + '</div>' +
              '<div style="font-size:11px; color:var(--text-muted);">Pass high-intensity trials before midnight to promote. Skip disallowed.</div>' +
            '</div>' +
          '</div>' +
          '<button class="sys-btn gold" id="btn-start-exam">' + I('play', 14) + ' ENTER EXAM</button>' +
        '</div>' : '') +

        // Leaderboard Tabs
        '<div class="vault-tabs">' +
          '<button class="vault-tab-btn ' + (activeRankTab === 'VANGUARD' ? 'active' : '') + '" data-tab="VANGUARD">SEASONAL VANGUARD</button>' +
          '<button class="vault-tab-btn ' + (activeRankTab === 'DIVISION' ? 'active' : '') + '" data-tab="DIVISION">' + S.rank().code + ' DIVISION BRACKET</button>' +
          '<button class="vault-tab-btn ' + (activeRankTab === 'HALL' ? 'active' : '') + '" data-tab="HALL">HALL OF MONARCHS (ALL-TIME)</button>' +
        '</div>' +

        '<table class="leaderboard-table">' +
          '<thead>' +
            '<tr><th>#</th><th>HUNTER</th><th>RANK</th><th>' + (activeRankTab === 'HALL' ? 'LEVEL / STREAK' : 'HRS') + '</th><th style="text-align:right;">' + (activeRankTab === 'HALL' ? 'POWER' : 'SCORE') + '</th></tr>' +
          '</thead>' +
          '<tbody>' +
            rows.map(function (r) {
              return '<tr class="' + (r.you ? 'user-row' : '') + '">' +
                '<td>' + r.pos + '</td>' +
                '<td>' + U.esc(r.name) + (r.you ? ' (YOU)' : '') + '</td>' +
                '<td><span class="sys-badge" style="font-size:10px;">' + r.tier + '</span></td>' +
                '<td>' + (activeRankTab === 'HALL' ? 'Lv.' + r.level + ' / ' + r.streak + 'd' : U.fmt(r.score)) + '</td>' +
                '<td style="text-align:right;">' + U.fmt(r.score) + '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';

      container.querySelectorAll('.vault-tab-btn[data-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeRankTab = btn.getAttribute('data-tab');
          if (S.audio) S.audio.tap();
          UI.renderRankView(container);
        });
      });

      var btnExam = container.querySelector('#btn-start-exam');
      if (btnExam) btnExam.addEventListener('click', function () {
        S.startExam();
        UI.setView('quests');
      });
    },

    /* ======================================================================
       VIEW: SETTINGS & TOOLS
       ====================================================================== */
    renderSettingsView: function (container) {
      var p = S.state.profile;
      var set = S.state.settings;

      container.innerHTML = '<div class="system-panel" style="max-width:760px; margin:0 auto;">' +
        '<div class="panel-header">' +
          '<div class="panel-title">' + I('settings', 20) + ' [SYSTEM CONFIGURATION & PROTOCOLS]</div>' +
        '</div>' +

        // Audio & Audio Volume
        '<div style="margin-bottom:18px;">' +
          '<div class="font-display" style="font-size:14px; font-weight:700; margin-bottom:8px;">AUDIO SYNTHESIZER</div>' +
          '<div class="flex-between" style="padding:10px; background:var(--bg-card); clip-path:var(--clip-chamfer-sm); margin-bottom:8px;">' +
            '<span>Sound Synthesis Engine</span>' +
            '<input type="checkbox" id="set-sound" ' + (set.sound ? 'checked' : '') + ' style="accent-color:var(--accent-core); width:18px; height:18px;">' +
          '</div>' +
          '<div class="flex-between" style="padding:10px; background:var(--bg-card); clip-path:var(--clip-chamfer-sm);">' +
            '<span>Volume Level</span>' +
            '<input type="range" id="set-volume" min="0" max="1" step="0.05" value="' + (set.volume != null ? set.volume : 0.5) + '" style="accent-color:var(--accent-core); width:140px;">' +
          '</div>' +
        '</div>' +

        // Penalty Mode Toggle
        '<div style="margin-bottom:18px;">' +
          '<div class="font-display" style="font-size:14px; font-weight:700; margin-bottom:8px;">ACCOUNTABILITY DIRECTIVE</div>' +
          '<div class="flex-between" style="padding:10px; background:var(--bg-card); clip-path:var(--clip-chamfer-sm);">' +
            '<div>' +
              '<div style="font-weight:700;">Penalty Zone Mode</div>' +
              '<div style="font-size:11px; color:var(--text-muted);">' + (p.penaltyMode === 'HARDCORE' ? 'Mandatory Blood Crimson lockout on midnight miss.' : 'Optional redemption quests with streak recovery.') + '</div>' +
            '</div>' +
            '<button class="sys-btn ' + (p.penaltyMode === 'HARDCORE' ? 'danger' : 'primary') + '" id="btn-toggle-penalty-mode">' +
              p.penaltyMode + ' MODE' +
            '</button>' +
          '</div>' +
        '</div>' +

        // Data Management (Import / Export / Reset)
        '<div style="margin-bottom:18px;">' +
          '<div class="font-display" style="font-size:14px; font-weight:700; margin-bottom:8px;">HUNTER ARCHIVES (DATA BACKUP)</div>' +
          '<div style="display:flex; gap:8px; flex-wrap:wrap;">' +
            '<button class="sys-btn primary" id="btn-export-data">' + I('download', 14) + ' EXPORT SAVE FILE</button>' +
            '<label class="sys-btn" style="cursor:pointer;">' +
              I('upload', 14) + ' IMPORT SAVE FILE' +
              '<input type="file" id="file-import-data" accept=".json" style="display:none;">' +
            '</label>' +
            '<button class="sys-btn danger" id="btn-reset-data">' + I('trash', 14) + ' PURGE SYSTEM MEMORY</button>' +
          '</div>' +
        '</div>' +

        // Simulation / Midnight Testing Protocol
        '<div>' +
          '<div class="font-display text-gold" style="font-size:14px; font-weight:700; margin-bottom:8px;">TIME ENGINE / MIDNIGHT SIMULATOR</div>' +
          '<p style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">Advances System time by 24 hours to test midnight evaluation, streak increments, and penalty zone triggers.</p>' +
          '<button class="sys-btn gold" id="btn-sim-midnight">' + I('clock', 14) + ' SIMULATE 00:00:00 MIDNIGHT ROLLOVER</button>' +
        '</div>' +
      '</div>';

      var setSound = container.querySelector('#set-sound');
      if (setSound) setSound.addEventListener('change', function () {
        S.audio.setSound(setSound.checked);
      });

      var setVol = container.querySelector('#set-volume');
      if (setVol) setVol.addEventListener('input', function () {
        S.audio.setVolume(Number(setVol.value));
      });

      var btnMode = container.querySelector('#btn-toggle-penalty-mode');
      if (btnMode) btnMode.addEventListener('click', function () {
        p.penaltyMode = p.penaltyMode === 'HARDCORE' ? 'OPTIONAL' : 'HARDCORE';
        S.notify('[DIRECTIVE UPDATED]', 'Switched to ' + p.penaltyMode + ' Penalty Mode.', 'info');
        S.commit();
      });

      var btnExport = container.querySelector('#btn-export-data');
      if (btnExport) btnExport.addEventListener('click', function () {
        var blob = new Blob([S.exportData()], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'solo_system_save_' + p.hunterName.toLowerCase() + '.json';
        a.click();
      });

      var fileImport = container.querySelector('#file-import-data');
      if (fileImport) fileImport.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var r = new FileReader();
        r.onload = function () {
          try {
            S.importData(r.result);
            S.notify('[ARCHIVE RESTORED]', 'System state successfully imported.', 'gold');
          } catch (err) {
            S.notify('[CORRUPT DATA]', 'Could not restore save file: ' + err.message, 'danger');
          }
        };
        r.readAsText(file);
      });

      var btnReset = container.querySelector('#btn-reset-data');
      if (btnReset) btnReset.addEventListener('click', function () {
        if (confirm('[SYSTEM PURGE WARNING] Erase all Hunter progress, records, and Vault items?')) {
          S.resetAll();
        }
      });

      var btnSim = container.querySelector('#btn-sim-midnight');
      if (btnSim) btnSim.addEventListener('click', function () {
        S.simulateMidnight();
      });
    },

    /* ======================================================================
       MODALS & DIALOGS
       ====================================================================== */
    openLevelUpModal: function (level) {
      UI.openModal(
        '<div style="text-align:center;">' +
          '<div class="sys-badge font-display text-gold" style="font-size:22px; letter-spacing:0.18em; margin-bottom:8px;">[LEVEL UP!]</div>' +
          '<div class="font-mono text-accent" style="font-size:48px; font-weight:800; margin-bottom:12px;">LV. ' + level + '</div>' +
          '<p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">The System has recognized your ascension. Vitality and mana capacities expanded.</p>' +
          '<div style="display:flex; justify-content:center; gap:16px; margin-bottom:20px;">' +
            '<div class="stat-pill gold font-mono">+5 ABILITY POINTS (AP)</div>' +
            '<div class="stat-pill essence font-mono">+3 ESSENCE STONES</div>' +
          '</div>' +
          '<button class="sys-btn lg primary btn-close-modal" style="width:100%;">ACKNOWLEDGE ASCENSION</button>' +
        '</div>'
      );
    },

    openRankUpModal: function (rank) {
      UI.openModal(
        '<div style="text-align:center;">' +
          '<div class="sys-badge font-display text-gold" style="font-size:22px; letter-spacing:0.18em; margin-bottom:8px;">[PROMOTION EXAM CLEARED]</div>' +
          '<div class="font-display" style="font-size:36px; font-weight:700; color:' + rank.color + '; margin-bottom:8px;">' + rank.title + '</div>' +
          '<div class="font-mono text-accent" style="font-size:16px; margin-bottom:16px;">OFFICIAL RANK: ' + rank.code + '</div>' +
          '<p style="font-size:13px; color:var(--text-secondary); margin-bottom:20px;">The Hunter Association has revised your classification. Greater daily rewards and dangerous gates now await.</p>' +
          '<button class="sys-btn lg gold btn-close-modal" style="width:100%;">PROCEED AS ' + rank.code + ' HUNTER</button>' +
        '</div>'
      );
    },

    openJobChangeModal: function () {
      UI.openModal(
        '<div style="text-align:center;">' +
          '<div class="sys-badge font-display" style="color:var(--monarch-glow); font-size:22px; letter-spacing:0.18em; margin-bottom:8px;">[JOB CHANGE QUEST: UNSEALED]</div>' +
          '<div class="font-display" style="font-size:36px; font-weight:700; color:var(--monarch-glow); margin-bottom:12px;">[ARISE]</div>' +
          '<p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">You have surpassed the limitations of ordinary Hunters. The authority of the Shadow Monarch awakens within your soul.</p>' +
          '<div class="stat-pill font-mono" style="color:var(--monarch-glow); border-color:var(--monarch-glow); margin-bottom:20px;">SHADOW EXTRACTION MATRIX UNLOCKED IN THE VAULT</div>' +
          '<button class="sys-btn lg primary btn-close-modal" style="width:100%; border-color:var(--monarch-glow); color:var(--monarch-glow);">COMMAND THE SHADOWS</button>' +
        '</div>'
      );
    },

    openPenaltyModal: function (ev) {
      if (ev.mode === 'HARDCORE') {
        UI.openModal(
          '<div style="text-align:center;">' +
            '<div class="sys-badge font-display text-danger" style="font-size:22px; letter-spacing:0.18em; margin-bottom:8px;">[SYSTEM WARNING: PENALTY ZONE]</div>' +
            '<p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">Mandatory Daily Quests were not fulfilled before 00:00:00. Normal progression is suspended.</p>' +
            '<div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">' +
              '<button class="sys-btn danger btn-penalty-choice" data-type="PHYSICAL">' + I('gauntlet', 16) + ' PHYSICAL PENALTY (BURPEES / PLANK / RUN)</button>' +
              '<button class="sys-btn danger btn-penalty-choice" data-type="FOCUS">' + I('gate', 16) + ' 45-MIN DARK LOCK FOCUS SURVIVAL</button>' +
            '</div>' +
            (S.qty('c_purify') > 0 ? '<button class="sys-btn gold" id="btn-purify-penalty">' + I('essence', 16) + ' USE PURIFICATION STONE</button>' : '') +
          '</div>'
        );

        document.querySelectorAll('.btn-penalty-choice').forEach(function (b) {
          b.addEventListener('click', function () {
            S.choosePenalty(b.getAttribute('data-type'));
            UI.closeModal();
          });
        });

        var btnPurify = document.getElementById('btn-purify-penalty');
        if (btnPurify) btnPurify.addEventListener('click', function () {
          S.purify();
          UI.closeModal();
        });
      }
    },

    openForgeModal: function () {
      UI.openModal(
        '<div>' +
          '<div class="panel-header">' +
            '<div class="panel-title">' + I('forge', 18) + ' [FORGE CUSTOM DAILY QUEST]</div>' +
          '</div>' +
          '<form id="form-forge" style="display:flex; flex-direction:column; gap:12px;">' +
            '<div>' +
              '<label class="font-mono" style="font-size:11px; color:var(--text-muted);">QUEST TITLE</label>' +
              '<input type="text" class="sys-input" id="forge-title" required placeholder="e.g., Incline Dumbbell Press">' +
            '</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">' +
              '<div>' +
                '<label class="font-mono" style="font-size:11px; color:var(--text-muted);">CATEGORY</label>' +
                '<select class="sys-select" id="forge-cat">' +
                  Object.keys(S.CATS).filter(function (k) { return k !== 'PENALTY'; }).map(function (k) {
                    return '<option value="' + k + '">' + S.CATS[k].label + '</option>';
                  }).join('') +
                '</select>' +
              '</div>' +
              '<div>' +
                '<label class="font-mono" style="font-size:11px; color:var(--text-muted);">DIFFICULTY</label>' +
                '<select class="sys-select" id="forge-diff">' +
                  ['E', 'D', 'C', 'B', 'A', 'S'].map(function (d) {
                    return '<option value="' + d + '" ' + (d === 'C' ? 'selected' : '') + '>' + d + '-Rank (' + S.DIFF[d].base + ' XP)</option>';
                  }).join('') +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">' +
              '<div>' +
                '<label class="font-mono" style="font-size:11px; color:var(--text-muted);">TARGET VOLUME</label>' +
                '<input type="number" class="sys-input" id="forge-target" min="1" value="50">' +
              '</div>' +
              '<div>' +
                '<label class="font-mono" style="font-size:11px; color:var(--text-muted);">UNIT / MODE</label>' +
                '<select class="sys-select" id="forge-unit">' +
                  '<option value="REPS">Reps (Counter)</option>' +
                  '<option value="KM">Kilometers (Distance)</option>' +
                  '<option value="MINS">Minutes (Focus Gate)</option>' +
                  '<option value="SETS">Sets</option>' +
                  '<option value="CHECK">Single Check (Binary)</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex; gap:12px; margin-top:8px;">' +
              '<label class="font-mono" style="font-size:12px; display:flex; align-items:center; gap:6px;">' +
                '<input type="checkbox" id="forge-mand" checked style="accent-color:var(--accent-core);">' +
                'MANDATORY FOR STREAK' +
              '</label>' +
            '</div>' +
            '<div style="display:flex; justify-content:flex-end; gap:8px; margin-top:14px;">' +
              '<button type="button" class="sys-btn btn-close-modal">CANCEL</button>' +
              '<button type="submit" class="sys-btn primary">REGISTER QUEST</button>' +
            '</div>' +
          '</form>' +
        '</div>'
      );

      var form = document.getElementById('form-forge');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var title = document.getElementById('forge-title').value;
          var cat = document.getElementById('forge-cat').value;
          var diff = document.getElementById('forge-diff').value;
          var target = Number(document.getElementById('forge-target').value) || 1;
          var unit = document.getElementById('forge-unit').value;
          var mand = document.getElementById('forge-mand').checked;
          var mode = unit === 'CHECK' ? 'CHECK' : unit === 'MINS' ? 'DURATION' : 'COUNTER';

          S.addQuest({
            title: title,
            category: cat,
            difficulty: diff,
            target: target,
            unit: unit,
            mode: mode,
            isMandatory: mand
          });

          if (S.audio) S.audio.questComplete();
          UI.closeModal();
        });
      }
    },

    openShopModal: function () {
      UI.openModal(
        '<div>' +
          '<div class="panel-header">' +
            '<div class="panel-title">' + I('gold', 18) + ' [HUNTER ASSOCIATION COMMISSARY]</div>' +
            '<div class="font-mono text-gold">' + U.fmt(S.state.profile.gold) + ' G // ' + S.state.profile.essenceStones + ' E</div>' +
          '</div>' +
          '<div style="display:flex; flex-direction:column; gap:8px; max-height:60vh; overflow-y:auto; padding-right:4px;">' +
            S.SHOP.map(function (item) {
              var isBox = !!item.box;
              var name = isBox ? item.name : S.ITEM[item.id].name;
              var desc = isBox ? item.desc : S.ITEM[item.id].buffDescription;
              var icon = isBox ? 'box' : S.ITEM[item.id].svgIconKey;
              return '<div class="stat-row">' +
                '<div class="stat-label-group">' +
                  I(icon, 18, 'text-accent') +
                  '<div>' +
                    '<div class="font-mono" style="font-weight:700; font-size:12px;">' + U.esc(name) + '</div>' +
                    '<div style="font-size:10px; color:var(--text-muted);">' + desc + '</div>' +
                  '</div>' +
                '</div>' +
                '<button class="sys-btn sm ' + (item.cur === 'gold' ? 'gold' : 'primary') + ' btn-buy-shop" data-id="' + item.id + '">' +
                  item.price + (item.cur === 'gold' ? ' G' : ' E') +
                '</button>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>'
      );

      document.querySelectorAll('.btn-buy-shop').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          if (id) {
            if (S.shopBuy(id)) {
              if (S.audio) S.audio.tap();
              UI.openShopModal();
            }
          }
        });
      });
    },

    handleOpenBox: function (type) {
      var res = S.openBox(type);
      if (!res) return;
      if (S.audio) S.audio.lootOpen(res.rarity);

      UI.openModal(
        '<div style="text-align:center;">' +
          '<div class="sys-badge font-display" style="font-size:20px; color:' + S.RARITY_COLOR[res.rarity] + '; margin-bottom:8px;">' +
            '[' + res.rarity + ' ' + (res.item.category) + ' UNLOCKED]' +
          '</div>' +
          '<div style="margin:16px 0;">' +
            I(res.item.svgIconKey, 48, 'text-gold ico-glow') +
          '</div>' +
          '<div class="font-display" style="font-size:24px; font-weight:700; color:' + S.RARITY_COLOR[res.rarity] + '; margin-bottom:8px;">' +
            U.esc(res.item.name) +
          '</div>' +
          '<p style="font-size:13px; color:var(--text-secondary); margin-bottom:14px;">' +
            (res.item.buffDescription || res.item.loreDescription) +
          '</p>' +
          (res.dup ? '<div class="stat-pill essence font-mono" style="margin-bottom:10px;">DUPLICATE COMPENSATION: +' + res.essence + ' ESSENCE STONES</div>' : '') +
          '<div class="stat-pill gold font-mono" style="margin-bottom:16px;">+' + res.gold + ' GOLD ACQUIRED</div>' +
          (res.curse ? '<div class="stat-pill font-mono text-danger" style="border-color:var(--penalty-crimson); margin-bottom:16px;">' + res.curse + '</div>' : '') +
          '<button class="sys-btn lg primary btn-close-modal" style="width:100%;">CLAIM REWARD</button>' +
        '</div>'
      );
    },

    renderAwakeningModal: function () {
      UI.openModal(
        '<div>' +
          '<div style="text-align:center; margin-bottom:16px;">' +
            '<div class="sys-badge font-display text-accent" style="font-size:24px; letter-spacing:0.18em; margin-bottom:6px;">[THE SYSTEM HAS AWAKENED]</div>' +
            '<p style="font-size:13px; color:var(--text-secondary);">You versus your old self, one quest at a time.</p>' +
          '</div>' +
          '<form id="form-awaken" style="display:flex; flex-direction:column; gap:14px;">' +
            '<div>' +
              '<label class="font-mono" style="font-size:11px; color:var(--text-muted);">HUNTER DESIGNATION (NAME)</label>' +
              '<input type="text" class="sys-input" id="awaken-name" placeholder="SUNG JIN-WOO" maxlength="18" required>' +
            '</div>' +
            '<div>' +
              '<label class="font-mono" style="font-size:11px; color:var(--text-muted);">ACCOUNTABILITY DIRECTIVE (PENALTY MODE)</label>' +
              '<select class="sys-select" id="awaken-mode">' +
                '<option value="OPTIONAL">Standard Accountability (Optional Penalty + Streak Recovery)</option>' +
                '<option value="HARDCORE">Hardcore Manhwa Mode (Mandatory Blood Crimson Penalty Zone)</option>' +
              '</select>' +
            '</div>' +
            '<label class="font-mono" style="font-size:12px; display:flex; align-items:center; gap:8px;">' +
              '<input type="checkbox" id="awaken-preset" checked style="accent-color:var(--accent-core);">' +
              'INSTALL CANONICAL SYSTEM PRESET (PUSH-UPS, SIT-UPS, SQUATS, 10KM)' +
            '</label>' +
            '<button type="submit" class="sys-btn lg primary" style="margin-top:10px;">ACCEPT PLAYER SYSTEM CONTRACT</button>' +
          '</form>' +
        '</div>'
      );

      var form = document.getElementById('form-awaken');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var name = document.getElementById('awaken-name').value;
          var mode = document.getElementById('awaken-mode').value;
          var preset = document.getElementById('awaken-preset').checked;
          S.awaken(name, mode, preset);
          if (S.audio) S.audio.windowOpen();
          UI.closeModal();
        });
      }
    },

    /* --- Generic Modal Helpers --- */
    openModal: function (html) {
      var modal = document.getElementById('system-modal');
      var content = document.getElementById('modal-content');
      if (!modal || !content) return;
      content.innerHTML = html;
      modal.classList.add('open');

      content.querySelectorAll('.btn-close-modal').forEach(function (btn) {
        btn.addEventListener('click', UI.closeModal);
      });
    },

    closeModal: function () {
      var modal = document.getElementById('system-modal');
      if (modal) modal.classList.remove('open');
    },

    /* --- Toast Notification System --- */
    showToast: function (title, body, type) {
      var container = document.getElementById('toast-container');
      if (!container) return;

      var toast = document.createElement('div');
      toast.className = 'sys-toast ' + (type || 'info');
      toast.innerHTML = I('alert', 18, type === 'danger' ? 'text-danger' : type === 'gold' ? 'text-gold' : 'text-accent') +
        '<div>' +
          '<div class="font-display" style="font-size:13px; font-weight:700; letter-spacing:0.06em;">' + U.esc(title) + '</div>' +
          '<div style="font-size:11px; color:var(--text-secondary);">' + U.esc(body) + '</div>' +
        '</div>';

      container.appendChild(toast);
      setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 260);
      }, 4200);
    }
  };
})(window.SYS);

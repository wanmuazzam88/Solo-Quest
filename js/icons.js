/* ==========================================================================
   THE SYSTEM // Bespoke SVG Icon Library (zero-emoji mandate)
   All glyphs: 24x24 viewBox, stroke="currentColor", stroke-width 1.5, fill none.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';
  var F = 'fill="currentColor" stroke="none"';
  var P = {
    alert: '<path d="M12 1.8 21 7v10l-9 5.2L3 17V7z"/><path d="M12 4.6l6.6 3.8v7.2L12 19.4l-6.6-3.8V8.4z" opacity=".45"/><path d="M12 6.8l1.5 1.5L12 14l-1.5-5.7z" ' + F + '/><path d="M12 15.4l1.1 1.1-1.1 1.1-1.1-1.1z" ' + F + '/>',
    gauntlet: '<path d="M7 21v-5.5L5 12V6.5l1.5-1 1.5 1V11"/><path d="M8 11V4l1.5-1L11 4v7"/><path d="M11 11V3.5l1.5-1 1.5 1V11"/><path d="M14 11.5V5l1.5-1L17 5v8.5l-2 2.5V21"/><path d="M7 21h8"/><path d="M9 15h5" opacity=".6"/><path d="M18.5 3.5 21 2l-1.2 2.6-2.3 4.4"/><path d="M4.5 9 2.5 6.5l2.5.5"/>',
    barbell: '<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><circle cx="12" cy="12" r="2.4"/><path d="M12 9.6V6.2M12 14.4v3.4M9.6 12H6.3M14.4 12h3.3"/><circle cx="12" cy="6" r=".7" ' + F + '/><circle cx="12" cy="18" r=".7" ' + F + '/><circle cx="6" cy="12" r=".7" ' + F + '/><circle cx="18" cy="12" r=".7" ' + F + '/>',
    boot: '<path d="M9 3h4.5v8l5 3v3.5H6V14l3-1z"/><path d="M6 20.5h12.5"/><path d="M13.5 7l5-3 3 1-4.5 2.5"/><path d="M14.5 9.5l4-1.5 2.5 1-3.5 1.5" opacity=".6"/><path d="M1.5 9.5l2 2.5-2 2.5M4.5 8.5l2.2 3.5-2.2 3.5"/>',
    tome: '<path d="M3.5 4H11a1.5 1.5 0 0 1 1 1 1.5 1.5 0 0 1 1-1h7.5v15H13a1.5 1.5 0 0 0-1 1 1.5 1.5 0 0 0-1-1H3.5z"/><path d="M12 5v15"/><path d="M5 11.5S6.5 9 8 9s3 2.5 3 2.5S9.5 14 8 14s-3-2.5-3-2.5z"/><circle cx="8" cy="11.5" r=".9" ' + F + '/><path d="M14.5 8h4M14.5 11h4M14.5 14h3"/>',
    gate: '<circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="12" r="5.6" stroke-dasharray="2 1.6"/><circle cx="12" cy="12" r="2" ' + F + '/><path d="M12 1v3.2M12 19.8V23M1 12h3.2M19.8 12H23"/><path d="M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" opacity=".55"/>',
    vit: '<path d="M12 20.5 3.5 12 3 8.2 6 4.5h3L12 7l3-2.5h3L21 8.2 20.5 12z"/><path d="M5.5 11.5h3l1.5-3 2 6 1.5-3h5"/>',
    quests: '<path d="M5 2.5h14v19H5z"/><path d="M8 7.5h1.2M11 7.5h5M8 12h1.2M11 12h5M8 16.5h1.2M11 16.5h5"/><path d="M9 2.5v-1h6v1" />',
    status: '<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><circle cx="12" cy="10" r="3"/><path d="M7 17.3c1-2.4 3-3.5 5-3.5s4 1.1 5 3.5"/>',
    lock: '<path d="M5.5 10h13v11h-13z"/><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3"/><path d="M12 13.5v3.5"/><circle cx="12" cy="13.5" r=".9" ' + F + '/>',
    vault: '<path d="M3 9h18v11.5H3z"/><path d="M3 9l2-5h14l2 5"/><path d="M10 12h4v3.5h-4z"/><path d="M3 14h7M14 14h7"/>',
    rank: '<path d="M3.5 18 2 7l5.5 4L12 4l4.5 7L22 7l-1.5 11z"/><path d="M3.5 21h17"/><path d="M12 12l1.5 2-1.5 2-1.5-2z" ' + F + '/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="6.6"/><path d="M12 2v3.4M12 18.6V22M2 12h3.4M18.6 12H22M4.9 4.9l2.4 2.4M16.7 16.7l2.4 2.4M19.1 4.9l-2.4 2.4M7.3 16.7l-2.4 2.4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    sword: '<path d="M21 3v4L10.5 17.5l-4-4L17 3z"/><path d="M4.5 12.5l7 7M7.5 16.5 3 21"/><path d="M17 3l4 4" opacity=".5"/>',
    dagger: '<path d="M19.5 3.5 20.5 4.5 12 14l-2-2z"/><path d="M7.5 10.5l6 6M10 14.5 4.5 20M3.5 19l1.5 1.5"/>',
    orb: '<circle cx="12" cy="10" r="6.5"/><path d="M7 21h10M9.2 16l-1.2 5M14.8 16l1.2 5"/><path d="M9 8.2a3.5 3.5 0 0 1 3-2.2" opacity=".7"/><circle cx="12" cy="10" r="1.6" ' + F + '/>',
    ring: '<circle cx="12" cy="14.5" r="6.5"/><circle cx="12" cy="14.5" r="4" opacity=".45"/><path d="M9 5l3-3 3 3-3 2.6z"/>',
    horn: '<path d="M3.5 20.5c8.5 0 15-6.5 17-17-3 5.2-8.2 8.3-14.2 9.3z"/><path d="M8 15.5l2 2M11 13.3l2 2M14 10.6l1.8 1.8" opacity=".7"/>',
    lantern: '<path d="M9 3h6M12 3v2.2M8 7.2h8l1 2v8l-1 2H8l-1-2v-8z"/><path d="M12 10l1.6 2.6L12 15.2l-1.6-2.6z" ' + F + '/><path d="M9 21.5h6"/>',
    necklace: '<path d="M4.5 2.5c0 6.5 3.2 10.5 7.5 10.5s7.5-4 7.5-10.5"/><path d="M12 13l3.2 3.2L12 21.5l-3.2-5.3z"/>',
    axe: '<path d="M5 21.5 16.5 5"/><path d="M12.5 3.5c3.2-1.2 6.5-.2 8.5 2-1 3.3-3.2 5.5-6.5 5.7z"/>',
    bow: '<path d="M18.5 3C10 4 4 10 3 18.5"/><path d="M18.5 3 3 18.5"/><path d="M13 11l8-8M21 3h-3.5M21 3v3.5"/>',
    cup: '<path d="M5.5 3h13l-1 7.5a5.5 5.5 0 0 1-11 0z"/><path d="M12 16v4M7.5 21h9"/><path d="M8 7h8" opacity=".55"/>',
    cloak: '<path d="M12 2.5 7 6 3.5 21.5h17L17 6z"/><path d="M9.5 4.5 12 12l2.5-7.5"/>',
    spear: '<path d="M21 3 3 21"/><path d="M21 3l-1.2 6.5-5.3-5.3z" ' + F + '/><path d="M7 15l2 2" />',
    core: '<path d="M12 2l8 6-3 12.5H7L4 8z"/><circle cx="12" cy="11" r="3"/><circle cx="12" cy="11" r="1" ' + F + '/>',
    potion: '<path d="M9 2h6M10 2v6.2L5 18a2.5 2.5 0 0 0 2.2 3.5h9.6A2.5 2.5 0 0 0 19 18l-5-9.8V2"/><path d="M6.8 14.5h10.4"/><circle cx="10.5" cy="17.5" r=".8" ' + F + '/><circle cx="13.8" cy="18.5" r=".6" ' + F + '/>',
    key: '<circle cx="7.5" cy="12" r="4.8"/><circle cx="7.5" cy="12" r="1.6"/><path d="M12.3 12H22M18.5 12v4M21.5 12v3"/>',
    rune: '<path d="M12 2l9 10-9 10-9-10z"/><path d="M12 6.5v11M9 9.5l3 2.2 3-2.2M9 15l3-3 3 3"/>',
    skin: '<path d="M12 2l8.66 5v10L12 22l-8.66-5V7z"/><path d="M12 2v20M3.34 7l17.32 10M20.66 7 3.34 17" opacity=".45"/><circle cx="12" cy="12" r="2.2" ' + F + '/>',
    title: '<path d="M12 2l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V5h4z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    shadow: '<path d="M12 2C8 5 6 8.8 6 13v8.5l3-2 3 2.5 3-2.5 3 2v-8.5C18 8.8 16 5 12 2z"/><path d="M8.6 11.6l2.6 1.2M15.4 11.6l-2.6 1.2"/>',
    gold: '<path d="M12 2.8l7.8 4.5v9.4L12 21.2l-7.8-4.5V7.3z"/><path d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5z"/><path d="M12 10v4" />',
    essence: '<path d="M12 2l5.2 6.2L12 22 6.8 8.2z"/><path d="M6.8 8.2h10.4M12 2v20" opacity=".55"/>',
    streak: '<path d="M12 2l3 6 3-2v7.5a6 6 0 0 1-12 0V9l3 2z"/><path d="M12 13l2 3a2 2 0 0 1-4 0z" ' + F + '/>',
    box: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/><path d="M7.5 4.5l9 5" opacity=".6"/>',
    star: '<path d="M12 2l2.6 7.4H22l-6 4.6 2.3 7.5L12 17l-6.3 4.5L8 14 2 9.4h7.4z"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',
    stop: '<path d="M5 5h14v14H5z"/>',
    fullscreen: '<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>',
    sound: '<path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M16 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13"/>',
    mute: '<path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    skull: '<path d="M12 2a8 8 0 0 0-8 8v4l2 2v4.5h12V16l2-2v-4a8 8 0 0 0-8-8z"/><path d="M7.8 10.5h2.8v2.8H7.8zM13.4 10.5h2.8v2.8h-2.8z" ' + F + '/><path d="M12 15l-1 2h2zM10 20.5v-2M14 20.5v-2"/>',
    shield: '<path d="M12 2l8 3v6.2c0 5-3.5 9-8 10.8-4.5-1.8-8-5.8-8-10.8V5z"/><path d="M12 6v12M7 10.5h10" opacity=".55"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1" ' + F + '/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    trash: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15"/><path d="M10 10v7M14 10v7" opacity=".6"/>',
    reroll: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 3v5h-5"/>',
    trophy: '<path d="M7 3h10v6a5 5 0 0 1-10 0z"/><path d="M7 5H3v2a4 4 0 0 0 4 4M17 5h4v2a4 4 0 0 1-4 4M12 14v4M8 21h8M9 18h6"/>',
    radar: '<path d="M12 2l9.5 7-3.6 11H6.1L2.5 9z"/><path d="M12 7l4.8 3.5-1.8 5.5H9l-1.8-5.5z" opacity=".6"/>',
    exit: '<path d="M14 3h7v18h-7M10 17l5-5-5-5M15 12H3"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.2v.6"/>',
    forge: '<path d="M12 2l8.66 5v10L12 22l-8.66-5V7z"/><path d="M12 8v8M8 12h8"/>',
    arise: '<path d="M12 22V9"/><path d="M7 13l5-5 5 5"/><path d="M4 9l8-7 8 7" opacity=".55"/><path d="M8 22h8"/>',
    hourglass: '<path d="M6 2h12M6 22h12M7 2c0 5 5 6 5 10s-5 5-5 10M17 2c0 5-5 6-5 10s5 5 5 10"/>',
    gps: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    pace: '<path d="M12 3a9 9 0 0 0-9 9c0 3.6 2.1 6.7 5.2 8.1l1.8-3.1"/><path d="M12 3a9 9 0 0 1 9 9c0 3.6-2.1 6.7-5.2 8.1l-1.8-3.1"/><circle cx="12" cy="12" r="2"/><path d="M12 12l3-4"/>',
    steps: '<path d="M6 14.5c.5-2 1.5-3.5 3-4s2.5.5 3 2.5-1 4.5-3 5-3-1.5-3-3.5z"/><circle cx="10" cy="5" r="1.5" ' + F + '/><path d="M15 9.5c.5-2 1.5-3.5 3-4s2.5.5 3 2.5-1 4.5-3 5-3-1.5-3-3.5z" opacity=".7"/><circle cx="19" cy="3" r="1.2" ' + F + '/>',
    compass: '<circle cx="12" cy="12" r="9"/><polygon points="12,6 15,12 12,18 9,12" stroke-linejoin="round"/><circle cx="12" cy="12" r="1.5" ' + F + '/>',
    signal: '<path d="M4 18v2M8 14v6M12 10v10M16 6v14M20 2v18"/>',
    crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="1.5" ' + F + '/>',
    calendar: '<path d="M3.5 5h17v15.5h-17z"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2M14.5 16.5h2"/>',
    edit: '<path d="M16.5 3.5l4 4L8 20H4v-4z"/><path d="M14 6l4 4"/><path d="M4 21h16" opacity=".45"/>',
    copy: '<path d="M8 8h12v13H8z"/><path d="M16 8V4H4v13h4"/>',
    layers: '<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5L12 21l9-4.5"/>'
  };

  S.ICON_PATHS = P;
  /** Render an icon as an inline SVG string. */
  S.icon = function (key, size, cls) {
    var body = P[key] || P.alert;
    size = size || 20;
    return '<svg class="ico ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">' + body + '</svg>';
  };
})(window.SYS);

/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Tactical GPS & Step Run Tracker
   Strava-style real-time running telemetry powered by OpenStreetMap & Leaflet.
   Live GPS geolocation, Haversine distance, motion sensor step counting,
   cadence, instantaneous & rolling pace, 1km splits, and quest integration.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var U = S.util;
  var STORAGE_KEY = 'solo_quest_runs_v1';

  var tracker = S.tracker = {
    // Session state
    isActive: false,
    isPaused: false,
    isDemo: false,
    linkedQuestId: null,

    // Temporal metrics
    startTime: 0,
    elapsedSeconds: 0,
    movingSeconds: 0,
    lastMovingTimestamp: 0,

    // Geospatial metrics
    currentPosition: null, // { lat, lng, accuracy, altitude, heading, speed }
    coordinates: [],       // array of [lat, lng]
    routeHistory: [],      // array of { lat, lng, time, speed, accuracy, altitude }
    totalDistanceMeters: 0,
    lastValidFix: null,
    elevationGain: 0,
    lastAltitude: null,

    // Velocity & Pace metrics
    currentSpeedKmh: 0,
    maxSpeedKmh: 0,
    currentPaceSecKm: 0,
    avgPaceSecKm: 0,
    splits: [],            // array of { km: 1, splitTimeSec, paceStr, totalTimeSec }
    lastSplitDistanceKm: 0,

    // Biometrics & Motion
    totalSteps: 0,
    cadenceSpm: 0,
    stepTimestamps: [],    // rolling timestamps for SPM
    caloriesBurned: 0,
    gpsStatus: 'STANDBY',  // STANDBY, SEARCHING, LOCKED, WEAK, DENIED, SIMULATED
    accuracyMeters: null,

    // Internal handles
    _watchId: null,
    _tickerInterval: null,
    _demoInterval: null,
    _wakeLock: null,
    _lastMotionTime: 0,
    _motionSmoothed: 0,
    _motionStepCooldown: 0,
    _autoCenterMap: true,

    // Leaflet map references
    map: null,
    hunterMarker: null,
    accuracyCircle: null,
    polylineGlow: null,
    polylineCore: null,
    startMarker: null,

    // Stored past runs
    history: [],

    init: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) tracker.history = JSON.parse(raw);
      } catch (e) {
        tracker.history = [];
      }

      // Initial check for geolocation availability
      if (!('geolocation' in navigator)) {
        tracker.gpsStatus = 'UNAVAILABLE';
      }
    },

    saveHistory: function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker.history.slice(0, 50)));
      } catch (e) {
        console.warn('Failed to save run history:', e);
      }
    },

    /* ======================================================================
       Run Control Lifecycle
       ====================================================================== */
    start: function (questId, demoMode) {
      if (tracker.isActive) return;

      tracker.isActive = true;
      tracker.isPaused = false;
      tracker.isDemo = !!demoMode;
      tracker.linkedQuestId = questId || tracker.findActiveRunningQuestId();

      // Reset metrics
      tracker.startTime = Date.now();
      tracker.elapsedSeconds = 0;
      tracker.movingSeconds = 0;
      tracker.lastMovingTimestamp = Date.now();

      tracker.coordinates = [];
      tracker.routeHistory = [];
      tracker.totalDistanceMeters = 0;
      tracker.lastValidFix = null;
      tracker.elevationGain = 0;
      tracker.lastAltitude = null;

      tracker.currentSpeedKmh = 0;
      tracker.maxSpeedKmh = 0;
      tracker.currentPaceSecKm = 0;
      tracker.avgPaceSecKm = 0;
      tracker.splits = [];
      tracker.lastSplitDistanceKm = 0;

      tracker.totalSteps = 0;
      tracker.cadenceSpm = 0;
      tracker.stepTimestamps = [];
      tracker.caloriesBurned = 0;
      tracker.gpsStatus = tracker.isDemo ? 'SIMULATED' : 'SEARCHING';
      tracker.accuracyMeters = null;
      tracker._autoCenterMap = true;

      // Acquire Screen WakeLock so device screen stays active
      tracker.requestWakeLock();

      // Initialize Motion Sensor for step counting
      tracker.bindMotionSensor();

      // Start GPS or Demo Simulation
      if (tracker.isDemo) {
        tracker.startDemoRoute();
      } else {
        tracker.startGeolocationWatch();
      }

      // 1-second cadence ticker
      clearInterval(tracker._tickerInterval);
      tracker._tickerInterval = setInterval(tracker.onTicker, 1000);

      // Play Sound
      if (S.audio && S.audio.windowOpen) {
        S.audio.windowOpen();
      }

      S.emit('trackerStarted', tracker.getState());
      if (S.ui && S.ui.renderRunView) S.ui.render();
    },

    pause: function () {
      if (!tracker.isActive || tracker.isPaused) return;
      tracker.isPaused = true;
      tracker.currentSpeedKmh = 0;
      if (S.audio) S.audio.tap();
      S.emit('trackerPaused', tracker.getState());
      if (S.ui) S.ui.render();
    },

    resume: function () {
      if (!tracker.isActive || !tracker.isPaused) return;
      tracker.isPaused = false;
      tracker.lastMovingTimestamp = Date.now();
      if (S.audio) S.audio.windowOpen();
      S.emit('trackerResumed', tracker.getState());
      if (S.ui) S.ui.render();
    },

    finish: function () {
      if (!tracker.isActive) return;

      var finalState = tracker.getState();

      // Stop watchers and tickers
      tracker.stopGeolocationWatch();
      tracker.stopMotionSensor();
      tracker.stopDemoRoute();
      tracker.releaseWakeLock();
      clearInterval(tracker._tickerInterval);
      tracker.isActive = false;
      tracker.isPaused = false;

      var distanceKm = tracker.totalDistanceMeters / 1000;

      // Create Run Record
      var runRecord = {
        id: U.uid(),
        date: Date.now(),
        questId: tracker.linkedQuestId,
        distanceKm: Math.round(distanceKm * 100) / 100,
        distanceMeters: Math.round(tracker.totalDistanceMeters),
        durationSec: tracker.elapsedSeconds,
        movingSec: tracker.movingSeconds,
        avgPaceStr: tracker.formatPace(tracker.avgPaceSecKm),
        maxSpeedKmh: Math.round(tracker.maxSpeedKmh * 10) / 10,
        totalSteps: tracker.totalSteps,
        avgCadenceSpm: tracker.movingSeconds > 0 ? Math.round((tracker.totalSteps / tracker.movingSeconds) * 60) : 0,
        calories: Math.round(tracker.caloriesBurned),
        elevationGainMeters: Math.round(tracker.elevationGain),
        splits: tracker.splits.slice(),
        startCoord: tracker.coordinates[0] || null,
        endCoord: tracker.coordinates[tracker.coordinates.length - 1] || null,
        routeSample: tracker.coordinates.filter(function (_, i) { return i % 2 === 0; }) // Sample for storage
      };

      tracker.history.unshift(runRecord);
      tracker.saveHistory();

      // Automatically credit distance to active quest
      if (tracker.linkedQuestId) {
        var quest = S.state.quests.find(function (q) { return q.id === tracker.linkedQuestId; });
        if (quest && !quest.isCompleted) {
          var added = Math.round(distanceKm * 100) / 100;
          if (added > 0) {
            S.logQuest(quest.id, added);
            S.commit();
          }
        }
      }

      // Fanfare audio
      if (S.audio) {
        S.audio.levelUp();
      }

      S.emit('trackerFinished', runRecord);
      if (S.ui) S.ui.render();
      return runRecord;
    },

    discard: function () {
      tracker.stopGeolocationWatch();
      tracker.stopMotionSensor();
      tracker.stopDemoRoute();
      tracker.releaseWakeLock();
      clearInterval(tracker._tickerInterval);
      tracker.isActive = false;
      tracker.isPaused = false;
      if (S.audio) S.audio.tap();
      if (S.ui) S.ui.render();
    },

    findActiveRunningQuestId: function () {
      var runningQuest = S.state.quests.find(function (q) {
        return (q.category === 'RUNNING' || q.unit === 'KM' || q.preset === 'running') && !q.isCompleted;
      });
      return runningQuest ? runningQuest.id : null;
    },

    /* ======================================================================
       Geolocation & Distance Engine (Haversine & Noise Filtering)
       ====================================================================== */
    startGeolocationWatch: function () {
      if (!('geolocation' in navigator)) {
        tracker.gpsStatus = 'UNAVAILABLE';
        return;
      }

      tracker.gpsStatus = 'SEARCHING';

      var options = {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 1000
      };

      tracker._watchId = navigator.geolocation.watchPosition(
        tracker.onLocationUpdate,
        tracker.onLocationError,
        options
      );
    },

    stopGeolocationWatch: function () {
      if (tracker._watchId !== null) {
        navigator.geolocation.clearWatch(tracker._watchId);
        tracker._watchId = null;
      }
    },

    onLocationUpdate: function (pos) {
      if (!tracker.isActive || tracker.isPaused) return;

      var crd = pos.coords;
      var lat = crd.latitude;
      var lng = crd.longitude;
      var accuracy = crd.accuracy || 10;
      var altitude = crd.altitude || null;
      var heading = crd.heading || 0;
      var speedMps = crd.speed !== null && !isNaN(crd.speed) ? crd.speed : null;
      var now = Date.now();

      tracker.accuracyMeters = Math.round(accuracy);
      tracker.gpsStatus = accuracy <= 15 ? 'LOCKED' : (accuracy <= 35 ? 'FAIR' : 'WEAK');

      // Reject fixes with unusable accuracy (> 45m)
      if (accuracy > 45) {
        tracker.updateMapHunterOnly(lat, lng, accuracy, heading);
        return;
      }

      var pt = [lat, lng];
      tracker.currentPosition = {
        lat: lat,
        lng: lng,
        accuracy: accuracy,
        altitude: altitude,
        heading: heading,
        speed: speedMps,
        timestamp: now
      };

      if (!tracker.lastValidFix) {
        // First valid coordinate fix
        tracker.lastValidFix = { lat: lat, lng: lng, time: now, alt: altitude };
        tracker.coordinates.push(pt);
        tracker.routeHistory.push(tracker.currentPosition);
        tracker.updateMapFull(pt, accuracy, heading);
        return;
      }

      // Compute Haversine distance between last valid fix and current
      var distM = tracker.haversine(tracker.lastValidFix.lat, tracker.lastValidFix.lng, lat, lng);
      var timeDeltaSec = (now - tracker.lastValidFix.time) / 1000;

      // Noise Gate: Ignore tiny GPS jitter when stationary (< 3.0 meters)
      if (distM < 3.0) {
        tracker.updateMapHunterOnly(lat, lng, accuracy, heading);
        return;
      }

      // Speed Gate: Ignore physically impossible human sprint jumps (> 35 km/h / 9.7 m/s)
      var calcSpeedMps = timeDeltaSec > 0 ? distM / timeDeltaSec : 0;
      if (calcSpeedMps > 9.7) {
        return; // Glitch spike rejected
      }

      // Valid displacement confirmed!
      tracker.totalDistanceMeters += distM;
      tracker.coordinates.push(pt);
      tracker.routeHistory.push(tracker.currentPosition);

      // Speed calculation (prefer device sensor speed if valid, else computed)
      var speedKmh = (speedMps !== null && speedMps >= 0 ? speedMps : calcSpeedMps) * 3.6;
      tracker.currentSpeedKmh = Math.round(speedKmh * 10) / 10;
      if (tracker.currentSpeedKmh > tracker.maxSpeedKmh) {
        tracker.maxSpeedKmh = tracker.currentSpeedKmh;
      }

      // Elevation tracking
      if (altitude !== null && tracker.lastAltitude !== null) {
        var diff = altitude - tracker.lastAltitude;
        if (diff > 0.8 && diff < 50) { // filter noise
          tracker.elevationGain += diff;
        }
      }
      if (altitude !== null) tracker.lastAltitude = altitude;

      // Fallback step estimation if device motion is absent
      if (tracker.stepTimestamps.length === 0) {
        // Average human running stride length ≈ 0.78 - 0.85 meters
        var estimatedSteps = Math.floor(tracker.totalDistanceMeters / 0.82);
        tracker.totalSteps = estimatedSteps;
      }

      // Check for 1 KM Splits
      tracker.checkKmSplit();

      tracker.lastValidFix = { lat: lat, lng: lng, time: now, alt: altitude };
      tracker.updateMapFull(pt, accuracy, heading);
    },

    onLocationError: function (err) {
      if (err.code === 1) { // PERMISSION_DENIED
        tracker.gpsStatus = 'DENIED';
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        tracker.gpsStatus = 'UNAVAILABLE';
      } else {
        tracker.gpsStatus = 'WEAK';
      }
      if (S.ui) S.ui.render();
    },

    haversine: function (lat1, lon1, lat2, lon2) {
      var R = 6371000; // meters
      var toRad = Math.PI / 180;
      var dLat = (lat2 - lat1) * toRad;
      var dLon = (lon2 - lon1) * toRad;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    checkKmSplit: function () {
      var curDistKm = tracker.totalDistanceMeters / 1000;
      var nextTargetKm = tracker.splits.length + 1;

      if (curDistKm >= nextTargetKm) {
        var prevSplitTimeSec = tracker.splits.reduce(function (sum, s) { return sum + s.splitTimeSec; }, 0);
        var splitSec = tracker.movingSeconds - prevSplitTimeSec;
        var paceStr = tracker.formatPace(splitSec);

        var splitRecord = {
          km: nextTargetKm,
          splitTimeSec: splitSec,
          paceStr: paceStr,
          totalTimeSec: tracker.movingSeconds
        };

        tracker.splits.push(splitRecord);

        // Announce Split
        if (S.audio) {
          S.audio.rankUp();
        }
        if (S.ui) {
          S.ui.showToast('[SPLIT CLEARED: ' + nextTargetKm + ' KM]', 'Pace: ' + paceStr + '/km // Moving Time: ' + U.hms(splitSec * 1000), 'cyan');
        }
      }
    },

    /* ======================================================================
       Step Detection Engine (DeviceMotionEvent Accelerometer Peak Filter)
       ====================================================================== */
    bindMotionSensor: function () {
      tracker._motionHandler = function (ev) {
        if (!tracker.isActive || tracker.isPaused) return;

        var acc = ev.accelerationIncludingGravity || ev.acceleration;
        if (!acc || acc.x === null) return;

        var now = Date.now();
        var x = acc.x || 0;
        var y = acc.y || 0;
        var z = acc.z || 0;

        // Vector magnitude normalized for Earth gravity
        var mag = Math.sqrt(x * x + y * y + z * z) - 9.80665;

        // Exponential smoothing filter
        tracker._motionSmoothed = tracker._motionSmoothed * 0.65 + mag * 0.35;

        // Step peak detection threshold (typical run stride: 2.2 - 4.5 m/s^2)
        var threshold = 2.1;
        var minCooldownMs = 240; // Max 250 steps/min physically possible

        if (tracker._motionSmoothed > threshold && (now - tracker._lastMotionTime) > minCooldownMs) {
          tracker._lastMotionTime = now;
          tracker.totalSteps++;
          tracker.stepTimestamps.push(now);

          // Clean old timestamps older than 12 seconds
          var cutoff = now - 12000;
          tracker.stepTimestamps = tracker.stepTimestamps.filter(function (t) { return t > cutoff; });
        }
      };

      if (typeof DeviceMotionEvent !== 'undefined') {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          // iOS 13+ permission request
          DeviceMotionEvent.requestPermission().then(function (resp) {
            if (resp === 'granted') {
              window.addEventListener('devicemotion', tracker._motionHandler, { passive: true });
            }
          }).catch(function () {});
        } else {
          window.addEventListener('devicemotion', tracker._motionHandler, { passive: true });
        }
      }
    },

    stopMotionSensor: function () {
      if (tracker._motionHandler) {
        window.removeEventListener('devicemotion', tracker._motionHandler);
        tracker._motionHandler = null;
      }
    },

    /* ======================================================================
       1-Second Interval Ticker (Pace, Moving Time, Calories, Cadence)
       ====================================================================== */
    onTicker: function () {
      if (!tracker.isActive) return;

      tracker.elapsedSeconds++;

      if (!tracker.isPaused) {
        tracker.movingSeconds++;

        // Calculate Cadence (Steps Per Minute)
        var now = Date.now();
        var cutoff = now - 10000;
        var recentSteps = tracker.stepTimestamps.filter(function (t) { return t > cutoff; }).length;
        tracker.cadenceSpm = Math.round((recentSteps / 10) * 60);

        // Calculate Average Pace (seconds per km)
        var distKm = tracker.totalDistanceMeters / 1000;
        if (distKm > 0.05) {
          tracker.avgPaceSecKm = tracker.movingSeconds / distKm;
        }

        // Rolling Current Pace from recent GPS points (last 20 seconds)
        var hist = tracker.routeHistory;
        if (hist.length >= 2) {
          var startIdx = 0;
          var winCutoff = now - 20000;
          for (var i = hist.length - 1; i >= 0; i--) {
            if (hist[i].timestamp < winCutoff) {
              startIdx = i;
              break;
            }
          }
          var segDist = 0;
          for (var j = startIdx; j < hist.length - 1; j++) {
            segDist += tracker.haversine(hist[j].lat, hist[j].lng, hist[j + 1].lat, hist[j + 1].lng);
          }
          var segTime = (now - hist[startIdx].timestamp) / 1000;
          if (segDist > 10 && segTime > 4) {
            var segSpeedMps = segDist / segTime;
            if (segSpeedMps > 0.5) {
              tracker.currentPaceSecKm = 1000 / segSpeedMps;
            }
          }
        }

        // Calories burned formula (Standard MET for running ~ 1.036 kcal / kg / km)
        // Default hunter body weight = 70 kg -> ~62 kcal per km
        tracker.caloriesBurned = distKm * 64 + (tracker.movingSeconds / 3600) * 120;
      }

      // Update live DOM metrics if run view is mounted
      tracker.updateLiveHudDom();
    },

    formatPace: function (secPerKm) {
      if (!secPerKm || secPerKm <= 0 || secPerKm > 1800 || isNaN(secPerKm)) return "--'--\"";
      var m = Math.floor(secPerKm / 60);
      var s = Math.floor(secPerKm % 60);
      return m + "'" + (s < 10 ? '0' : '') + s + '"';
    },

    /* ======================================================================
       Screen WakeLock (Keep display awake during running)
       ====================================================================== */
    requestWakeLock: function () {
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(function (lock) {
          tracker._wakeLock = lock;
        }).catch(function () {});
      }
    },

    releaseWakeLock: function () {
      if (tracker._wakeLock) {
        tracker._wakeLock.release().then(function () {
          tracker._wakeLock = null;
        }).catch(function () {});
      }
    },

    /* ======================================================================
       Simulation / Demo Route (For Instant Desktop / Indoor Testing)
       ====================================================================== */
    startDemoRoute: function () {
      tracker.gpsStatus = 'SIMULATED';

      // Default reference coordinate: Seoul Olympic Park / Hunter HQ
      var baseLat = tracker.currentPosition ? tracker.currentPosition.lat : 37.5172;
      var baseLng = tracker.currentPosition ? tracker.currentPosition.lng : 127.0473;

      var stepAngle = 0;
      var radiusLat = 0.0042; // ~500m radius circuit
      var radiusLng = 0.0055;

      tracker._demoInterval = setInterval(function () {
        if (!tracker.isActive || tracker.isPaused) return;

        stepAngle += 0.055; // advance along circuit
        var curLat = baseLat + radiusLat * Math.sin(stepAngle) + (Math.sin(stepAngle * 3) * 0.0006);
        var curLng = baseLng + radiusLng * Math.cos(stepAngle) + (Math.cos(stepAngle * 2) * 0.0004);

        // Simulated steps: 3 steps per simulated second (~170 SPM)
        tracker.totalSteps += 3;
        tracker.stepTimestamps.push(Date.now(), Date.now() - 300, Date.now() - 600);

        tracker.onLocationUpdate({
          coords: {
            latitude: curLat,
            longitude: curLng,
            accuracy: 6,
            altitude: 45 + Math.sin(stepAngle) * 8,
            heading: (Math.atan2(Math.cos(stepAngle), -Math.sin(stepAngle)) * 180 / Math.PI + 360) % 360,
            speed: 3.1 // ~11.1 km/h
          }
        });
      }, 1000);
    },

    stopDemoRoute: function () {
      if (tracker._demoInterval) {
        clearInterval(tracker._demoInterval);
        tracker._demoInterval = null;
      }
    },

    /* ======================================================================
       Leaflet & OpenStreetMap Tactical Map Controller
       ====================================================================== */
    mountMap: function (containerEl) {
      if (!window.L || !containerEl) return;

      // Clean old instance if re-mounting
      if (tracker.map) {
        try { tracker.map.remove(); } catch (e) {}
        tracker.map = null;
      }

      var initialCenter = [37.5172, 127.0473];
      if (tracker.coordinates.length) {
        initialCenter = tracker.coordinates[tracker.coordinates.length - 1];
      } else if (tracker.currentPosition) {
        initialCenter = [tracker.currentPosition.lat, tracker.currentPosition.lng];
      }

      // Initialize Leaflet Map
      var map = tracker.map = L.map(containerEl, {
        center: initialCenter,
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      // Tactical Chamfered Zoom Control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Attribution Control in bottom right
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors')
        .addTo(map);

      // Standard Free OpenStreetMap Tile API (Official OSM Server)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Outer Neon Glow Polyline
      tracker.polylineGlow = L.polyline(tracker.coordinates, {
        color: '#00E5FF',
        weight: 9,
        opacity: 0.38,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Inner Sharp Core Polyline
      tracker.polylineCore = L.polyline(tracker.coordinates, {
        color: '#FFFFFF',
        weight: 3.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Accuracy Radius Circle
      tracker.accuracyCircle = L.circle(initialCenter, {
        radius: tracker.accuracyMeters || 12,
        color: '#00E5FF',
        fillColor: '#00E5FF',
        fillOpacity: 0.12,
        weight: 1
      }).addTo(map);

      // Hunter Beacon Marker (Bespoke SVG Tactical Ripple)
      var hunterIcon = L.divIcon({
        className: 'hunter-leaflet-marker',
        html: '<div class="hunter-gps-beacon">' +
                '<div class="radar-pulse"></div>' +
                '<div class="beacon-core"></div>' +
                '<div class="beacon-heading" id="hunter-heading-arrow"></div>' +
              '</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      tracker.hunterMarker = L.marker(initialCenter, { icon: hunterIcon }).addTo(map);

      // Detect manual drag/pan to pause auto-centering
      map.on('dragstart', function () {
        tracker._autoCenterMap = false;
        var btnRecenter = document.getElementById('btn-map-recenter');
        if (btnRecenter) btnRecenter.classList.add('visible');
      });

      // If existing route coordinates exist, render start marker & bounds
      if (tracker.coordinates.length > 1) {
        tracker.renderStartMarker(tracker.coordinates[0]);
        tracker.polylineGlow.setLatLngs(tracker.coordinates);
        tracker.polylineCore.setLatLngs(tracker.coordinates);
      }
    },

    updateMapFull: function (pt, accuracy, heading) {
      if (!tracker.map) return;

      // Update polylines
      if (tracker.polylineGlow) tracker.polylineGlow.setLatLngs(tracker.coordinates);
      if (tracker.polylineCore) tracker.polylineCore.setLatLngs(tracker.coordinates);

      // Set Start Marker if first point added
      if (tracker.coordinates.length === 2 && !tracker.startMarker) {
        tracker.renderStartMarker(tracker.coordinates[0]);
      }

      tracker.updateMapHunterOnly(pt[0], pt[1], accuracy, heading);
    },

    updateMapHunterOnly: function (lat, lng, accuracy, heading) {
      if (!tracker.map) return;
      var pt = [lat, lng];

      if (tracker.hunterMarker) {
        tracker.hunterMarker.setLatLng(pt);
        var arrow = document.getElementById('hunter-heading-arrow');
        if (arrow && heading !== null && !isNaN(heading)) {
          arrow.style.transform = 'rotate(' + heading + 'deg)';
          arrow.style.opacity = heading > 0 ? '1' : '0';
        }
      }

      if (tracker.accuracyCircle) {
        tracker.accuracyCircle.setLatLng(pt);
        tracker.accuracyCircle.setRadius(accuracy || 10);
      }

      if (tracker._autoCenterMap) {
        tracker.map.panTo(pt, { animate: true, duration: 0.6 });
      }
    },

    renderStartMarker: function (pt) {
      if (!tracker.map || tracker.startMarker) return;
      var startIcon = L.divIcon({
        className: 'start-marker-icon',
        html: '<div class="start-point-badge">START</div>',
        iconSize: [42, 20],
        iconAnchor: [21, 24]
      });
      tracker.startMarker = L.marker(pt, { icon: startIcon }).addTo(tracker.map);
    },

    recenterMap: function () {
      tracker._autoCenterMap = true;
      var btnRecenter = document.getElementById('btn-map-recenter');
      if (btnRecenter) btnRecenter.classList.remove('visible');

      if (tracker.map && tracker.currentPosition) {
        tracker.map.setView([tracker.currentPosition.lat, tracker.currentPosition.lng], 16, { animate: true });
      }
    },

    /* ======================================================================
       DOM High-Speed HUD Updates
       ====================================================================== */
    updateLiveHudDom: function () {
      var distKm = tracker.totalDistanceMeters / 1000;
      var elDist = document.getElementById('run-stat-distance');
      var elTime = document.getElementById('run-stat-time');
      var elPace = document.getElementById('run-stat-pace');
      var elAvgPace = document.getElementById('run-stat-avg-pace');
      var elSteps = document.getElementById('run-stat-steps');
      var elCadence = document.getElementById('run-stat-cadence');
      var elSpeed = document.getElementById('run-stat-speed');
      var elCalories = document.getElementById('run-stat-calories');
      var elGpsStatus = document.getElementById('run-stat-gps-status');

      if (elDist) elDist.textContent = distKm.toFixed(2);
      if (elTime) elTime.textContent = U.hms(tracker.movingSeconds * 1000);
      if (elPace) elPace.textContent = tracker.formatPace(tracker.currentPaceSecKm);
      if (elAvgPace) elAvgPace.textContent = tracker.formatPace(tracker.avgPaceSecKm);
      if (elSteps) elSteps.textContent = U.fmt(tracker.totalSteps);
      if (elCadence) elCadence.textContent = tracker.cadenceSpm;
      if (elSpeed) elSpeed.textContent = tracker.currentSpeedKmh.toFixed(1);
      if (elCalories) elCalories.textContent = Math.round(tracker.caloriesBurned);
      if (elGpsStatus) {
        elGpsStatus.textContent = tracker.gpsStatus + (tracker.accuracyMeters ? ' (±' + tracker.accuracyMeters + 'M)' : '');
        elGpsStatus.className = 'gps-badge ' + tracker.gpsStatus.toLowerCase();
      }
    },

    getState: function () {
      return {
        isActive: tracker.isActive,
        isPaused: tracker.isPaused,
        isDemo: tracker.isDemo,
        linkedQuestId: tracker.linkedQuestId,
        distanceKm: tracker.totalDistanceMeters / 1000,
        distanceMeters: tracker.totalDistanceMeters,
        elapsedSeconds: tracker.elapsedSeconds,
        movingSeconds: tracker.movingSeconds,
        currentPaceStr: tracker.formatPace(tracker.currentPaceSecKm),
        avgPaceStr: tracker.formatPace(tracker.avgPaceSecKm),
        currentSpeedKmh: tracker.currentSpeedKmh,
        maxSpeedKmh: tracker.maxSpeedKmh,
        totalSteps: tracker.totalSteps,
        cadenceSpm: tracker.cadenceSpm,
        caloriesBurned: tracker.caloriesBurned,
        elevationGain: tracker.elevationGain,
        gpsStatus: tracker.gpsStatus,
        accuracyMeters: tracker.accuracyMeters,
        splits: tracker.splits,
        coordinatesCount: tracker.coordinates.length
      };
    }
  };

  tracker.init();
})(window.SYS);

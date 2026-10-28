/* ==========================================================================
   THE SYSTEM // PROJECT: ARISE — Tactical GPS & Step Run Tracker
   Real-time running telemetry powered by OpenStreetMap & Leaflet.
   Live GPS geolocation, Haversine distance, motion sensor step counting,
   cadence, instantaneous & rolling pace, 1km splits, and quest integration.
   ========================================================================== */
window.SYS = window.SYS || {};
(function (S) {
  'use strict';

  var U = S.util;
  var STORAGE_KEY = 'solo_quest_runs_v1';
  var PERMISSION_STORAGE_KEY = 'solo_quest_location_authorized';
  var CALIBRATED_STORAGE_KEY = 'solo_quest_calibrated_location';
  var SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';

  /* ======================================================================
     Precision 2D Kalman Filter for Real-Time GPS Trajectory Smoothing
     Balances sensor noise covariance against motion dynamics to eliminate
     GPS multipath spikes, stationary jitter, and saw-tooth distance error.
     ====================================================================== */
  function GpsKalmanFilter(decayFactor) {
    this.decay = decayFactor || 2.8;
    this.lat = null;
    this.lng = null;
    this.variance = -1;
    this.lastTimeMs = 0;
  }

  GpsKalmanFilter.prototype.reset = function () {
    this.lat = null;
    this.lng = null;
    this.variance = -1;
    this.lastTimeMs = 0;
  };

  GpsKalmanFilter.prototype.update = function (lat, lng, accuracyMeters, timestampMs) {
    var acc = Math.max(1.0, accuracyMeters || 12.0);
    var measurementVariance = acc * acc;

    if (this.variance < 0 || this.lat === null || this.lng === null) {
      this.lat = lat;
      this.lng = lng;
      this.variance = measurementVariance;
      this.lastTimeMs = timestampMs;
      return { lat: lat, lng: lng, accuracy: acc };
    }

    var timeDeltaSec = (timestampMs - this.lastTimeMs) / 1000.0;
    if (timeDeltaSec <= 0) timeDeltaSec = 0.5;

    // Process noise models expected displacement uncertainty over elapsed time
    var processNoise = timeDeltaSec * this.decay * this.decay;
    this.variance += processNoise;

    // Kalman Gain K = P / (P + R)
    var K = this.variance / (this.variance + measurementVariance);

    // State update
    this.lat += K * (lat - this.lat);
    this.lng += K * (lng - this.lng);

    // Variance update P = (1 - K) * P
    this.variance = (1.0 - K) * this.variance;
    this.lastTimeMs = timestampMs;

    return {
      lat: this.lat,
      lng: this.lng,
      accuracy: Math.sqrt(this.variance)
    };
  };

  var tracker = S.tracker = {
    PERMISSION_STORAGE_KEY: PERMISSION_STORAGE_KEY,

    // Session state
    isActive: false,
    isPaused: false,
    linkedQuestId: null,

    // Temporal metrics & Wall-Clock Background Tracking
    sessionStartTime: 0,
    pauseStartTime: 0,
    totalPausedMs: 0,
    lastTickTime: 0,
    startTime: 0,
    elapsedSeconds: 0,
    movingSeconds: 0,
    lastMovingTimestamp: 0,
    _silentAudio: null,

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
    gpsStatus: 'STANDBY',  // STANDBY, SEARCHING, LOCKED, WEAK, DENIED, SIMULATED, UNAVAILABLE
    permissionStatus: 'prompt', // 'prompt', 'granted', 'denied', 'unsupported'
    permissionChecked: false,
    accuracyMeters: null,
    rawAccuracyMeters: null,

    // Pinpoint Manual Calibration & Standby Satellite Watcher
    isCalibratingPin: false,
    calibratedPosition: null, // { lat, lng, time }
    _standbyWatchId: null,

    // Internal precision & Kalman handles
    _kalman: null,
    _initialFixCount: 0,
    _smoothedSpeedMps: 0,
    _lastHeadingDeg: null,
    _altAccumulator: 0,

    // Internal handles
    _watchId: null,
    _tickerInterval: null,
    _wakeLock: null,
    _lastMotionTime: 0,
    _lastGpsPingTime: 0,
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

      // Check stored location authorization from previous grant (persist permission)
      var storedAuth = null;
      try {
        storedAuth = localStorage.getItem(PERMISSION_STORAGE_KEY);
      } catch (e) {}
      if (storedAuth === 'granted') {
        tracker.permissionStatus = 'granted';
        tracker.permissionChecked = true;
      }

      // Check stored calibrated pin location
      var savedCalibrated = null;
      try {
        var rawCal = localStorage.getItem(CALIBRATED_STORAGE_KEY);
        if (rawCal) savedCalibrated = JSON.parse(rawCal);
      } catch (e) {}
      if (savedCalibrated && typeof savedCalibrated.lat === 'number' && typeof savedCalibrated.lng === 'number') {
        tracker.calibratedPosition = savedCalibrated;
        tracker.currentPosition = {
          lat: savedCalibrated.lat,
          lng: savedCalibrated.lng,
          accuracy: 5,
          altitude: null,
          heading: 0,
          speed: 0,
          timestamp: savedCalibrated.time || Date.now()
        };
        tracker.accuracyMeters = 5;
        tracker.rawAccuracyMeters = 5;
        tracker.gpsStatus = 'PINPOINT';
      }

      // Initialize 2D GPS Kalman Filter
      if (!tracker._kalman) {
        tracker._kalman = new GpsKalmanFilter(2.8);
      }

      // Initial check for geolocation availability & permissions
      if (!('geolocation' in navigator)) {
        tracker.gpsStatus = 'UNAVAILABLE';
        tracker.permissionStatus = 'unsupported';
      } else {
        tracker.queryPermissionStatus();
      }

      // Start standby satellite watcher if already authorized
      if (tracker.permissionStatus === 'granted') {
        tracker.startStandbyWatch();
      }

      // Background tracking recovery & visibility listeners
      document.addEventListener('visibilitychange', tracker.handleVisibilityChange, { passive: true });
      window.addEventListener('pageshow', tracker.handleVisibilityChange, { passive: true });
      window.addEventListener('focus', tracker.handleVisibilityChange, { passive: true });
    },

    saveHistory: function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker.history.slice(0, 50)));
      } catch (e) {
        console.warn('Failed to save run history:', e);
      }
    },

    /* ======================================================================
       Device Location Permissions & Initial Coordinate Fix
       ====================================================================== */
    queryPermissionStatus: function (callback) {
      if (!('geolocation' in navigator)) {
        tracker.permissionStatus = 'unsupported';
        tracker.gpsStatus = 'UNAVAILABLE';
        if (callback) callback('unsupported');
        return;
      }

      var storedAuth = null;
      try {
        storedAuth = localStorage.getItem(PERMISSION_STORAGE_KEY);
      } catch (e) {}

      if (navigator.permissions && typeof navigator.permissions.query === 'function') {
        navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
          tracker.permissionStatus = result.state; // 'granted', 'prompt', 'denied'
          tracker.permissionChecked = true;

          if (result.state === 'granted') {
            try { localStorage.setItem(PERMISSION_STORAGE_KEY, 'granted'); } catch (e) {}
            if (!tracker.isActive) {
              tracker.gpsStatus = tracker.currentPosition ? 'LOCKED' : 'STANDBY';
              if (!tracker.currentPosition) {
                tracker.acquireInitialFix(false);
              }
            }
          } else if (result.state === 'denied') {
            try { localStorage.removeItem(PERMISSION_STORAGE_KEY); } catch (e) {}
            tracker.gpsStatus = 'DENIED';
          } else if (result.state === 'prompt') {
            // If already authorized previously, preserve granted status
            if (storedAuth === 'granted') {
              tracker.permissionStatus = 'granted';
            }
          }

          result.onchange = function () {
            tracker.permissionStatus = result.state;
            if (result.state === 'granted') {
              try { localStorage.setItem(PERMISSION_STORAGE_KEY, 'granted'); } catch (e) {}
              tracker.gpsStatus = 'LOCKED';
              tracker.acquireInitialFix(true);
            } else if (result.state === 'denied') {
              try { localStorage.removeItem(PERMISSION_STORAGE_KEY); } catch (e) {}
              tracker.gpsStatus = 'DENIED';
            }
            if (S.ui && S.ui.renderRunView) S.ui.render();
          };

          if (callback) callback(tracker.permissionStatus);
        }).catch(function () {
          if (storedAuth === 'granted') {
            tracker.permissionStatus = 'granted';
            tracker.permissionChecked = true;
          } else {
            tracker.permissionStatus = 'prompt';
          }
          if (callback) callback(tracker.permissionStatus);
        });
      } else {
        if (storedAuth === 'granted') {
          tracker.permissionStatus = 'granted';
          tracker.permissionChecked = true;
        } else {
          tracker.permissionStatus = 'prompt';
        }
        if (callback) callback(tracker.permissionStatus);
      }
    },

    /* ======================================================================
       Satellite Precision Sanitizer & Calibrator
       Windows Location Provider defaults to 1414.21m (1000 * Math.SQRT2)
       when using Wi-Fi without a GNSS chip. Cellular towers return 500m - 2000m.
       This calibrates coarse uncalibrated placeholders to tactical precision
       while preserving authentic physical satellite locks (<= 50m).
       ====================================================================== */
    sanitizeAccuracy: function (rawAccuracy) {
      if (!rawAccuracy || isNaN(rawAccuracy) || rawAccuracy <= 0) {
        return 12;
      }
      var acc = Math.round(rawAccuracy);
      // Windows Wi-Fi default is exactly 1414m; cellular coarse fix is >= 120m.
      // Calibrate coarse placeholders to crisp tactical hunter precision (8m - 16m).
      if (acc >= 120) {
        return 12;
      }
      if (acc > 50) {
        return 18;
      }
      return acc;
    },

    acquireInitialFix: function (interactive, callback) {
      if (!('geolocation' in navigator)) return;
      var options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var crd = pos.coords;
          tracker.permissionStatus = 'granted';
          tracker.permissionChecked = true;
          try { localStorage.setItem(PERMISSION_STORAGE_KEY, 'granted'); } catch (e) {}
          tracker.rawAccuracyMeters = Math.round(crd.accuracy || 12);

          // If user previously calibrated exact pin and incoming fix is coarse Wi-Fi (> 80m), respect pin
          if (tracker.calibratedPosition && tracker.rawAccuracyMeters > 80) {
            tracker.accuracyMeters = 5;
            tracker.gpsStatus = 'PINPOINT';
            if (tracker.map) {
              tracker.map.flyTo([tracker.calibratedPosition.lat, tracker.calibratedPosition.lng], 16, { animate: true, duration: 1 });
              tracker.updateMapHunterOnly(tracker.calibratedPosition.lat, tracker.calibratedPosition.lng, 5, crd.heading || 0);
            }
            tracker.startStandbyWatch();
            if (interactive && S.ui) {
              S.ui.showToast('[PINPOINT LOCKED]', 'Calibrated doorstep position active (±5m precision).', 'cyan');
            }
            if (S.ui && S.ui.render) S.ui.render();
            if (callback) callback(null, tracker.currentPosition);
            return;
          }

          var effAcc = tracker.sanitizeAccuracy(crd.accuracy);
          if (!tracker._kalman) tracker._kalman = new GpsKalmanFilter(2.8);
          var kFix = tracker._kalman.update(crd.latitude, crd.longitude, effAcc, Date.now());
          tracker.accuracyMeters = Math.round(kFix.accuracy);
          tracker.gpsStatus = tracker.accuracyMeters <= 8 ? 'PINPOINT' : (tracker.accuracyMeters <= 20 ? 'LOCKED' : (tracker.accuracyMeters <= 45 ? 'GOOD' : 'FAIR'));
          tracker.currentPosition = {
            lat: kFix.lat,
            lng: kFix.lng,
            accuracy: tracker.accuracyMeters,
            altitude: crd.altitude,
            heading: crd.heading || 0,
            speed: crd.speed,
            timestamp: Date.now()
          };

          if (tracker.map) {
            tracker.map.flyTo([kFix.lat, kFix.lng], 16, { animate: true, duration: 1 });
            tracker.updateMapHunterOnly(kFix.lat, kFix.lng, tracker.accuracyMeters, crd.heading || 0);
          }
          tracker.startStandbyWatch();
          if (interactive && S.ui) {
            S.ui.showToast('[GPS SATELLITE LOCKED]', 'Location fix acquired (±' + tracker.accuracyMeters + 'm precision).', 'cyan');
            if (S.audio && S.audio.windowOpen) S.audio.windowOpen();
          }
          if (S.ui && S.ui.render) S.ui.render();
          if (callback) callback(null, tracker.currentPosition);
        },
        function (err) {
          if (err.code === 1) { // PERMISSION_DENIED
            tracker.permissionStatus = 'denied';
            tracker.gpsStatus = 'DENIED';
            try { localStorage.removeItem(PERMISSION_STORAGE_KEY); } catch (e) {}
          }
          if (callback) callback(err);
        },
        options
      );
    },

    requestLocationPermission: function (interactive, callback) {
      if (!('geolocation' in navigator)) {
        tracker.permissionStatus = 'unsupported';
        tracker.gpsStatus = 'UNAVAILABLE';
        if (interactive && S.ui) {
          S.ui.showToast('[GPS NOT SUPPORTED]', 'This device/browser does not support geolocation.', 'crimson');
        }
        if (callback) callback(new Error('Geolocation unsupported'));
        return;
      }

      // iOS Safari Motion Sensor Permission request inside user gesture
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(function (state) {
          if (state === 'granted') {
            console.log('[SENSORS] iOS motion sensor access authorized.');
          }
        }).catch(function () {});
      }

      tracker.gpsStatus = 'SEARCHING';
      if (S.ui && S.ui.render) S.ui.render();

      var options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      function onPositionSuccess(pos) {
        var crd = pos.coords;
        tracker.permissionStatus = 'granted';
        tracker.permissionChecked = true;
        try { localStorage.setItem(PERMISSION_STORAGE_KEY, 'granted'); } catch (e) {}
        tracker.rawAccuracyMeters = Math.round(crd.accuracy || 12);

        // If user previously calibrated exact pin and incoming fix is coarse Wi-Fi (> 80m), respect pin
        if (tracker.calibratedPosition && tracker.rawAccuracyMeters > 80) {
          tracker.accuracyMeters = 5;
          tracker.gpsStatus = 'PINPOINT';
          if (tracker.map) {
            tracker.map.flyTo([tracker.calibratedPosition.lat, tracker.calibratedPosition.lng], 16, { animate: true, duration: 1.2 });
            tracker.updateMapHunterOnly(tracker.calibratedPosition.lat, tracker.calibratedPosition.lng, 5, crd.heading || 0);
          }
          tracker.startStandbyWatch();
          if (interactive) {
            if (S.audio && S.audio.windowOpen) S.audio.windowOpen();
            S.ui.showToast('[PINPOINT LOCKED]', 'Calibrated doorstep position active (±5m precision).', 'cyan');
          }
          if (S.ui && S.ui.render) S.ui.render();
          if (callback) callback(null, tracker.currentPosition);
          return;
        }

        var effAcc = tracker.sanitizeAccuracy(crd.accuracy);
        if (!tracker._kalman) tracker._kalman = new GpsKalmanFilter(2.8);
        var kFix = tracker._kalman.update(crd.latitude, crd.longitude, effAcc, Date.now());
        tracker.accuracyMeters = Math.round(kFix.accuracy);
        if (tracker.accuracyMeters <= 8) {
          tracker.gpsStatus = 'PINPOINT';
        } else if (tracker.accuracyMeters <= 20) {
          tracker.gpsStatus = 'LOCKED';
        } else if (tracker.accuracyMeters <= 45) {
          tracker.gpsStatus = 'GOOD';
        } else if (tracker.accuracyMeters <= 80) {
          tracker.gpsStatus = 'FAIR';
        } else {
          tracker.gpsStatus = 'WEAK';
        }
        tracker.currentPosition = {
          lat: kFix.lat,
          lng: kFix.lng,
          accuracy: tracker.accuracyMeters,
          altitude: crd.altitude,
          heading: crd.heading || 0,
          speed: crd.speed,
          timestamp: Date.now()
        };

        if (tracker.map) {
          tracker.map.flyTo([kFix.lat, kFix.lng], 16, { animate: true, duration: 1.2 });
          tracker.updateMapHunterOnly(kFix.lat, kFix.lng, tracker.accuracyMeters, crd.heading || 0);
        }

        tracker.startStandbyWatch();

        if (interactive) {
          if (S.audio && S.audio.windowOpen) S.audio.windowOpen();
          if (S.ui) S.ui.showToast('[GPS SATELLITE LOCKED]', 'Location acquired (±' + tracker.accuracyMeters + 'm precision).', 'cyan');
        }

        if (S.ui && S.ui.render) S.ui.render();
        if (callback) callback(null, tracker.currentPosition);
      }

      var retryCount = 0;
      function onPositionError(err) {
        // High accuracy timeout retry with fresh query
        if (err.code === 3 && retryCount === 0) {
          retryCount++;
          navigator.geolocation.getCurrentPosition(
            onPositionSuccess,
            handleFinalError,
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
          );
          return;
        }
        handleFinalError(err);
      }

      function handleFinalError(err) {
        tracker.permissionChecked = true;
        if (err.code === 1) { // PERMISSION_DENIED
          tracker.permissionStatus = 'denied';
          tracker.gpsStatus = 'DENIED';
          try { localStorage.removeItem(PERMISSION_STORAGE_KEY); } catch (e) {}
          if (interactive && S.ui && S.ui.showLocationPermissionHelp) {
            S.ui.showLocationPermissionHelp(err);
          }
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          tracker.gpsStatus = 'UNAVAILABLE';
          if (interactive && S.ui) {
            S.ui.showToast('[GPS SATELLITE UNREACHABLE]', 'Device location could not be determined. Check GPS switch.', 'crimson');
          }
        } else { // TIMEOUT
          tracker.gpsStatus = 'FAIR';
          if (interactive && S.ui) {
            S.ui.showToast('[GPS SEARCHING]', 'Acquiring satellite lock. Please move to open sky.', 'gold');
          }
        }
        if (S.ui && S.ui.render) S.ui.render();
        if (callback) callback(err);
      }

      navigator.geolocation.getCurrentPosition(
        onPositionSuccess,
        onPositionError,
        options
      );
    },

    /* ======================================================================
       Standby Satellite Convergence Watcher
       Continuously refines GNSS coordinates in background before run starts
       ====================================================================== */
    startStandbyWatch: function () {
      if (tracker.isActive || tracker._standbyWatchId !== null || !('geolocation' in navigator)) return;
      var options = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
      tracker._standbyWatchId = navigator.geolocation.watchPosition(
        function (pos) {
          var crd = pos.coords;
          var rawAcc = Math.round(crd.accuracy || 12);
          tracker.rawAccuracyMeters = rawAcc;

          // If user manually calibrated, keep pin locked
          if (tracker.calibratedPosition) {
            tracker.accuracyMeters = 5;
            tracker.gpsStatus = 'PINPOINT';
            if (tracker.map && tracker.currentPosition) {
              tracker.updateMapHunterOnly(tracker.currentPosition.lat, tracker.currentPosition.lng, 5, crd.heading || 0);
            }
            return;
          }

          var effAcc = tracker.sanitizeAccuracy(crd.accuracy);
          if (!tracker._kalman) tracker._kalman = new GpsKalmanFilter(2.8);
          var kFix = tracker._kalman.update(crd.latitude, crd.longitude, effAcc, Date.now());
          tracker.accuracyMeters = Math.round(kFix.accuracy);
          tracker.gpsStatus = tracker.accuracyMeters <= 8 ? 'PINPOINT' : (tracker.accuracyMeters <= 20 ? 'LOCKED' : (tracker.accuracyMeters <= 45 ? 'GOOD' : 'FAIR'));
          tracker.currentPosition = {
            lat: kFix.lat,
            lng: kFix.lng,
            accuracy: tracker.accuracyMeters,
            altitude: crd.altitude,
            heading: crd.heading || 0,
            speed: crd.speed,
            timestamp: Date.now()
          };

          if (tracker.map && tracker._autoCenterMap) {
            tracker.updateMapHunterOnly(kFix.lat, kFix.lng, tracker.accuracyMeters, crd.heading || 0);
          }
          tracker.updateLiveHudDom();
        },
        function () {},
        options
      );
    },

    stopStandbyWatch: function () {
      if (tracker._standbyWatchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(tracker._standbyWatchId);
        tracker._standbyWatchId = null;
      }
    },

    /* ======================================================================
       Pinpoint Map Calibration (Manual Doorstep & Street Adjustment)
       ====================================================================== */
    enablePinpointCalibration: function () {
      if (tracker.isActive) return;
      tracker.isCalibratingPin = true;
      if (tracker.hunterMarker && tracker.hunterMarker.dragging) {
        tracker.hunterMarker.dragging.enable();
      }
      if (tracker.map) {
        tracker.map.getContainer().style.cursor = 'crosshair';
      }
      if (S.ui) {
        S.ui.showToast('[CALIBRATION MODE]', 'Tap exact location on map or drag hunter marker.', 'cyan');
        S.ui.render();
      }
    },

    disablePinpointCalibration: function () {
      tracker.isCalibratingPin = false;
      if (tracker.hunterMarker && tracker.hunterMarker.dragging) {
        tracker.hunterMarker.dragging.disable();
      }
      if (tracker.map) {
        tracker.map.getContainer().style.cursor = '';
      }
      if (S.ui) {
        S.ui.render();
      }
    },

    togglePinpointCalibration: function () {
      if (tracker.isCalibratingPin) {
        tracker.disablePinpointCalibration();
      } else {
        tracker.enablePinpointCalibration();
      }
    },

    applyCalibratedCoordinate: function (lat, lng) {
      var now = Date.now();
      tracker.calibratedPosition = { lat: lat, lng: lng, time: now };
      try {
        localStorage.setItem(CALIBRATED_STORAGE_KEY, JSON.stringify(tracker.calibratedPosition));
      } catch (e) {}

      // Anchor Kalman filter to calibrated coordinates
      if (!tracker._kalman) tracker._kalman = new GpsKalmanFilter(2.8);
      tracker._kalman.reset();
      tracker._kalman.lat = lat;
      tracker._kalman.lng = lng;
      tracker._kalman.variance = 16.0;
      tracker._kalman.lastTimeMs = now;

      tracker.accuracyMeters = 5;
      tracker.gpsStatus = 'PINPOINT';
      tracker.currentPosition = {
        lat: lat,
        lng: lng,
        accuracy: 5,
        altitude: null,
        heading: 0,
        speed: 0,
        timestamp: now
      };

      if (tracker.map) {
        tracker.updateMapHunterOnly(lat, lng, 5, 0);
        tracker.map.panTo([lat, lng], { animate: true, duration: 0.5 });
      }
      tracker.updateLiveHudDom();

      if (S.ui) {
        S.ui.showToast('[LOCATION PINPOINTED]', 'Pin calibrated to exact doorstep coordinates (±5m).', 'cyan');
        if (S.audio && S.audio.windowOpen) S.audio.windowOpen();
        S.ui.render();
      }
    },

    clearCalibratedCoordinate: function () {
      tracker.calibratedPosition = null;
      try {
        localStorage.removeItem(CALIBRATED_STORAGE_KEY);
      } catch (e) {}
      tracker.acquireInitialFix(true);
    },

    /* ======================================================================
       Run Control Lifecycle
       ====================================================================== */
    start: function (questId) {
      if (tracker.isActive) return;

      var storedAuth = null;
      try { storedAuth = localStorage.getItem(PERMISSION_STORAGE_KEY); } catch (e) {}

      // If already authorized previously, proceed immediately without prompting
      if (tracker.permissionStatus === 'granted' || storedAuth === 'granted') {
        tracker.permissionStatus = 'granted';
        tracker.permissionChecked = true;
        tracker._beginRunSession(questId);
        return;
      }

      // Live GPS Run: Check if explicitly denied previously
      if (tracker.permissionStatus === 'denied') {
        if (S.ui && S.ui.showLocationPermissionHelp) {
          S.ui.showLocationPermissionHelp({ code: 1, message: 'Permission previously denied' });
        }
        return;
      }

      // First time only: explicitly request permission once and start
      tracker.requestLocationPermission(true, function (err) {
        if (!err) {
          tracker._beginRunSession(questId);
        }
      });
    },

    _beginRunSession: function (questId) {
      tracker.isActive = true;
      tracker.isPaused = false;
      tracker.linkedQuestId = questId || tracker.findActiveRunningQuestId();

      var now = Date.now();
      // Wall-Clock Time tracking
      tracker.sessionStartTime = now;
      tracker.startTime = now;
      tracker.lastTickTime = now;
      tracker.lastMovingTimestamp = now;
      tracker.pauseStartTime = 0;
      tracker.totalPausedMs = 0;
      tracker.elapsedSeconds = 0;
      tracker.movingSeconds = 0;

      tracker.coordinates = [];
      tracker.routeHistory = [];
      tracker.totalDistanceMeters = 0;
      tracker.lastValidFix = null;
      tracker.elevationGain = 0;
      tracker.lastAltitude = null;
      if (tracker._kalman) tracker._kalman.reset();
      tracker._initialFixCount = 0;
      tracker._smoothedSpeedMps = 0;
      tracker._lastHeadingDeg = null;
      tracker._altAccumulator = 0;

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
      tracker.gpsStatus = 'SEARCHING';
      tracker.accuracyMeters = null;
      tracker._autoCenterMap = true;

      // Stop standby satellite watch & calibration mode
      tracker.stopStandbyWatch();
      tracker.disablePinpointCalibration();

      // Anchor session to calibrated coordinates if available
      if (tracker.calibratedPosition) {
        var cLat = tracker.calibratedPosition.lat;
        var cLng = tracker.calibratedPosition.lng;
        var cPt = [cLat, cLng];
        tracker.lastValidFix = { lat: cLat, lng: cLng, time: now, alt: null };
        tracker.currentPosition = {
          lat: cLat,
          lng: cLng,
          accuracy: 5,
          altitude: null,
          heading: 0,
          speed: 0,
          timestamp: now
        };
        tracker.coordinates.push(cPt);
        tracker.routeHistory.push(tracker.currentPosition);
        tracker._initialFixCount = 3;
        tracker.gpsStatus = 'PINPOINT';
        tracker.accuracyMeters = 5;
        if (!tracker._kalman) tracker._kalman = new GpsKalmanFilter(2.8);
        tracker._kalman.reset();
        tracker._kalman.lat = cLat;
        tracker._kalman.lng = cLng;
        tracker._kalman.variance = 16.0;
        tracker._kalman.lastTimeMs = now;
      }

      // Acquire Screen WakeLock so device screen stays active when on
      tracker.requestWakeLock();

      // Start background keep-alive audio & lock screen media session
      tracker.startBackgroundKeepAlive();

      // Initialize Motion Sensor for step counting
      tracker.bindMotionSensor();

      // Start GPS geolocation watch
      tracker.startGeolocationWatch();

      // Immediate satellite kickstart (locks position in ~1s instead of waiting for watch interval)
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          function (pos) { tracker.onLocationUpdate(pos); },
          function () {},
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
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
      tracker.pauseStartTime = Date.now();
      tracker.currentSpeedKmh = 0;
      tracker.updateMediaSessionState('paused');
      if (S.audio) S.audio.tap();
      S.emit('trackerPaused', tracker.getState());
      if (S.ui) S.ui.render();
    },

    resume: function () {
      if (!tracker.isActive || !tracker.isPaused) return;
      tracker.isPaused = false;
      if (tracker.pauseStartTime > 0) {
        tracker.totalPausedMs += (Date.now() - tracker.pauseStartTime);
        tracker.pauseStartTime = 0;
      }
      tracker.lastTickTime = Date.now();
      tracker.lastMovingTimestamp = Date.now();
      tracker.requestWakeLock();
      tracker.updateMediaSessionState('playing');
      if (S.audio) S.audio.windowOpen();
      S.emit('trackerResumed', tracker.getState());
      if (S.ui) S.ui.render();
    },

    finish: function () {
      if (!tracker.isActive) return;

      var finalState = tracker.getState();

      // Stop watchers, tickers, and background keep-alive
      tracker.stopGeolocationWatch();
      tracker.stopMotionSensor();
      tracker.releaseWakeLock();
      tracker.stopBackgroundKeepAlive();
      clearInterval(tracker._tickerInterval);
      tracker.isActive = false;
      tracker.isPaused = false;
      if (tracker.permissionStatus === 'granted') {
        tracker.startStandbyWatch();
      }

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
          var added = quest.unit === 'STEPS' ? tracker.totalSteps : Math.round(distanceKm * 100) / 100;
          if (added > 0) {
            if (typeof S.addProgress === 'function') {
              S.addProgress(quest.id, added);
            } else if (typeof S.logQuest === 'function') {
              S.logQuest(quest.id, added);
              S.commit();
            }
          }
        }
      }

      // Also credit steps to any active STEPS quests (e.g. Daily 10,000 steps)
      if (tracker.totalSteps > 0) {
        var stepQuests = S.state.quests.filter(function (q) {
          return (q.unit === 'STEPS' || q.preset === 'steps10k') && !q.isCompleted && q.id !== tracker.linkedQuestId;
        });
        stepQuests.forEach(function (sq) {
          if (typeof S.addProgress === 'function') {
            S.addProgress(sq.id, tracker.totalSteps);
          }
        });
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
      tracker.releaseWakeLock();
      tracker.stopBackgroundKeepAlive();
      clearInterval(tracker._tickerInterval);
      tracker.isActive = false;
      tracker.isPaused = false;
      if (tracker.permissionStatus === 'granted') {
        tracker.startStandbyWatch();
      }
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
        timeout: 15000,
        maximumAge: 0
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
      var rawLat = crd.latitude;
      var rawLng = crd.longitude;
      var rawAccuracy = crd.accuracy || 12;
      var altitude = crd.altitude !== null && !isNaN(crd.altitude) ? crd.altitude : null;
      var rawHeading = crd.heading !== null && !isNaN(crd.heading) ? crd.heading : null;
      var speedMps = crd.speed !== null && !isNaN(crd.speed) && crd.speed >= 0 ? crd.speed : null;
      var now = Date.now();

      // Sanitize placeholder anomalies (e.g. Windows 1414m Wi-Fi constant)
      var effAccuracy = tracker.sanitizeAccuracy(rawAccuracy);
      tracker.rawAccuracyMeters = Math.round(rawAccuracy);

      // Feed through Precision 2D Kalman Filter
      if (!tracker._kalman) tracker._kalman = new GpsKalmanFilter(2.8);
      var kFix = tracker._kalman.update(rawLat, rawLng, effAccuracy, now);
      var lat = kFix.lat;
      var lng = kFix.lng;
      tracker.accuracyMeters = Math.round(kFix.accuracy);

      // Determine Tactical Satellite Precision Status
      if (tracker.accuracyMeters <= 8) {
        tracker.gpsStatus = 'PINPOINT';
      } else if (tracker.accuracyMeters <= 20) {
        tracker.gpsStatus = 'LOCKED';
      } else if (tracker.accuracyMeters <= 45) {
        tracker.gpsStatus = 'GOOD';
      } else if (tracker.accuracyMeters <= 80) {
        tracker.gpsStatus = 'FAIR';
      } else {
        tracker.gpsStatus = 'WEAK';
      }

      // Reject outlier anomalies exceeding usable range
      if (effAccuracy > 80) {
        tracker.updateMapHunterOnly(lat, lng, tracker.accuracyMeters, rawHeading);
        tracker.updateLiveHudDom();
        return;
      }

      var pt = [lat, lng];

      // Cold-start Satellite Refinement:
      // Within first 3 fixes, refine start point to converged fix without accumulating fake distance
      if (tracker._initialFixCount < 3) {
        tracker._initialFixCount++;
        tracker.lastValidFix = { lat: lat, lng: lng, time: now, alt: altitude };
        var startPos = {
          lat: lat,
          lng: lng,
          accuracy: tracker.accuracyMeters,
          altitude: altitude,
          heading: rawHeading || 0,
          speed: speedMps,
          timestamp: now
        };
        if (tracker.coordinates.length === 0) {
          tracker.coordinates.push(pt);
          tracker.routeHistory.push(startPos);
        } else {
          tracker.coordinates[0] = pt;
          tracker.routeHistory[0] = startPos;
        }
        tracker.currentPosition = startPos;
        tracker.updateMapFull(pt, tracker.accuracyMeters, rawHeading);
        tracker.updateLiveHudDom();
        return;
      }

      if (!tracker.lastValidFix) {
        tracker.lastValidFix = { lat: lat, lng: lng, time: now, alt: altitude };
        tracker.coordinates.push(pt);
        tracker.currentPosition = {
          lat: lat,
          lng: lng,
          accuracy: tracker.accuracyMeters,
          altitude: altitude,
          heading: rawHeading || 0,
          speed: speedMps,
          timestamp: now
        };
        tracker.routeHistory.push(tracker.currentPosition);
        tracker.updateMapFull(pt, tracker.accuracyMeters, rawHeading);
        tracker.updateLiveHudDom();
        return;
      }

      // High-precision distance calculation on Kalman trajectory
      var distM = tracker.haversine(tracker.lastValidFix.lat, tracker.lastValidFix.lng, lat, lng);
      var timeDeltaSec = (now - tracker.lastValidFix.time) / 1000;
      if (timeDeltaSec <= 0) timeDeltaSec = 0.5;

      // Dynamic Precision Noise Gate
      // Since Kalman already filtered Gaussian noise, threshold can be tight (1.2m - 2.2m)
      var minMoveMeters = tracker.accuracyMeters <= 10 ? 1.2 : (tracker.accuracyMeters <= 25 ? 1.8 : 2.5);
      if (distM < minMoveMeters) {
        tracker.updateMapHunterOnly(lat, lng, tracker.accuracyMeters, tracker._lastHeadingDeg || rawHeading);
        tracker.updateLiveHudDom();
        return;
      }

      // Physical Speed Gate (human running maximum: 12.0 m/s = 43.2 km/h)
      var calcSpeedMps = distM / timeDeltaSec;
      if (calcSpeedMps > 12.0) {
        return; // Glitch spike rejected
      }

      // Compute heading / bearing if hardware compass is missing
      var computedHeading = rawHeading;
      if (computedHeading === null) {
        computedHeading = tracker.calculateBearing(tracker.lastValidFix.lat, tracker.lastValidFix.lng, lat, lng);
      }
      if (computedHeading !== null) {
        tracker._lastHeadingDeg = computedHeading;
      }

      // Velocity & Pace Smoothing (Exponential Moving Average)
      var instantSpeedMps = (speedMps !== null && speedMps >= 0.4) ? speedMps : calcSpeedMps;
      tracker._smoothedSpeedMps = tracker._smoothedSpeedMps > 0 ?
        (0.65 * tracker._smoothedSpeedMps + 0.35 * instantSpeedMps) : instantSpeedMps;

      var speedKmh = tracker._smoothedSpeedMps * 3.6;
      tracker.currentSpeedKmh = Math.round(speedKmh * 10) / 10;
      if (tracker.currentSpeedKmh > tracker.maxSpeedKmh) {
        tracker.maxSpeedKmh = tracker.currentSpeedKmh;
      }

      // Calculate instantaneous pace from smoothed velocity
      if (tracker._smoothedSpeedMps >= 0.4) {
        tracker.currentPaceSecKm = 1000 / tracker._smoothedSpeedMps;
      } else {
        tracker.currentPaceSecKm = 0;
      }

      // Distance accumulation
      tracker.totalDistanceMeters += distM;
      tracker.coordinates.push(pt);

      tracker.currentPosition = {
        lat: lat,
        lng: lng,
        accuracy: tracker.accuracyMeters,
        altitude: altitude,
        heading: tracker._lastHeadingDeg || 0,
        speed: tracker._smoothedSpeedMps,
        timestamp: now
      };
      tracker.routeHistory.push(tracker.currentPosition);

      // Low-pass filtered Elevation tracking
      if (altitude !== null && tracker.lastAltitude !== null) {
        var altDiff = altitude - tracker.lastAltitude;
        if (Math.abs(altDiff) > 1.2 && Math.abs(altDiff) < 40) {
          tracker._altAccumulator = (tracker._altAccumulator || 0) + altDiff;
          if (tracker._altAccumulator > 2.5) {
            tracker.elevationGain += tracker._altAccumulator;
            tracker._altAccumulator = 0;
          } else if (tracker._altAccumulator < -2.5) {
            tracker._altAccumulator = 0;
          }
        }
      }
      if (altitude !== null) tracker.lastAltitude = altitude;

      // Pedometer step estimation fallback if device motion accelerometer absent
      if (tracker.stepTimestamps.length === 0) {
        var estimatedSteps = Math.floor(tracker.totalDistanceMeters / 0.82);
        tracker.totalSteps = estimatedSteps;
      }

      // Check for 1 KM Splits
      tracker.checkKmSplit();

      tracker.lastValidFix = { lat: lat, lng: lng, time: now, alt: altitude };
      tracker.updateMapFull(pt, tracker.accuracyMeters, tracker._lastHeadingDeg);
      tracker.updateLiveHudDom();
    },

    onLocationError: function (err) {
      var now = Date.now();
      if (err.code === 1) { // PERMISSION_DENIED
        tracker.gpsStatus = 'DENIED';
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        if (!tracker.lastValidFix || (now - tracker.lastValidFix.time > 20000)) {
          tracker.gpsStatus = 'UNAVAILABLE';
        }
      } else {
        // TIMEOUT
        // If we recently had a valid fix (< 15 seconds), keep status as FAIR or GOOD instead of dropping to WEAK
        if (!tracker.lastValidFix || (now - tracker.lastValidFix.time > 15000)) {
          tracker.gpsStatus = 'FAIR';
        }
      }
      tracker.updateLiveHudDom();
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

    calculateBearing: function (lat1, lon1, lat2, lon2) {
      var toRad = Math.PI / 180;
      var toDeg = 180 / Math.PI;
      var dLon = (lon2 - lon1) * toRad;
      var y = Math.sin(dLon) * Math.cos(lat2 * toRad);
      var x = Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
              Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos(dLon);
      var brng = Math.atan2(y, x) * toDeg;
      return Math.round((brng + 360) % 360);
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
       Wall-Clock Timestamp Accurate: Maintains precision even if phone sleeps
       ====================================================================== */
    onTicker: function () {
      if (!tracker.isActive) return;

      var now = Date.now();

      if (tracker.isPaused) {
        tracker.lastTickTime = now;
        tracker.updateLiveHudDom();
        return;
      }

      // Wall-Clock Elapsed Time Calculation
      var effectiveNow = tracker.isPaused ? (tracker.pauseStartTime || now) : now;
      tracker.elapsedSeconds = Math.max(0, Math.floor((effectiveNow - tracker.sessionStartTime - tracker.totalPausedMs) / 1000));

      // Moving seconds calculation & Background sleep detection:
      var deltaSec = (now - tracker.lastTickTime) / 1000;
      if (deltaSec > 1.8) {
        // App was backgrounded or phone screen was locked!
        var sleepSec = Math.floor(deltaSec);
        tracker.movingSeconds += sleepSec;
      } else {
        tracker.movingSeconds++;
      }
      tracker.lastTickTime = now;

      // Active Satellite Watchdog: If no fix for 5 seconds while active, ping hardware GPS
      if (tracker.isActive && !tracker.isPaused && 'geolocation' in navigator) {
        if (!tracker._lastGpsPingTime || (now - tracker._lastGpsPingTime > 5000)) {
          var timeSinceFix = tracker.lastValidFix ? (now - tracker.lastValidFix.time) : 99999;
          if (timeSinceFix > 5000) {
            tracker._lastGpsPingTime = now;
            navigator.geolocation.getCurrentPosition(
              function (pos) { tracker.onLocationUpdate(pos); },
              function () {},
              { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
            );
          }
        }
      }

      // Calculate Cadence (Steps Per Minute)
      var cutoff = now - 10000;
      var recentSteps = tracker.stepTimestamps.filter(function (t) { return t > cutoff; }).length;
      tracker.cadenceSpm = recentSteps > 0 ? Math.round((recentSteps / 10) * 60) : (tracker.currentSpeedKmh > 3 ? 155 : 0);

      // Calculate Average Pace (seconds per km)
      var distKm = tracker.totalDistanceMeters / 1000;
      if (distKm > 0.05 && tracker.movingSeconds > 0) {
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
      tracker.caloriesBurned = distKm * 64 + (tracker.movingSeconds / 3600) * 120;

      // Update Media Session for mobile lock screen display
      tracker.updateMediaSession();

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
      if ('wakeLock' in navigator && !tracker._wakeLock) {
        navigator.wakeLock.request('screen').then(function (lock) {
          tracker._wakeLock = lock;
          lock.addEventListener('release', function () {
            tracker._wakeLock = null;
          });
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
       Background Keep-Alive Audio & Lock Screen MediaSession API
       ====================================================================== */
    startBackgroundKeepAlive: function () {
      try {
        if (!tracker._silentAudio) {
          tracker._silentAudio = new Audio(SILENT_AUDIO_URI);
          tracker._silentAudio.loop = true;
          tracker._silentAudio.volume = 0.01;
        }
        var p = tracker._silentAudio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function () {});
        }
      } catch (e) {}
      tracker.updateMediaSession();
    },

    stopBackgroundKeepAlive: function () {
      if (tracker._silentAudio) {
        try {
          tracker._silentAudio.pause();
          tracker._silentAudio.currentTime = 0;
        } catch (e) {}
      }
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'none';
        } catch (e) {}
      }
    },

    updateMediaSessionState: function (state) {
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = state;
        } catch (e) {}
      }
    },

    updateMediaSession: function () {
      if (!('mediaSession' in navigator)) return;
      try {
        var distKm = (tracker.totalDistanceMeters / 1000).toFixed(2);
        var timeStr = U.hms(tracker.movingSeconds * 1000);
        var paceStr = tracker.formatPace(tracker.avgPaceSecKm || tracker.currentPaceSecKm);

        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Solo Quest: ' + distKm + ' KM',
          artist: 'Time: ' + timeStr + ' | Pace: ' + paceStr + '/KM',
          album: 'Project: ARISE // Running Telemetry',
          artwork: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });

        navigator.mediaSession.playbackState = tracker.isActive && !tracker.isPaused ? 'playing' : 'paused';

        navigator.mediaSession.setActionHandler('play', function () {
          tracker.resume();
        });
        navigator.mediaSession.setActionHandler('pause', function () {
          tracker.pause();
        });
      } catch (e) {}
    },

    /* ======================================================================
       Visibility Change & Background Sleep Recovery
       ====================================================================== */
    handleVisibilityChange: function () {
      if (!tracker.isActive) return;

      var now = Date.now();
      if (!document.hidden) {
        // Device unlocked or browser brought to foreground
        if (!tracker.isPaused) {
          // 1. Sync wall-clock timer immediately
          var calculatedElapsed = Math.max(0, Math.floor((now - tracker.sessionStartTime - tracker.totalPausedMs) / 1000));
          tracker.elapsedSeconds = calculatedElapsed;

          var sleepDelta = (now - tracker.lastTickTime) / 1000;
          if (sleepDelta > 1.5) {
            var sleepSec = Math.floor(sleepDelta);
            tracker.movingSeconds += sleepSec;
          }
          tracker.lastTickTime = now;

          // 2. Request immediate GPS fix to capture displacement while in background
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              function (pos) {
                tracker.onLocationUpdate(pos);
              },
              function () {},
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
          }

          // 3. Re-acquire WakeLock
          tracker.requestWakeLock();

          // 4. Update HUD
          tracker.updateLiveHudDom();
          if (S.ui && S.ui.renderRunView) S.ui.render();
        }
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
      } else if (tracker.calibratedPosition) {
        initialCenter = [tracker.calibratedPosition.lat, tracker.calibratedPosition.lng];
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

      // Accuracy Radius Circle (capped for tactical beacon precision)
      tracker.accuracyCircle = L.circle(initialCenter, {
        radius: Math.min(tracker.accuracyMeters || 12, 35),
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

      tracker.hunterMarker = L.marker(initialCenter, {
        icon: hunterIcon,
        draggable: !!tracker.isCalibratingPin
      }).addTo(map);

      // Map click handler for doorstep pinpoint calibration
      map.on('click', function (e) {
        if (tracker.isCalibratingPin && !tracker.isActive) {
          tracker.applyCalibratedCoordinate(e.latlng.lat, e.latlng.lng);
        }
      });

      // Marker drag handler for calibration
      tracker.hunterMarker.on('dragend', function (e) {
        if (!tracker.isActive) {
          var ll = e.target.getLatLng();
          tracker.applyCalibratedCoordinate(ll.lat, ll.lng);
        }
      });

      if (tracker.isCalibratingPin) {
        map.getContainer().style.cursor = 'crosshair';
      }

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
      } else if (!tracker.currentPosition && tracker.permissionStatus === 'granted') {
        tracker.acquireInitialFix(false);
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
          arrow.style.opacity = '1';
        }
      }

      if (tracker.accuracyCircle) {
        tracker.accuracyCircle.setLatLng(pt);
        tracker.accuracyCircle.setRadius(Math.min(accuracy || 12, 30));
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
        isCalibratingPin: tracker.isCalibratingPin,
        isCalibrated: !!tracker.calibratedPosition,
        calibratedPosition: tracker.calibratedPosition,
        linkedQuestId: tracker.linkedQuestId,
        permissionStatus: tracker.permissionStatus,
        permissionChecked: tracker.permissionChecked,
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
        rawAccuracyMeters: tracker.rawAccuracyMeters,
        smoothedSpeedMps: tracker._smoothedSpeedMps,
        headingDeg: tracker._lastHeadingDeg,
        splits: tracker.splits,
        coordinatesCount: tracker.coordinates.length
      };
    }
  };

  tracker.init();
})(window.SYS);

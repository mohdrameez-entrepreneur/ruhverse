/**
 * qibla.js - RuhVerse Qibla Finder
 * Calculates bearing to Kaaba and rotates compass using mobile orientation events.
 */

(function () {
  'use strict';

  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;

  let userLat = null;
  let userLng = null;
  let qiblaBearing = null;
  let deviceHeading = null;
  let orientationActive = false;
  let orientationListenerAdded = false;
  let orientationFirstSignalTimer = 0;

  const detectBtn = document.getElementById('qibla-detect-btn');
  const statusEl = document.getElementById('qibla-status');
  const spinnerEl = document.getElementById('qibla-spinner');
  const wrapperEl = document.getElementById('compass-wrapper');
  const roseEl = document.getElementById('compass-rose');
  const needleEl = document.getElementById('compass-needle');
  const bearingDisp = document.getElementById('bearing-display');
  const bearingVal = document.getElementById('bearing-value');
  const bearingCity = document.getElementById('bearing-city');
  const orientBadge = document.getElementById('orient-badge');
  const orientDot = document.getElementById('orient-dot');
  const orientText = document.getElementById('orient-text');
  const coordsStrip = document.getElementById('coords-strip');
  const dispLat = document.getElementById('disp-lat');
  const dispLng = document.getElementById('disp-lng');

  if (
    !detectBtn ||
    !statusEl ||
    !spinnerEl ||
    !wrapperEl ||
    !roseEl ||
    !needleEl ||
    !bearingDisp ||
    !bearingVal ||
    !bearingCity ||
    !orientBadge ||
    !orientDot ||
    !orientText ||
    !coordsStrip ||
    !dispLat ||
    !dispLng
  ) {
    return;
  }

  function toRad(deg) {
    return deg * Math.PI / 180;
  }

  function toDeg(rad) {
    return rad * 180 / Math.PI;
  }

  function normalizeHeading(deg) {
    const n = Number(deg);
    if (!Number.isFinite(n)) return null;
    return ((n % 360) + 360) % 360;
  }

  function calculateQiblaBearing(lat1, lng1, lat2, lng2) {
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lng2 - lng1);

    const x = Math.sin(deltaLambda) * Math.cos(phi2);
    const y = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    const theta = Math.atan2(x, y);
    return normalizeHeading(toDeg(theta));
  }

  function getScreenOrientationOffset() {
    const angleFromScreenOrientation = Number(window.screen && window.screen.orientation && window.screen.orientation.angle);
    if (Number.isFinite(angleFromScreenOrientation)) return angleFromScreenOrientation;

    const angleFromWindow = Number(window.orientation);
    if (Number.isFinite(angleFromWindow)) return angleFromWindow;

    return 0;
  }

  async function reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data && data.address ? data.address : {};
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const country = addr.country || '';
      if (city && country) return `${city}, ${country}`;
      if (country) return country;
    } catch (_) {
      // Ignore reverse geocode failures.
    }
    return null;
  }

  function renderCompass() {
    if (qiblaBearing === null) return;

    needleEl.style.transform = `rotate(${qiblaBearing}deg)`;
    if (deviceHeading !== null) {
      roseEl.style.transform = `rotate(${-deviceHeading}deg)`;
    }
  }

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'qibla-status' + (type ? ` ${type}` : '');
  }

  function showSpinner(visible) {
    spinnerEl.style.display = visible ? 'block' : 'none';
  }

  function revealCompass(lat, lng, bearing) {
    wrapperEl.style.display = 'flex';
    bearingDisp.style.display = 'block';
    orientBadge.style.display = 'inline-flex';
    coordsStrip.style.display = 'flex';

    bearingVal.textContent = `${Math.round(bearing)}°`;
    dispLat.textContent = `${lat.toFixed(4)}°`;
    dispLng.textContent = `${lng.toFixed(4)}°`;
  }

  function startOrientationSignalWatchdog() {
    window.clearTimeout(orientationFirstSignalTimer);
    orientationFirstSignalTimer = window.setTimeout(() => {
      if (orientationActive) return;
      orientText.textContent = 'Compass: move phone in a figure-8 to calibrate';
    }, 2500);
  }

  function markOrientationActive() {
    if (orientationActive) return;
    orientationActive = true;
    orientDot.classList.add('active');
    orientText.textContent = 'Compass: active';
    window.clearTimeout(orientationFirstSignalTimer);
  }

  function onDeviceOrientation(e) {
    let heading = null;

    if (typeof e.webkitCompassHeading === 'number') {
      heading = e.webkitCompassHeading;
    } else if (typeof e.alpha === 'number') {
      // Android and many non-iOS browsers expose alpha; adjust by current screen orientation.
      heading = 360 - e.alpha + getScreenOrientationOffset();
    }

    deviceHeading = normalizeHeading(heading);
    if (deviceHeading === null) return;

    markOrientationActive();
    renderCompass();
  }

  function attachOrientationListeners() {
    if (orientationListenerAdded) return;

    window.addEventListener('deviceorientationabsolute', onDeviceOrientation, { passive: true });
    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
    orientationListenerAdded = true;

    orientText.textContent = 'Compass: waiting for signal...';
    startOrientationSignalWatchdog();
  }

  async function setupDeviceOrientation() {
    if (orientationListenerAdded) return;

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm === 'granted') {
          attachOrientationListeners();
        } else {
          orientText.textContent = 'Compass: permission denied';
        }
      } catch (_) {
        orientText.textContent = 'Compass: not supported';
      }
      return;
    }

    if (typeof DeviceOrientationEvent !== 'undefined') {
      attachOrientationListeners();
      return;
    }

    orientText.textContent = 'Compass: not available on this device';
  }

  function handlePosition(pos) {
    userLat = pos.coords.latitude;
    userLng = pos.coords.longitude;
    qiblaBearing = calculateQiblaBearing(userLat, userLng, KAABA_LAT, KAABA_LNG);

    showSpinner(false);
    showStatus('Qibla direction found.', 'success');
    detectBtn.style.display = 'none';

    revealCompass(userLat, userLng, qiblaBearing);
    renderCompass();
    setupDeviceOrientation();

    reverseGeocode(userLat, userLng).then((label) => {
      if (label) bearingCity.textContent = `From ${label}`;
    });
  }

  function handleError(err) {
    showSpinner(false);
    let msg = 'Location access denied.';
    if (err && err.code === err.POSITION_UNAVAILABLE) msg = 'Location unavailable. Try again.';
    if (err && err.code === err.TIMEOUT) msg = 'Location timed out. Please retry.';
    showStatus(msg, 'error');
    detectBtn.style.display = 'inline-flex';
  }

  detectBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showStatus('Geolocation is not supported by your browser.', 'error');
      return;
    }

    showStatus('Detecting location...');
    showSpinner(true);
    detectBtn.style.display = 'none';

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000
    });
  });
})();

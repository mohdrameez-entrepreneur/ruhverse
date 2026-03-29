/**
 * qibla.js — RuhVerse Qibla Finder
 * Calculates the great-circle bearing to the Kaaba from the user's GPS location.
 * Uses DeviceOrientationEvent on mobile for a live compass experience.
 */

(function () {
    'use strict';

    // ── Kaaba coordinates (Masjid al-Haram, Makkah) ──
    const KAABA_LAT = 21.4225;
    const KAABA_LNG = 39.8262;

    // ── State ──
    let userLat = null;
    let userLng = null;
    let qiblaBearing = null;       // degrees from geographic North, clockwise
    let deviceHeading = null;      // compass heading from DeviceOrientation
    let orientationActive = false;
    let orientationListenerAdded = false;

    // ── DOM refs ──
    const detectBtn    = document.getElementById('qibla-detect-btn');
    const statusEl     = document.getElementById('qibla-status');
    const spinnerEl    = document.getElementById('qibla-spinner');
    const wrapperEl    = document.getElementById('compass-wrapper');
    const roseEl       = document.getElementById('compass-rose');
    const needleEl     = document.getElementById('compass-needle');
    const bearingDisp  = document.getElementById('bearing-display');
    const bearingVal   = document.getElementById('bearing-value');
    const bearingCity  = document.getElementById('bearing-city');
    const orientBadge  = document.getElementById('orient-badge');
    const orientDot    = document.getElementById('orient-dot');
    const orientText   = document.getElementById('orient-text');
    const coordsStrip  = document.getElementById('coords-strip');
    const dispLat      = document.getElementById('disp-lat');
    const dispLng      = document.getElementById('disp-lng');

    // ── Maths ──

    /**
     * Converts degrees to radians.
     */
    function toRad(deg) { return deg * Math.PI / 180; }

    /**
     * Converts radians to degrees.
     */
    function toDeg(rad) { return rad * 180 / Math.PI; }

    /**
     * Calculates the initial bearing (forward azimuth) from point A to point B.
     * Returns a value in [0, 360).
     *
     * Formula:
     *   θ = atan2( sin(Δλ)·cos(φ₂),
     *              cos(φ₁)·sin(φ₂) − sin(φ₁)·cos(φ₂)·cos(Δλ) )
     */
    function calculateQiblaBearing(lat1, lng1, lat2, lng2) {
        const φ1  = toRad(lat1);
        const φ2  = toRad(lat2);
        const Δλ  = toRad(lng2 - lng1);

        const x = Math.sin(Δλ) * Math.cos(φ2);
        const y = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

        const θ = Math.atan2(x, y);
        return ((toDeg(θ) % 360) + 360) % 360; // normalise to [0, 360)
    }

    /**
     * Reverse geocode: returns a human-readable city label for the coords using
     * the free Nominatim API (no key needed, subject to rate limit).
     * Falls back silently to just showing coordinates.
     */
    async function reverseGeocode(lat, lng) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
            const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
            if (!res.ok) return null;
            const data = await res.json();
            const addr = data?.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const country = addr.country || '';
            if (city && country) return `${city}, ${country}`;
            if (country) return country;
        } catch (_) { /* silent */ }
        return null;
    }

    // ── Render compass ──

    /**
     * Sets the compass needle to point toward the Qibla.
     * If deviceHeading is available, rotates the entire rose so N stays
     * aligned to true north, keeping the needle stable on screen.
     */
    function renderCompass() {
        if (qiblaBearing === null) return;

        // Needle CSS rotation: it starts pointing up (north) in the SVG,
        // so we rotate it by qiblaBearing degrees clockwise.
        needleEl.style.transform = `rotate(${qiblaBearing}deg)`;

        if (deviceHeading !== null) {
            // Rotate the rose OPPOSITE to heading so it stays north-up relative
            // to the real world, while the needle always visually points to Qibla.
            roseEl.style.transform = `rotate(${-deviceHeading}deg)`;
        }
    }

    // ── UI helpers ──

    function showStatus(msg, type) {
        statusEl.textContent = msg;
        statusEl.className = 'qibla-status' + (type ? ` ${type}` : '');
    }

    function showSpinner(visible) {
        spinnerEl.style.display = visible ? 'block' : 'none';
    }

    function revealCompass(lat, lng, bearing) {
        wrapperEl.style.display       = 'flex';
        bearingDisp.style.display     = 'block';
        orientBadge.style.display     = 'inline-flex';
        coordsStrip.style.display     = 'flex';

        bearingVal.textContent = `${Math.round(bearing)}°`;
        dispLat.textContent    = lat.toFixed(4) + '°';
        dispLng.textContent    = lng.toFixed(4) + '°';
    }

    // ── Geolocation ──

    function handlePosition(pos) {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        qiblaBearing = calculateQiblaBearing(userLat, userLng, KAABA_LAT, KAABA_LNG);

        showSpinner(false);
        showStatus('✓ Qibla direction found!', 'success');
        detectBtn.style.display = 'none';

        revealCompass(userLat, userLng, qiblaBearing);
        renderCompass();
        setupDeviceOrientation();

        // async city label
        reverseGeocode(userLat, userLng).then((label) => {
            if (label) bearingCity.textContent = `From ${label}`;
        });
    }

    function handleError(err) {
        showSpinner(false);
        let msg = 'Location access denied.';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location unavailable. Try again.';
        if (err.code === err.TIMEOUT)              msg = 'Location timed out. Please retry.';
        showStatus(msg, 'error');
        detectBtn.style.display = 'inline-flex';
    }

    detectBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showStatus('Geolocation is not supported by your browser.', 'error');
            return;
        }
        showStatus('Detecting location…');
        showSpinner(true);
        detectBtn.style.display = 'none';

        navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 30000
        });
    });

    // ── DeviceOrientation (mobile compass) ──

    function onDeviceOrientation(e) {
        // webkitCompassHeading (iOS) gives true heading directly.
        // alpha on Android: compass heading = (360 - alpha) % 360
        if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
            deviceHeading = e.webkitCompassHeading;
        } else if (e.absolute && typeof e.alpha === 'number') {
            deviceHeading = (360 - e.alpha) % 360;
        } else {
            deviceHeading = null;
        }

        if (deviceHeading !== null) {
            if (!orientationActive) {
                orientationActive = true;
                orientDot.classList.add('active');
                orientText.textContent = 'Compass: active';
            }
            renderCompass();
        }
    }

    async function setupDeviceOrientation() {
        if (orientationListenerAdded) return;

        // iOS 13+ requires permission request
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const perm = await DeviceOrientationEvent.requestPermission();
                if (perm === 'granted') {
                    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
                    orientationListenerAdded = true;
                } else {
                    orientText.textContent = 'Compass: permission denied';
                }
            } catch (_) {
                orientText.textContent = 'Compass: not supported';
            }
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            // Android / non-iOS
            window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
            orientationListenerAdded = true;
            orientText.textContent = 'Compass: waiting for signal…';
        } else {
            orientText.textContent = 'Compass: not available on this device';
        }
    }

})();

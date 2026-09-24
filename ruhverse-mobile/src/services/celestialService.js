/**
 * Celestial Service — Real-time astronomical Sun & Moon tracking
 * Dominant RuhVerse Emerald Green gradient with dynamic celestial lighting.
 */

export const CELESTIAL_THEMES = {
  dawn: {
    phaseKey: 'dawn',
    name: 'Dawn',
    subtitle: 'Subh Sadiq',
    accent: '#D4AF37', // Gold
    accentSecondary: '#FB923C', // Peach
    gradientColors: [
      '#17472D', // Deep Dawn Emerald
      '#123924',
      '#0E2C1C',
    ],
    sunColor: '#FDBA74',
    sunGlow: 'rgba(251, 146, 60, 0.65)',
    moonColor: '#FDE68A',
    moonGlow: 'rgba(253, 230, 138, 0.35)',
    arcActiveDot: '#FED7AA',
    arcInactiveDot: 'rgba(212, 175, 55, 0.35)',
  },
  morning: {
    phaseKey: 'morning',
    name: 'Morning Sun',
    subtitle: 'Ascending to Zenith',
    accent: '#D4AF37',
    accentSecondary: '#F59E0B',
    gradientColors: [
      '#1E5836', // Rich Morning Emerald
      '#17462B',
      '#103320',
    ],
    sunColor: '#FBBF24',
    sunGlow: 'rgba(251, 191, 36, 0.70)',
    moonColor: '#FDE68A',
    moonGlow: 'rgba(253, 230, 138, 0.25)',
    arcActiveDot: '#FEF3C7',
    arcInactiveDot: 'rgba(212, 175, 55, 0.35)',
  },
  day: {
    phaseKey: 'day',
    name: 'Solar Zenith',
    subtitle: 'Midday Illumination',
    accent: '#D4AF37', // Divine RuhVerse Gold
    accentSecondary: '#EAB308',
    gradientColors: [
      '#20613B', // Signature RuhVerse Emerald Green
      '#194D2F',
      '#123822',
    ],
    sunColor: '#FDE047',
    sunGlow: 'rgba(250, 204, 21, 0.75)',
    moonColor: '#E2E8F0',
    moonGlow: 'rgba(253, 230, 138, 0.20)',
    arcActiveDot: '#FEF08A',
    arcInactiveDot: 'rgba(212, 175, 55, 0.35)',
  },
  golden_hour: {
    phaseKey: 'golden_hour',
    name: 'Golden Hour',
    subtitle: 'Descending to Sunset',
    accent: '#D4AF37',
    accentSecondary: '#EA580C',
    gradientColors: [
      '#245939', // Warm Sunset Emerald
      '#1B452C',
      '#133321',
    ],
    sunColor: '#FB923C',
    sunGlow: 'rgba(249, 115, 22, 0.70)',
    moonColor: '#FEF08A',
    moonGlow: 'rgba(254, 240, 138, 0.30)',
    arcActiveDot: '#FFEDD5',
    arcInactiveDot: 'rgba(212, 175, 55, 0.35)',
  },
  dusk: {
    phaseKey: 'dusk',
    name: 'Dusk Twilight',
    subtitle: 'Shafaq & Starlight',
    accent: '#D4AF37',
    accentSecondary: '#8B5CF6',
    gradientColors: [
      '#18422E', // Twilight Deep Emerald
      '#133424',
      '#0E261B',
    ],
    sunColor: '#F97316',
    sunGlow: 'rgba(249, 115, 22, 0.35)',
    moonColor: '#E0E7FF',
    moonGlow: 'rgba(165, 180, 252, 0.70)',
    arcActiveDot: '#DDD6FE',
    arcInactiveDot: 'rgba(212, 175, 55, 0.35)',
  },
  night: {
    phaseKey: 'night',
    name: 'Starlit Night',
    subtitle: 'Moonlit Layl',
    accent: '#D4AF37',
    accentSecondary: '#38BDF8',
    gradientColors: [
      '#123724', // Midnight Deep Emerald
      '#0F2C1D',
      '#0B2015',
    ],
    sunColor: '#F59E0B',
    sunGlow: 'rgba(245, 158, 11, 0.20)',
    moonColor: '#F0F9FF',
    moonGlow: 'rgba(224, 231, 255, 0.75)',
    arcActiveDot: '#E0F2FE',
    arcInactiveDot: 'rgba(212, 175, 55, 0.35)',
  },
};

/**
 * Calculates current Lunar Phase
 */
export function getLunarPhase(date = new Date()) {
  const knownNewMoon = new Date('2024-01-11T11:57:00Z').getTime();
  const diffDays = (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const lunarAge = (diffDays % 29.53058770576 + 29.53058770576) % 29.53058770576;

  if (lunarAge < 1.845) return { name: 'New Moon', illumination: '0%' };
  if (lunarAge < 5.536) return { name: 'Waxing Crescent', illumination: '25%' };
  if (lunarAge < 9.228) return { name: 'First Quarter', illumination: '50%' };
  if (lunarAge < 12.919) return { name: 'Waxing Gibbous', illumination: '75%' };
  if (lunarAge < 16.611) return { name: 'Full Moon', illumination: '100%' };
  if (lunarAge < 20.302) return { name: 'Waning Gibbous', illumination: '75%' };
  if (lunarAge < 23.994) return { name: 'Last Quarter', illumination: '50%' };
  if (lunarAge < 27.685) return { name: 'Waning Crescent', illumination: '25%' };
  return { name: 'New Moon', illumination: '0%' };
}

/**
 * Formats a Date object into short 12h time (e.g., "6:02 AM")
 */
export function formatShortTime(dateObj) {
  if (!dateObj) return '--:--';
  const d = new Date(dateObj);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Calculates current real-time astronomical Sun & Moon Arc data
 */
export function calculateCelestialTracker(prayerTimes, targetDate = new Date()) {
  const now = targetDate.getTime();
  const d = new Date(targetDate);

  const sunriseDate = prayerTimes?.sunrise
    ? new Date(prayerTimes.sunrise)
    : new Date(new Date(d).setHours(6, 10, 0));
  const sunsetDate = prayerTimes?.maghrib
    ? new Date(prayerTimes.maghrib)
    : new Date(new Date(d).setHours(18, 16, 0));
  const dhuhrDate = prayerTimes?.dhuhr
    ? new Date(prayerTimes.dhuhr)
    : new Date(new Date(d).setHours(12, 14, 0));
  const asrDate = prayerTimes?.asr
    ? new Date(prayerTimes.asr)
    : new Date(new Date(d).setHours(15, 39, 0));
  const ishaDate = prayerTimes?.isha
    ? new Date(prayerTimes.isha)
    : new Date(new Date(d).setHours(19, 34, 0));
  const fajrDate = prayerTimes?.fajr
    ? new Date(prayerTimes.fajr)
    : new Date(new Date(d).setHours(4, 50, 0));

  const sunrise = sunriseDate.getTime();
  const sunset = sunsetDate.getTime();
  const dhuhr = dhuhrDate.getTime();
  const asr = asrDate.getTime();
  const isha = ishaDate.getTime();
  const fajr = fajrDate.getTime();

  const isDay = now >= sunrise && now < sunset;
  let phase = 'day';

  // Solar progress: 0.0 at Sunrise -> 0.5 at Noon -> 1.0 at Sunset
  let sunProgress = 0;
  if (isDay) {
    sunProgress = Math.max(0, Math.min(1, (now - sunrise) / Math.max(1, sunset - sunrise)));
    if (now < dhuhr) {
      phase = 'morning';
    } else if (now < asr) {
      phase = 'day';
    } else {
      phase = 'golden_hour';
    }
  } else if (now >= fajr && now < sunrise) {
    phase = 'dawn';
    sunProgress = 0.02;
  } else if (now >= sunset && now < isha) {
    phase = 'dusk';
    sunProgress = 0.98;
  } else {
    phase = 'night';
    sunProgress = 0;
  }

  // Lunar progress: 0.0 at Sunset/Moonrise -> 0.5 at Midnight -> 1.0 at Sunrise/Dawn
  let nightProgress = 0;
  if (!isDay) {
    if (now >= sunset) {
      const nextSunrise = sunrise + 24 * 3600 * 1000;
      nightProgress = Math.max(0, Math.min(1, (now - sunset) / Math.max(1, nextSunrise - sunset)));
    } else {
      const prevSunset = sunset - 24 * 3600 * 1000;
      nightProgress = Math.max(0, Math.min(1, (now - prevSunset) / Math.max(1, sunrise - prevSunset)));
    }
  }

  const lunarPhase = getLunarPhase(targetDate);
  const theme = CELESTIAL_THEMES[phase] || CELESTIAL_THEMES.day;

  return {
    isDay,
    phase,
    sunProgress,
    nightProgress,
    sunriseTimeStr: formatShortTime(sunriseDate),
    sunsetTimeStr: formatShortTime(sunsetDate),
    fajrTimeStr: formatShortTime(fajrDate),
    ishaTimeStr: formatShortTime(ishaDate),
    lunarPhase,
    theme,
  };
}

/**
 * Calculates coordinates along the parabolic sky arc:
 * p: 0.0 (left horizon) -> 0.5 (top zenith peak) -> 1.0 (right horizon)
 */
export function getParabolicArcPoint(progress, width = 300, height = 76) {
  const x0 = 26;
  const x1 = width - 26;
  const y0 = height - 14;
  const yc = 12;

  const p = Math.max(0, Math.min(1, progress));
  const x = x0 + p * (x1 - x0);
  const y = y0 - 4 * (y0 - yc) * p * (1 - p);

  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}

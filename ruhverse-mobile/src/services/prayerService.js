import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from 'adhan';

export const CALCULATION_METHODS = [
  { id: 'Karachi', name: 'Univ. of Islamic Sciences, Karachi (Hanafi/Standard)' },
  { id: 'MuslimWorldLeague', name: 'Muslim World League (MWL)' },
  { id: 'IslamicSocietyOfNorthAmerica', name: 'ISNA (North America)' },
  { id: 'Egyptian', name: 'Egyptian General Authority of Survey' },
  { id: 'UmmAlQura', name: 'Umm al-Qura University, Makkah' },
  { id: 'Dubai', name: 'Dubai / UAE Awqaf' },
  { id: 'Kuwait', name: 'Kuwait' },
  { id: 'Qatar', name: 'Qatar' },
  { id: 'Singapore', name: 'MUIS Singapore' },
];

export const DEFAULT_COORDINATES = {
  latitude: 28.6139,
  longitude: 77.2090,
  city: 'New Delhi',
  country: 'India',
};

/**
 * Get prayer times for given coordinates and date (100% offline calculation)
 */
export function calculatePrayerTimes({
  latitude = DEFAULT_COORDINATES.latitude,
  longitude = DEFAULT_COORDINATES.longitude,
  date = new Date(),
  methodName = 'Karachi',
  asrJuristic = 'Standard', // 'Standard' (Shafi/Hanbali/Maliki) or 'Hanafi'
} = {}) {
  try {
    const coords = new Coordinates(latitude, longitude);
    const methodFn = CalculationMethod[methodName] || CalculationMethod.Karachi;
    const params = methodFn();

    if (asrJuristic === 'Hanafi') {
      params.madhab = 'hanafi';
    }

    const prayerTimes = new PrayerTimes(coords, date, params);
    const sunnahTimes = new SunnahTimes(prayerTimes);

    return {
      fajr: prayerTimes.fajr,
      sunrise: prayerTimes.sunrise,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
      middleOfTheNight: sunnahTimes.middleOfTheNight,
      lastThirdOfTheNight: sunnahTimes.lastThirdOfTheNight,
      raw: prayerTimes,
    };
  } catch (error) {
    console.warn('Error calculating prayer times:', error);
    return null;
  }
}

/**
 * Determine the next upcoming prayer and countdown
 */
export function getNextUpcomingPrayer(prayerTimesObj) {
  if (!prayerTimesObj) return null;

  const now = new Date();
  const schedule = [
    { name: 'Fajr', time: prayerTimesObj.fajr },
    { name: 'Sunrise', time: prayerTimesObj.sunrise },
    { name: 'Dhuhr', time: prayerTimesObj.dhuhr },
    { name: 'Asr', time: prayerTimesObj.asr },
    { name: 'Maghrib', time: prayerTimesObj.maghrib },
    { name: 'Isha', time: prayerTimesObj.isha },
  ];

  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].time > now) {
      const diffMs = schedule[i].time.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        nextPrayerName: schedule[i].name,
        nextPrayerTime: schedule[i].time,
        remainingHours: hours,
        remainingMinutes: minutes,
        diffMs,
      };
    }
  }

  // If after Isha, the next prayer is tomorrow's Fajr
  return {
    nextPrayerName: 'Fajr (Tomorrow)',
    nextPrayerTime: null,
    remainingHours: 0,
    remainingMinutes: 0,
    diffMs: 0,
  };
}

/**
 * Formats a Date object to 12-hour format "05:30 AM"
 */
export function formatPrayerTime(date) {
  if (!date || isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

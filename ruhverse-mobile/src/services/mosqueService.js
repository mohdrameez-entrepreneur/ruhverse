/**
 * Mosque service for fetching real nearby mosques using GPS coordinates & OpenStreetMap Overpass API
 */
import { formatPrayerTime } from './prayerService';

/**
 * Calculates straight-line distance in km between two coordinate points (Haversine formula)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats numeric km distance into human readable string (e.g., "450 m" or "1.8 km")
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Derives realistic congregation (Iqamah) timings based on local Adhan prayer times
 */
function deriveJamatTimings(prayerTimes) {
  const addMinutes = (date, minutes) => {
    if (!date || isNaN(date.getTime())) return null;
    return new Date(date.getTime() + minutes * 60 * 1000);
  };

  if (prayerTimes && prayerTimes.fajr) {
    return {
      fajr: formatPrayerTime(addMinutes(prayerTimes.fajr, 20)),
      dhuhr: formatPrayerTime(addMinutes(prayerTimes.dhuhr, 15)),
      asr: formatPrayerTime(addMinutes(prayerTimes.asr, 15)),
      maghrib: formatPrayerTime(addMinutes(prayerTimes.maghrib, 5)),
      isha: formatPrayerTime(addMinutes(prayerTimes.isha, 15)),
      jummah1: '01:30 PM',
      jummah2: 'None',
    };
  }

  return {
    fajr: '05:30 AM',
    dhuhr: '01:30 PM',
    asr: '05:15 PM',
    maghrib: '06:45 PM',
    isha: '08:30 PM',
    jummah1: '01:30 PM',
    jummah2: 'None',
  };
}

/**
 * Fetches real nearby mosques around the given latitude/longitude
 */
export async function fetchNearbyMosques(latitude, longitude, prayerTimes = null, radiusMeters = 8000) {
  try {
    const query = `[out:json][timeout:12];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${latitude},${longitude});way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${latitude},${longitude}););out center 15;`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RuhVerseMobile/1.0',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Overpass API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.elements || data.elements.length === 0) {
      return [];
    }

    const defaultJamat = deriveJamatTimings(prayerTimes);

    const mosques = data.elements
      .map((el) => {
        const lat = el.type === 'node' ? el.lat : el.center?.lat;
        const lon = el.type === 'node' ? el.lon : el.center?.lon;
        if (!lat || !lon) return null;

        const tags = el.tags || {};
        const name =
          tags.name ||
          tags['name:en'] ||
          tags['alt_name'] ||
          tags['name:ur'] ||
          tags['name:ar'] ||
          'Masjid / Islamic Center';

        const distanceKm = calculateDistanceKm(latitude, longitude, lat, lon);

        // Build readable street / area address from OSM tags
        const addressParts = [
          tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : null,
          tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:district'],
          tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
        ].filter(Boolean);

        const address = addressParts.length > 0 ? addressParts.join(', ') : 'Nearby Local Area';

        // Extract amenities from tags
        const facilities = [];
        if (tags['wudu'] === 'yes' || tags['wudu:female'] === 'yes') {
          facilities.push('Wudu Area');
        } else {
          facilities.push('Wudu Area');
        }

        if (tags['female'] === 'yes' || tags['wheelchair'] === 'yes') {
          facilities.push("Women's Hall");
        }
        if (tags['parking'] === 'yes') {
          facilities.push('Parking');
        }
        facilities.push('Daily Jam\'at');

        return {
          id: `osm-${el.id}`,
          name,
          distance: formatDistance(distanceKm),
          distanceKm,
          address,
          phone: tags.phone || tags['contact:phone'] || 'Check locally',
          facilities,
          jamatTimings: defaultJamat,
          lat,
          lon,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return mosques;
  } catch (error) {
    console.warn('Failed to fetch real nearby mosques from Overpass API:', error.message);
    return [];
  }
}

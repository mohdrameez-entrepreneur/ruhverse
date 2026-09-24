// Kaaba Holy Sanctuary in Makkah Coordinates
export const MAKKAH_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
};

/**
 * Calculates the forward azimuth / bearing from user location to the Kaaba in Makkah
 * @param {number} userLat - User Latitude in degrees
 * @param {number} userLng - User Longitude in degrees
 * @returns {number} Bearing in degrees from North (0° - 360°)
 */
export function calculateQiblaBearing(userLat, userLng) {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const toDegrees = (rad) => (rad * 180) / Math.PI;

  const lat1 = toRadians(userLat);
  const lng1 = toRadians(userLng);
  const lat2 = toRadians(MAKKAH_COORDINATES.latitude);
  const lng2 = toRadians(MAKKAH_COORDINATES.longitude);

  const deltaLng = lng2 - lng1;

  const y = Math.sin(deltaLng);
  const x =
    Math.cos(lat1) * Math.tan(lat2) -
    Math.sin(lat1) * Math.cos(deltaLng);

  let qibla = toDegrees(Math.atan2(y, x));
  return (qibla + 360) % 360;
}

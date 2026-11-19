// Fare rules. Placeholder rates: change them here (and in frontend/src/lib/fare.js, which must match).
const BASE = 80;       // KES
const PER_KM = 35;     // KES per km
const MIN_FARE = 150;  // KES, the floor
const round10 = (n) => Math.round(n / 10) * 10;

function fareForKm(km) {
  return Math.max(MIN_FARE, round10(BASE + PER_KM * km));
}

function haversineKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// The app measures the road distance; we never trust it blindly. It can never be less than the
// straight-line distance (so a rider cannot send a tiny distance to get a cheap fare). The upper limit is
// only a sanity check, because roads can wind a long way around.
function trustedKm(clientKm, a, b) {
  const straight = haversineKm(a, b);
  const km = Number.isFinite(clientKm) ? clientKm : straight * 1.3;
  return { straight, km: Math.min(Math.max(km, straight), straight * 4 + 1) };
}

module.exports = { BASE, PER_KM, MIN_FARE, fareForKm, haversineKm, trustedKm };

// Must match backend/src/lib/fare.js. Placeholder rates.
export const BASE = 80
export const PER_KM = 35
export const MIN_FARE = 150
const round10 = (n) => Math.round(n / 10) * 10
export const fareForKm = (km) => Math.max(MIN_FARE, round10(BASE + PER_KM * km))

export function haversineKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

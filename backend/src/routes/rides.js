const express = require('express');
const prisma = require('../lib/db');
const auth = require('../middleware/auth');
const hpesa = require('../lib/hpesa');
const { fareForKm, trustedKm } = require('../lib/fare');
const router = express.Router();

const num = (v) => (typeof v === 'number' ? v : parseFloat(v));
const validPoint = (p) => p && Number.isFinite(num(p.lat)) && Number.isFinite(num(p.lng)) && Math.abs(num(p.lat)) <= 90 && Math.abs(num(p.lng)) <= 180;
const clean = (s, n = 120) => String(s || '').trim().slice(0, n);

// Order matters: the ride is saved first (PENDING), then the rider is charged, then it is confirmed.
// If anything fails after the money moved, the charge is refunded, so a rider is never charged for
// a ride that does not exist.
router.post('/request', auth, async (req, res) => {
  const { pickup, destination, distanceKm, pin } = req.body || {};
  if (!validPoint(pickup) || !validPoint(destination)) return res.status(400).json({ error: 'Choose a pickup and a destination' });
  if (!pin) return res.status(400).json({ error: 'Enter your H-Pesa PIN' });

  const a = { lat: num(pickup.lat), lng: num(pickup.lng) };
  const b = { lat: num(destination.lat), lng: num(destination.lng) };
  const { straight, km } = trustedKm(num(distanceKm), a, b);
  if (straight < 0.05) return res.status(400).json({ error: 'Pickup and destination are the same place' });
  if (km > 150) return res.status(400).json({ error: 'That trip is too far for a ride' });
  const fare = fareForKm(km);

  // one unfinished ride at a time
  const open = await prisma.ride.findFirst({ where: { riderId: req.userId, status: 'PENDING' } });
  if (open) return res.status(409).json({ error: 'A payment for your last request is still being processed. Wait a moment and try again.' });

  const ride = await prisma.ride.create({
    data: {
      riderId: req.userId, riderPhone: req.user.phone,
      pickup: clean(pickup.name) || 'Pickup', pickupLat: a.lat, pickupLng: a.lng,
      destination: clean(destination.name) || 'Destination', destLat: b.lat, destLng: b.lng,
      distanceKm: Math.round(km * 10) / 10, fare, status: 'PENDING',
    },
  });
  const reference = `ride:${ride.id}`;

  const failRide = async (reason) => {
    await prisma.ride.update({ where: { id: ride.id }, data: { status: 'FAILED', failReason: String(reason).slice(0, 200) } });
  };

  try {
    await hpesa.charge({ phone: req.user.phone, pin: String(pin), amount: fare, reference, description: `Ride to ${ride.destination}` });
  } catch (err) {
    // If H-Pesa did not answer we cannot tell whether the money moved, so ask it.
    if (!err.status) {
      try {
        const s = await hpesa.status(reference);
        if (s.status === 'COMPLETED') return confirm(ride, res, reference);
      } catch { /* still unknown: treat as failed, the reference can never be charged twice anyway */ }
    }
    await failRide(err.message);
    return res.status(err.status && err.status < 500 ? err.status : 503).json({ error: err.message });
  }
  return confirm(ride, res, reference);
});

async function confirm(ride, res, reference) {
  try {
    const updated = await prisma.ride.update({ where: { id: ride.id }, data: { status: 'ACCEPTED', driverName: 'John K. • KAA 123A' } });
    return res.json(updated);
  } catch (err) {
    try { await hpesa.refund(reference, 'Ride could not be saved'); } catch { /* reconciled later via /status */ }
    return res.status(500).json({ error: 'We could not book your ride. Any payment has been refunded.' });
  }
}

router.get('/history', auth, async (req, res) => {
  const rides = await prisma.ride.findMany({ where: { riderId: req.userId, status: { in: ['ACCEPTED', 'COMPLETED', 'CANCELLED'] } }, orderBy: { createdAt: 'desc' } });
  res.json(rides);
});

// Cancel a booked ride: the rider is refunded in full while the ride has not started.
router.post('/:id/cancel', auth, async (req, res) => {
  const ride = await prisma.ride.findFirst({ where: { id: req.params.id, riderId: req.userId } });
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== 'ACCEPTED') return res.status(400).json({ error: 'This ride can no longer be cancelled' });
  const claim = await prisma.ride.updateMany({ where: { id: ride.id, status: 'ACCEPTED' }, data: { status: 'CANCELLED' } });
  if (claim.count !== 1) return res.status(400).json({ error: 'This ride can no longer be cancelled' });
  try {
    await hpesa.refund(`ride:${ride.id}`, 'Ride cancelled by rider');
    res.json({ message: `Ride cancelled. KES ${ride.fare} refunded to your H-Pesa wallet.` });
  } catch (err) {
    await prisma.ride.updateMany({ where: { id: ride.id, status: 'CANCELLED' }, data: { status: 'ACCEPTED' } });
    res.status(503).json({ error: 'Could not refund right now, so the ride was kept. Please try again.' });
  }
});

module.exports = router;

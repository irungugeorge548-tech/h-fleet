const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

async function getHpesaToken(phone) {
  try {
    const res = await axios.post(`${process.env.HPESA_API}/api/auth/login`, { phone, password: 'password123' });
    return res.data.token;
  } catch { return null; }
}

router.post('/request', auth, async (req, res) => {
  try {
    const { pickup, destination, fare, pin } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const hpesaToken = await getHpesaToken(user.phone);
    if (!hpesaToken) return res.status(400).json({ error: 'H-Pesa not available' });

    await axios.post(`${process.env.HPESA_API}/api/transactions/send`, {
      phone: '0700111222',
      amount: fare,
      pin
    }, { headers: { Authorization: `Bearer ${hpesaToken}` } });

    const ride = await prisma.ride.create({
      data: {
        riderId: req.userId,
        pickup,
        destination,
        fare: parseFloat(fare),
        status: 'ACCEPTED',
        driverName: 'John K. • KAA 123A'
      }
    });
    res.json(ride);
  } catch (err) {
    res.status(400).json({ error: err.response?.data?.error || 'Request failed' });
  }
});

router.get('/history', auth, async (req, res) => {
  const rides = await prisma.ride.findMany({ where: { riderId: req.userId }, orderBy: { createdAt: 'desc' } });
  res.json(rides);
});

module.exports = router;

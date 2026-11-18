const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// Returns the rider's H-Pesa wallet balance (needs the H-Pesa API to be reachable)
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const login = await axios.post(`${process.env.HPESA_API}/api/auth/login`, { phone: user.phone, password: 'password123' }, { timeout: 8000 });
    const bal = await axios.get(`${process.env.HPESA_API}/api/wallet/balance`, {
      headers: { Authorization: `Bearer ${login.data.token}` }, timeout: 8000,
    });
    res.json({ balance: bal.data.balance });
  } catch {
    res.status(503).json({ error: 'H-Pesa not available' });
  }
});

module.exports = router;
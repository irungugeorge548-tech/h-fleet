const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/db');
const { sign, normalizePhone, validPhone, publicUser } = require('../lib/session');
const router = express.Router();

// H-Fleet has its own accounts. Connecting an H-Pesa wallet is optional (see /api/hpesa).
router.post('/register', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 60);
    const phone = normalizePhone(req.body?.phone);
    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 100);
    const password = String(req.body?.password || '');
    if (name.length < 2) return res.status(400).json({ error: 'Enter your full name' });
    if (!validPhone(phone)) return res.status(400).json({ error: 'Enter a valid Kenyan phone number' });
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (await prisma.user.findUnique({ where: { phone } })) return res.status(400).json({ error: 'An H-Fleet account with this phone number already exists. Log in instead.' });
    if (email && await prisma.user.findUnique({ where: { email } })) return res.status(400).json({ error: 'An H-Fleet account with this email already exists.' });
    const user = await prisma.user.create({ data: { name, phone, email: email || null, password: await bcrypt.hash(password, 10), role: 'RIDER' } });
    res.json({ token: sign(user.id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Could not create your account. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const user = await prisma.user.findUnique({ where: { phone } });
    const ok = user && await bcrypt.compare(String(req.body?.password || ''), user.password);
    if (!ok) return res.status(400).json({ error: 'Wrong phone number or password' });
    res.json({ token: sign(user.id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Could not log you in. Please try again.' });
  }
});

module.exports = router;

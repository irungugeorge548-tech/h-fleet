const express = require('express');
const prisma = require('../lib/db');
const auth = require('../middleware/auth');
const router = express.Router();
const MAX = 3;

const normalize = (p) => {
  let s = String(p || '').replace(/[\s\-()]/g, '');
  if (s.startsWith('+254')) s = '0' + s.slice(4);
  else if (s.startsWith('254') && s.length === 12) s = '0' + s.slice(3);
  return s;
};

router.get('/contacts', auth, async (req, res) => {
  res.json(await prisma.emergencyContact.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'asc' } }));
});

router.post('/contacts', auth, async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 40);
  const phone = normalize(req.body?.phone);
  if (name.length < 2) return res.status(400).json({ error: 'Enter the contact\'s name' });
  if (!/^(07|01)\d{8}$/.test(phone)) return res.status(400).json({ error: 'Enter a valid Kenyan phone number' });
  const count = await prisma.emergencyContact.count({ where: { userId: req.userId } });
  if (count >= MAX) return res.status(400).json({ error: `You can save up to ${MAX} emergency contacts` });
  res.json(await prisma.emergencyContact.create({ data: { userId: req.userId, name, phone } }));
});

router.delete('/contacts/:id', auth, async (req, res) => {
  const r = await prisma.emergencyContact.deleteMany({ where: { id: req.params.id, userId: req.userId } });
  if (!r.count) return res.status(404).json({ error: 'Contact not found' });
  res.json({ message: 'Removed' });
});

module.exports = router;

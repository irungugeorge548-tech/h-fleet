const express = require('express');
const hpesa = require('../lib/hpesa');
const router = express.Router();

const fail = (res, err) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  res.status(503).json({ error: 'H-Pesa is not available right now. Please try again.' });
};
const shape = (d) => ({ token: d.token, user: { id: d.user.id, name: d.user.name, phone: d.user.phone, email: d.user.email } });

// Riders use their H-Pesa account, so there is no separate H-Fleet password to remember.
router.post('/login', async (req, res) => {
  try { res.json(shape(await hpesa.login(req.body?.phone, req.body?.password))); } catch (err) { fail(res, err); }
});

router.post('/register', async (req, res) => {
  try { res.json(shape(await hpesa.register(req.body || {}))); } catch (err) { fail(res, err); }
});

module.exports = router;

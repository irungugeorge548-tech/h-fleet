const express = require('express');
const auth = require('../middleware/auth');
const hpesa = require('../lib/hpesa');
const router = express.Router();

router.get('/balance', auth, async (req, res) => {
  try { res.json({ balance: (await hpesa.balance(req.token)).balance }); }
  catch { res.status(503).json({ error: 'H-Pesa not available' }); }
});

module.exports = router;

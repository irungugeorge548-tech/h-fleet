const express = require('express');
const auth = require('../middleware/auth');
const hpesa = require('../lib/hpesa');
const router = express.Router();

// Profile and PIN/password changes are H-Pesa's job: we pass the rider's own token through.
const pass = (method, path) => async (req, res) => {
  try { res.json(await hpesa.account(method, path, req.token, req.body)); }
  catch (err) { res.status(err.status || 503).json({ error: err.status ? err.message : 'H-Pesa is not available right now.' }); }
};

router.get('/me', auth, pass('get', '/me'));
router.patch('/profile', auth, pass('patch', '/profile'));
router.post('/change-pin', auth, pass('post', '/change-pin'));
router.post('/change-password', auth, pass('post', '/change-password'));

module.exports = router;

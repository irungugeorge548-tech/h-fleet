const hpesa = require('../lib/hpesa');

// A rider is whoever H-Pesa says the token belongs to. Answers are remembered for a minute
// so every request does not need a round trip to H-Pesa.
const cache = new Map();
const TTL = 60 * 1000;

async function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const hit = cache.get(token);
  if (hit && Date.now() - hit.at < TTL) { req.user = hit.user; req.userId = hit.user.id; req.token = token; return next(); }
  try {
    const r = await hpesa.verify(token);
    if (!r.valid) { cache.delete(token); return res.status(401).json({ error: 'Invalid token' }); }
    cache.set(token, { at: Date.now(), user: r.user });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    req.user = r.user; req.userId = r.user.id; req.token = token;
    next();
  } catch (err) {
    res.status(503).json({ error: 'H-Pesa is not available right now. Please try again.' });
  }
}

module.exports = auth;
module.exports.clearCache = () => cache.clear();

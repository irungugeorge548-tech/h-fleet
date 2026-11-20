const prisma = require('../lib/db');
const { verify, publicUser } = require('../lib/session');

// A rider is whoever holds a valid H-Fleet token. H-Fleet has its own accounts; the H-Pesa wallet
// is an optional link (hpesaPhone) that the rider can add or remove at any time.
async function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const payload = verify(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.dbUser = user;
    req.user = publicUser(user);
    req.user.hpesaPhone = user.hpesaPhone || null;
    req.userId = user.id;
    req.token = token;
    next();
  } catch (err) {
    res.status(503).json({ error: 'Service is busy. Please try again.' });
  }
}

module.exports = auth;
module.exports.clearCache = () => {};

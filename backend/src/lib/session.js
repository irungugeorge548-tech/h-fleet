const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Set JWT_SECRET on Render. If it is missing we derive a secret from the API key so the app still works.
const secret = () => process.env.JWT_SECRET || crypto.createHash('sha256').update(`hfleet:${process.env.HFLEET_API_KEY || 'dev-only'}`).digest('hex');
const sign = (id) => jwt.sign({ id }, secret(), { expiresIn: '30d' });
const verify = (token) => { try { return jwt.verify(token, secret()); } catch { return null; } };

const normalizePhone = (p) => {
  let s = String(p || '').replace(/[\s\-()]/g, '');
  if (s.startsWith('+254')) s = '0' + s.slice(4);
  else if (s.startsWith('254') && s.length === 12) s = '0' + s.slice(3);
  return s;
};
const validPhone = (p) => /^(07|01)\d{8}$/.test(p);

// What the app is allowed to see about a rider
const publicUser = (u) => ({ id: u.id, name: u.name, phone: u.phone, email: u.email || '', hpesaLinked: !!u.hpesaPhone, hpesaPhone: u.hpesaPhone || null });

module.exports = { sign, verify, normalizePhone, validPhone, publicUser };

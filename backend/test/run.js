// Offline test of the H-Fleet backend against an in-memory database and a pretend H-Pesa.
// To test against a real H-Pesa instead:  HPESA_API=http://localhost:5000 HFLEET_API_KEY=... node test/run.js
const Module = require('module');
const { createFakePrisma } = require('./fakePrisma');
const { createStub } = require('./stubHpesa');

const KEY = process.env.HFLEET_API_KEY || 'hpk_test_key';
const fake = createFakePrisma();
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '@prisma/client') return { PrismaClient: function PrismaClient() { return fake; } };
  return realLoad.call(this, request, ...rest);
};

let passed = 0, failed = 0;
const check = (name, cond, extra) => {
  if (cond) { passed++; console.log(`  ok   ${name}`); } else { failed++; console.log(`  FAIL ${name}${extra !== undefined ? ' -> ' + JSON.stringify(extra) : ''}`); }
};

async function main() {
  let stub = null, stubServer = null;
  if (!process.env.HPESA_API) {
    stub = createStub({ key: KEY });
    stubServer = await new Promise((r) => { const s = stub.app.listen(0, () => r(s)); });
    process.env.HPESA_API = `http://127.0.0.1:${stubServer.address().port}`;
  }
  process.env.HFLEET_API_KEY = KEY;

  const app = require('../src/index.js');
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let data = null; try { data = await res.json(); } catch { /* empty */ }
    return { status: res.status, data };
  };

  const stamp = String(Date.now()).slice(-6);
  const phone = `0722${stamp}`;
  const NAIROBI = { name: 'Nairobi CBD', lat: -1.2864, lng: 36.8172 };
  const WESTLANDS = { name: 'Westlands', lat: -1.2673, lng: 36.8112 };

  console.log('Sign in through H-Pesa');
  let r = await call('POST', '/api/auth/register', { body: { name: 'Faith Tester', phone, email: `f${stamp}@t.app`, password: 'password123', pin: '1234' } });
  check('register creates an H-Pesa account', r.status === 200 && !!r.data.token, r);
  const token = r.data?.token;
  r = await call('POST', '/api/auth/login', { body: { phone, password: 'wrong' } });
  check('wrong password refused with a clear message', r.status === 400 && /Invalid/.test(r.data.error), r);
  r = await call('POST', '/api/auth/login', { body: { phone, password: 'password123' } });
  check('login works', r.status === 200 && !!r.data.token, r);
  r = await call('GET', '/api/rides/history');
  check('history needs a token', r.status === 401, r);
  r = await call('GET', '/api/rides/history', { token: 'garbage' });
  check('bad token refused', r.status === 401, r);

  console.log('Wallet');
  r = await call('GET', '/api/wallet/balance', { token });
  check('balance comes from H-Pesa', r.status === 200 && r.data.balance === 10000, r);
  r = await call('GET', '/api/account/me', { token });
  check('profile comes from H-Pesa', r.status === 200 && r.data.phone === phone, r);

  console.log('Booking a ride');
  r = await call('POST', '/api/rides/request', { token, body: { pickup: NAIROBI, destination: NAIROBI, pin: '1234' } });
  check('same pickup and destination refused', r.status === 400, r);
  r = await call('POST', '/api/rides/request', { token, body: { pickup: NAIROBI, destination: { name: 'x' }, pin: '1234' } });
  check('missing coordinates refused', r.status === 400, r);
  r = await call('POST', '/api/rides/request', { token, body: { pickup: NAIROBI, destination: WESTLANDS, distanceKm: 3.4, pin: '9999' } });
  check('wrong PIN refused', r.status === 400, r);
  r = await call('GET', '/api/rides/history', { token });
  check('a failed payment leaves no booked ride in history', r.data.length === 0, r.data);
  const failedRows = fake._state.tables.ride.filter((x) => x.status === 'FAILED');
  check('the failed attempt is recorded as FAILED, not ACCEPTED', failedRows.length === 1, fake._state.tables.ride.map(x => x.status));
  r = await call('POST', '/api/rides/request', { token, body: { pickup: NAIROBI, destination: WESTLANDS, distanceKm: 0.1, pin: '1234' } });
  check('a tiny fake distance cannot make the ride cheap', r.status === 200 && r.data.fare >= 150 && r.data.distanceKm >= 2, r.data);
  const cheap = r.data;
  r = await call('GET', '/api/wallet/balance', { token });
  check('rider was charged the server-computed fare', r.data.balance === 10000 - cheap.fare, r.data);
  check('ride is ACCEPTED after payment', cheap.status === 'ACCEPTED', cheap);

  console.log('Cancel and refund');
  r = await call('POST', `/api/rides/${cheap.id}/cancel`, { token });
  check('cancel works', r.status === 200, r);
  r = await call('GET', '/api/wallet/balance', { token });
  check('rider is refunded in full', r.data.balance === 10000, r.data);
  r = await call('POST', `/api/rides/${cheap.id}/cancel`, { token });
  check('cannot cancel twice', r.status === 400, r);
  const other = await call('POST', '/api/auth/register', { body: { name: 'Other', phone: `0733${stamp}`, email: `o${stamp}@t.app`, password: 'password123', pin: '1234' } });
  r = await call('POST', `/api/rides/${cheap.id}/cancel`, { token: other.data.token });
  check('cannot cancel someone else\'s ride', r.status === 404, r);

  if (stub) {
    console.log('When H-Pesa misbehaves');
    stub.state.failCharges = true;
    r = await call('POST', '/api/rides/request', { token, body: { pickup: NAIROBI, destination: WESTLANDS, distanceKm: 3.4, pin: '1234' } });
    check('payment error: rider sees an error', r.status >= 400, r);
    const bad = fake._state.tables.ride.filter((x) => x.status === 'ACCEPTED' && x.failReason);
    check('payment error: no ride is booked', bad.length === 0);
    stub.state.failCharges = false;

    stub.state.hangCharges = true;
    r = await call('POST', '/api/rides/request', { token, body: { pickup: NAIROBI, destination: WESTLANDS, distanceKm: 3.4, pin: '1234' } });
    stub.state.hangCharges = false;
    const hung = r.data;
    check('timeout after the money moved: the ride is still booked (status checked)', r.status === 200 && r.data.status === 'ACCEPTED', r);
    r = await call('GET', '/api/wallet/balance', { token });
    check('...and charged exactly once', r.data.balance === 10000 - hung.fare, r.data);

    // H-Pesa down entirely
    const saved = process.env.HPESA_API; process.env.HPESA_API = 'http://127.0.0.1:1';
    require('../src/middleware/auth').clearCache();
    r = await call('GET', '/api/wallet/balance', { token });
    check('H-Pesa down: clear 503, no crash', r.status === 503, r);
    process.env.HPESA_API = saved; require('../src/middleware/auth').clearCache();
  }

  console.log('Emergency contacts');
  r = await call('POST', '/api/safety/contacts', { token, body: { name: 'Mum', phone: '+254711000111' } });
  check('add contact (number normalised)', r.status === 200 && r.data.phone === '0711000111', r);
  r = await call('POST', '/api/safety/contacts', { token, body: { name: 'X', phone: '123' } });
  check('bad contact refused', r.status === 400, r);
  for (const n of ['Dad', 'Sis']) await call('POST', '/api/safety/contacts', { token, body: { name: n, phone: '0711000222' } });
  r = await call('POST', '/api/safety/contacts', { token, body: { name: 'Extra', phone: '0711000333' } });
  check('limit of 3 contacts', r.status === 400, r);
  r = await call('GET', '/api/safety/contacts', { token });
  check('list contacts', r.data.length === 3, r.data);
  r = await call('GET', '/api/safety/contacts', { token: other.data.token });
  check('contacts are private to each rider', r.data.length === 0, r.data);
  r = await call('DELETE', `/api/safety/contacts/${(await call('GET', '/api/safety/contacts', { token })).data[0].id}`, { token });
  check('remove contact', r.status === 200, r);

  console.log('Support');
  r = await call('POST', '/api/support', { token, body: { subject: 'Hi', message: 'short' } });
  check('too-short message refused', r.status === 400, r);
  r = await call('POST', '/api/support', { token, body: { subject: 'Payment question', message: 'I was charged but my ride did not start.' } });
  check('support message saved', r.status === 200, r);
  r = await call('GET', '/api/support', { token });
  check('support messages listed', r.data.length === 1, r.data);

  server.close(); if (stubServer) stubServer.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });

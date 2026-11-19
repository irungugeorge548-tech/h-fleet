require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5175,https://h-fleet.vercel.app')
  .split(',').map(o => o.trim().replace(/\/$/, ''));
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/account', require('./routes/account'));
app.use('/api/safety', require('./routes/safety'));
app.use('/api/support', require('./routes/support'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'H-Fleet', hpesa: !!process.env.HPESA_API, key: !!process.env.HFLEET_API_KEY }));

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => console.log(`H-Fleet backend on http://localhost:${PORT}`));
}

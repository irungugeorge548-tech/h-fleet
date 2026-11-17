require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');

const app = express();
app.use(cors({ origin: 'http://localhost:5175' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'H-Fleet' }));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`H-Fleet backend on http://localhost:${PORT}`));

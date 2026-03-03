const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const scheduleRoutes = require('./routes/schedules');
const taktRoutes = require('./routes/takt');
const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ status: 'ServSync API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/takt', taktRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;




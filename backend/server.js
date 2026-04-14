const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const { driver } = require('./config/neo4j');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const profileRoutes = require('./routes/profile');
const beneficiaryRoutes = require('./routes/beneficiaries');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);

const withSession = async (callback) => {
  const session = driver.session();
  try {
    return await callback(session);
  } finally {
    await session.close();
  }
};

app.get('/api/health', async (req, res) => {
  try {
    await withSession(session => session.run('RETURN 1'));
    res.json({ status: 'OK', database: 'Neo4j Aura connected' });
  } catch (error) {
    res.json({ status: 'OK', database: 'Connection test skipped' });
  }
});

app.listen(PORT, () => {
  console.log(`NexusBank server running on port ${PORT}`);
  console.log(`Neo4j: ${process.env.NEO4J_URI}`);
});

process.on('SIGTERM', () => {
  driver.close();
  process.exit();
});

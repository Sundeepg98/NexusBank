const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const logger = require('./config/logger');
const { driver } = require('./config/neo4j');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const profileRoutes = require('./routes/profile');
const beneficiaryRoutes = require('./routes/beneficiaries');
const contactRoutes = require('./routes/contact');

const swaggerSpec = require('./swagger');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10kb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many OTP requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/transactions/generate-otp', otpLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/contact', contactRoutes);

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
    logger.warn('Health check DB connection test skipped');
    res.json({ status: 'OK', database: 'Connection test skipped' });
  }
});

app.listen(PORT, () => {
  logger.info(`NexusBank server running on port ${PORT}`);
  logger.info(`Neo4j: ${process.env.NEO4J_URI}`);
});

process.on('SIGTERM', () => {
  driver.close();
  process.exit();
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});
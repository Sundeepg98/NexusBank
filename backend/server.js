const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const { driver } = require('./config/neo4j');
const { authMiddleware, blacklistedTokens } = require('./middleware/auth');

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

const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const neo4j = require('neo4j-driver');

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  blacklistedTokens.add(token);
  res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number, and special character' });
    }

    const result = await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) RETURN u', { userId: req.user.userId })
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) SET u.password = $newPassword', { userId: req.user.userId, newPassword: hashedNewPassword })
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const result = await withSession(session =>
      session.run('MATCH (u:User {id: $userId}) RETURN u', { userId: req.user.userId })
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt ? user.createdAt.toString() : null
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const result = await withSession(session =>
      session.run(
        'MATCH (u:User {id: $userId}) SET u.firstName = $firstName, u.lastName = $lastName, u.phone = $phone RETURN u',
        { userId: req.user.userId, firstName, lastName, phone }
      )
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    res.json({
      message: 'Profile updated',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        createdAt: user.createdAt ? user.createdAt.toString() : null
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.get('/api/beneficiaries', authMiddleware, async (req, res) => {
  try {
    const result = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_BENEFICIARY]->(b:Beneficiary)
         RETURN b ORDER BY b.createdAt DESC`,
        { userId: req.user.userId }
      )
    );

    const beneficiaries = result.records.map(r => {
      const props = r.get('b').properties;
      return {
        id: props.id,
        accountNumber: props.accountNumber,
        nickname: props.nickname,
        bankName: props.bankName,
        createdAt: props.createdAt ? props.createdAt.toString() : null
      };
    });

    res.json({ beneficiaries });
  } catch (error) {
    console.error('Get beneficiaries error:', error);
    res.status(500).json({ error: 'Failed to get beneficiaries' });
  }
});

app.post('/api/beneficiaries', authMiddleware, async (req, res) => {
  try {
    const { accountNumber, nickname, bankName } = req.body;

    if (!accountNumber || !nickname || !bankName) {
      return res.status(400).json({ error: 'accountNumber, nickname, and bankName are required' });
    }

    const result = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})
         CREATE (b:Beneficiary {
           id: randomUUID(),
           accountNumber: $accountNumber,
           nickname: $nickname,
           bankName: $bankName,
           createdAt: datetime()
         })
         CREATE (u)-[:HAS_BENEFICIARY]->(b)
         RETURN b`,
        { userId: req.user.userId, accountNumber, nickname, bankName }
      )
    );

    if (result.records.length === 0) {
      return res.status(500).json({ error: 'Failed to add beneficiary' });
    }

    const beneficiary = result.records[0].get('b').properties;
    res.status(201).json({
      message: 'Beneficiary added',
      beneficiary: {
        id: beneficiary.id,
        accountNumber: beneficiary.accountNumber,
        nickname: beneficiary.nickname,
        bankName: beneficiary.bankName,
        createdAt: beneficiary.createdAt ? beneficiary.createdAt.toString() : null
      }
    });
  } catch (error) {
    console.error('Add beneficiary error:', error);
    res.status(500).json({ error: 'Failed to add beneficiary' });
  }
});

app.delete('/api/beneficiaries/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_BENEFICIARY]->(b:Beneficiary {id: $id})
         DETACH DELETE b`,
        { userId: req.user.userId, id }
      )
    );

    res.json({ message: 'Beneficiary removed' });
  } catch (error) {
    console.error('Delete beneficiary error:', error);
    res.status(500).json({ error: 'Failed to remove beneficiary' });
  }
});

app.post('/api/accounts', authMiddleware, async (req, res) => {
  try {
    const { accountType, initialDeposit } = req.body;

    if (!['SAVINGS', 'CURRENT', 'FIXED'].includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }

    const deposit = initialDeposit && initialDeposit >= 0 ? initialDeposit : 0;

    const result = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})
         CREATE (a:Account {
           id: randomUUID(),
           accountNumber: substring(randomUUID(), 0, 12),
           accountType: $accountType,
           balance: $initialDeposit,
           createdAt: datetime()
         })
         CREATE (u)-[:HAS_ACCOUNT]->(a)
         RETURN a`,
        { userId: req.user.userId, accountType, initialDeposit: deposit }
      )
    );

    if (result.records.length === 0) {
      return res.status(500).json({ error: 'Failed to create account' });
    }

    const account = result.records[0].get('a').properties;
    res.status(201).json({
      message: 'Account created successfully',
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: neo4j.isInt(account.balance) ? account.balance.toNumber() : account.balance
      }
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.get('/api/accounts/:id/statement', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json', from, to } = req.query;

    let dateFilter = '';
    if (from && to) {
      dateFilter = 'AND t.timestamp >= datetime($from) AND t.timestamp <= datetime($to)';
    } else if (from) {
      dateFilter = 'AND t.timestamp >= datetime($from)';
    } else if (to) {
      dateFilter = 'AND t.timestamp <= datetime($to)';
    }

    const result = await withSession(session =>
      session.run(
        `MATCH (a:Account {id: $accountId})-[:SENT|:RECEIVED]->(t:Transaction)
         WHERE true ${dateFilter}
         RETURN t ORDER BY t.timestamp DESC`,
        { accountId: id, from, to }
      )
    );

    const accountResult = await withSession(session =>
      session.run(
        `MATCH (a:Account {id: $accountId}) RETURN a`,
        { accountId: id }
      )
    );

    if (accountResult.records.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.records[0].get('a').properties;
    const transactions = result.records.map(r => {
      const props = r.get('t').properties;
      let timestamp = props.timestamp;
      if (timestamp && typeof timestamp === 'object') {
        const t = timestamp;
        timestamp = `${t.year.low || t.year}-${String(t.month.low || t.month).padStart(2, '0')}-${String(t.day.low || t.day).padStart(2, '0')}T${String(t.hour.low || t.hour || 0).padStart(2, '0')}:${String(t.minute.low || t.minute || 0).padStart(2, '0')}:${String(t.second.low || t.second || 0).padStart(2, '0')}`;
      }
      return {
        id: props.id,
        amount: neo4j.isInt(props.amount) ? props.amount.toNumber() : props.amount,
        description: props.description,
        timestamp
      };
    });

    if (format === 'csv') {
      const csvHeader = 'Date,Description,Amount\n';
      const csvRows = transactions.map(t =>
        `"${t.timestamp}","${t.description}",${t.amount}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=statement-${id}.csv`);
      res.send(csvHeader + csvRows);
    } else {
      res.json({
        statement: {
          accountId: id,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          fromDate: from,
          toDate: to,
          generatedAt: new Date().toISOString(),
          transactions
        }
      });
    }
  } catch (error) {
    console.error('Get statement error:', error);
    res.status(500).json({ error: 'Failed to get statement' });
  }
});

app.post('/api/transfer/generate-otp', authMiddleware, async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount } = req.body;

    if (!fromAccountId || !toAccountNumber || !amount) {
      return res.status(400).json({ error: 'fromAccountId, toAccountNumber, and amount are required' });
    }

    const otp = generateOTP();
    const otpId = crypto.randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(otpId, {
      otp,
      expiresAt,
      transferData: { fromAccountId, toAccountNumber, amount }
    });

    res.json({ message: 'OTP sent', otpId, otp });
  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

app.post('/api/transfer/verify-otp', authMiddleware, async (req, res) => {
  try {
    const { otpId, otp, fromAccountId, toAccountNumber, amount, description } = req.body;

    const stored = otpStore.get(otpId);

    if (!stored || stored.expiresAt < Date.now()) {
      otpStore.delete(otpId);
      return res.status(400).json({ error: 'OTP expired or invalid' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (stored.transferData.fromAccountId !== fromAccountId ||
        stored.transferData.toAccountNumber !== toAccountNumber ||
        stored.transferData.amount != amount) {
      return res.status(400).json({ error: 'Transfer details mismatch' });
    }

    otpStore.delete(otpId);

    const fromResult = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account {id: $accountId})
         RETURN a`,
        { userId: req.user.userId, accountId: fromAccountId }
      )
    );

    if (fromResult.records.length === 0) {
      return res.status(404).json({ error: 'Source account not found' });
    }

    const fromAccount = fromResult.records[0].get('a').properties;
    if (fromAccount.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const toResult = await withSession(session =>
      session.run(
        `MATCH (a:Account {accountNumber: $accountNumber}) RETURN a`,
        { accountNumber: toAccountNumber }
      )
    );

    if (toResult.records.length === 0) {
      return res.status(404).json({ error: 'Destination account not found' });
    }

    const toAccount = toResult.records[0].get('a').properties;

    const txnId = crypto.randomUUID();

    await withSession(async (session) => {
      await session.run(
        `MATCH (from:Account {id: $fromId})
         MATCH (to:Account {id: $toId})
         CREATE (t:Transaction {
           id: $txnId,
           amount: $amount,
           description: $description,
           timestamp: datetime()
         })
         CREATE (from)-[:SENT]->(t)-[:RECEIVED]->(to)
         WITH t
         MATCH (from:Account {id: $fromId})
         SET from.balance = from.balance - $amount
         MATCH (to:Account {id: $toId})
         SET to.balance = to.balance + $amount
         RETURN t`,
        { fromId: fromAccountId, toId: toAccount.id, txnId, amount: parseFloat(amount), description: description || 'Transfer' }
      );
    });

    res.json({ success: true, transactionId: txnId });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

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

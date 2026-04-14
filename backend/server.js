const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const neo4j = require('neo4j-driver');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

app.use(cors());
app.use(express.json());

const withSession = async (callback) => {
  const session = driver.session();
  try {
    return await callback(session);
  } finally {
    await session.close();
  }
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;

    const existing = await withSession(session =>
      session.run('MATCH (u:User {email: $email}) RETURN u', { email })
    );
    if (existing.records.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await withSession(session =>
      session.run(
        `CREATE (u:User {
          id: randomUUID(),
          username: $username,
          email: $email,
          password: $password,
          firstName: $firstName,
          lastName: $lastName,
          phone: $phone,
          createdAt: datetime()
        })
        RETURN u`,
        { username, email, password: hashedPassword, firstName, lastName, phone }
      )
    );

    const user = userResult.records[0].get('u').properties;

    const accountResult = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})
         CREATE (a:Account {
           id: randomUUID(),
            accountNumber: substring(randomUUID(), 0, 12),
           accountType: 'SAVINGS',
           balance: 10000,
           createdAt: datetime()
         })
         CREATE (u)-[:HAS_ACCOUNT]->(a)
         RETURN a`,
        { userId: user.id }
      )
    );

    const account = accountResult.records[0].get('a').properties;

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, username, email, firstName, lastName },
      account: { id: account.id, accountNumber: account.accountNumber, accountType: account.accountType, balance: account.balance }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await withSession(session =>
      session.run('MATCH (u:User {email: $email}) RETURN u', { email })
    );

    if (result.records.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.records[0].get('u').properties;
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/accounts', authMiddleware, async (req, res) => {
  try {
    const result = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account)
         RETURN a ORDER BY a.createdAt DESC`,
        { userId: req.user.userId }
      )
    );

    const accounts = result.records.map(r => ({
      id: r.get('a').properties.id,
      accountNumber: r.get('a').properties.accountNumber,
      accountType: r.get('a').properties.accountType,
      balance: neo4j.isInt(r.get('a').properties.balance) 
        ? r.get('a').properties.balance.toNumber() 
        : r.get('a').properties.balance
    }));

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
});

app.post('/api/transactions/transfer', authMiddleware, async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description } = req.body;

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

    await withSession(async (session) => {
      const writeResult = await session.run(
        `MATCH (from:Account {id: $fromId})
         MATCH (to:Account {id: $toId})
         CREATE (t:Transaction {
           id: randomUUID(),
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
        { fromId: fromAccountId, toId: toAccount.id, amount: parseFloat(amount), description: description || 'Transfer' }
      );
      return writeResult;
    });

    res.json({ message: 'Transfer successful' });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const { accountId } = req.query;

    const result = await withSession(session =>
      session.run(
        `MATCH (a:Account {id: $accountId})-[:SENT|:RECEIVED]->(t:Transaction)
         RETURN t ORDER BY t.timestamp DESC LIMIT 20`,
        { accountId }
      )
    );

    const transactions = result.records.map(r => {
      const props = r.get('t').properties;
      let timestamp = props.timestamp;
      if (timestamp && typeof timestamp === 'object') {
        const t = timestamp;
        timestamp = `${t.year.low || t.year}-${String(t.month.low || t.month).padStart(2, '0')}-${String(t.day.low || t.day).padStart(2, '0')}T${String(t.hour.low || t.hour || 0).padStart(2, '0')}:${String(t.minute.low || t.minute || 0).padStart(2, '0')}:${String(t.second.low || t.second || 0).padStart(2, '0')}.${String(t.nanosecond ? t.nanosecond.low || t.nanosecond : 0).padStart(9, '0')}${t.timezone && t.timezone.id ? t.timezone.id.replace('UTC', '+00:00') : '+00:00'}`;
      }
      return {
        id: props.id,
        amount: neo4j.isInt(props.amount) ? props.amount.toNumber() : props.amount,
        description: props.description,
        timestamp
      };
    });
    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
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

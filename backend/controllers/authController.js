const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { withSession } = require('../config/neo4j');

const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;

    const existingUser = await withSession(session =>
      session.run('MATCH (u:User {email: $email}) RETURN u', { email })
    );

    if (existingUser.records.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await withSession(session =>
      session.run(
        `CREATE (u:User {
          id: randomUUID(),
          username: $username,
          email: $email,
          password: $hashedPassword,
          firstName: $firstName,
          lastName: $lastName,
          phone: $phone,
          createdAt: datetime()
        })
        RETURN u`,
        { username, email, hashedPassword, firstName, lastName, phone }
      )
    );

    const user = result.records[0].get('u').properties;

    const accountResult = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})
         CREATE (a:Account {
           id: randomUUID(),
           accountNumber: substring(randomUUID(), 0, 12),
           accountType: 'SAVINGS',
           balance: 0,
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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        accountType: account.accountType
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await withSession(session =>
      session.run('MATCH (u:User {email: $email}) RETURN u', { email })
    );

    if (result.records.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.records[0].get('u').properties;

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})
         OPTIONAL MATCH (u)-[:HAS_ACCOUNT]->(a:Account)
         RETURN u, collect(a) as accounts`,
        { userId: req.user.userId }
      )
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.records[0].get('u').properties;
    const accounts = result.records[0].get('accounts').map(r => r.properties);

    delete user.password;

    res.json({ user, accounts });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

module.exports = { register, login, getProfile };

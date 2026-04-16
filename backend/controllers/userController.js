const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { withSession } = require('../config/neo4j');
const { validatePassword } = require('../utils/passwordValidator');

const INITIAL_BALANCE = 10000;

const register = async ({ username, email, password, confirmPassword, firstName, lastName, phone }) => {
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    throw new Error('Username must be 3-30 alphanumeric characters');
  }
  if (!/^[a-zA-Z]{1,50}$/.test(firstName)) {
    throw new Error('First name must be 1-50 letters');
  }
  if (!/^[a-zA-Z]{1,50}$/.test(lastName)) {
    throw new Error('Last name must be 1-50 letters');
  }
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  const existing = await withSession(session =>
    session.run('MATCH (u:User {email: $email}) RETURN u', { email })
  );
  if (existing.records.length > 0) {
    throw new Error('User already exists');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message);
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
      WITH u
      CREATE (a:Account {
        id: randomUUID(),
        accountNumber: substring(randomUUID(), 0, 12),
        accountType: 'SAVINGS',
        balance: $initialBalance,
        createdAt: datetime()
      })
      CREATE (u)-[:HAS_ACCOUNT]->(a)
      RETURN u, a`,
      { username, email, hashedPassword, firstName, lastName, phone, initialBalance: INITIAL_BALANCE }
    )
  );

  const user = result.records[0].get('u').properties;
  const account = result.records[0].get('a').properties;

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    message: 'Registration successful',
    token,
    user: {
      id: user.id,
      username,
      email,
      firstName,
      lastName
    },
    account: {
      id: account.id,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      balance: account.balance
    }
  };
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.user;

    await withSession(async (session) => {
      await session.executeWrite(async (tx) => {
        await tx.run(
          `MATCH (u:User {id: $userId})
           DETACH DELETE u`,
          { userId }
        );
      });
    });

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = {
  register,
  deleteUser
};

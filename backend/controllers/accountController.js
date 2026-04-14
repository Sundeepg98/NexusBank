const { session } = require('../config/neo4j');

const getAccounts = async (req, res) => {
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account)
       RETURN a ORDER BY a.createdAt DESC`,
      { userId: req.user.userId }
    );

    const accounts = result.records.map(record => record.get('a').properties);

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
};

const getAccountById = async (req, res) => {
  try {
    const { accountId } = req.params;

    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account {id: $accountId})
       RETURN a`,
      { userId: req.user.userId, accountId }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = result.records[0].get('a').properties;

    res.json({ account });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Failed to get account' });
  }
};

const getAccountBalance = async (req, res) => {
  try {
    const { accountId } = req.params;

    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account {id: $accountId})
       RETURN a.balance as balance`,
      { userId: req.user.userId, accountId }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const balance = result.records[0].get('balance');

    res.json({ accountId, balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
};

module.exports = { getAccounts, getAccountById, getAccountBalance };

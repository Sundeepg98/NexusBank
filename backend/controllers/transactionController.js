const { session } = require('../config/neo4j');

const getTransactions = async (req, res) => {
  try {
    const { accountId, limit = 20, offset = 0 } = req.query;

    let query = `
      MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account {id: $accountId})
      MATCH (a)-[:SENT|:RECEIVED]->(t:Transaction)
      RETURN t ORDER BY t.timestamp DESC
      SKIP $offset LIMIT $limit
    `;

    const result = await session.run(query, {
      userId: req.user.userId,
      accountId,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const transactions = result.records.map(record => record.get('t').properties);

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
};

const transfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const fromAccountResult = await session.run(
      `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account {id: $fromAccountId})
       RETURN a`,
      { userId: req.user.userId, fromAccountId }
    );

    if (fromAccountResult.records.length === 0) {
      return res.status(404).json({ error: 'Source account not found' });
    }

    const fromAccount = fromAccountResult.records[0].get('a').properties;

    if (fromAccount.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const toAccountResult = await session.run(
      `MATCH (a:Account {accountNumber: $toAccountNumber}) RETURN a`,
      { toAccountNumber }
    );

    if (toAccountResult.records.length === 0) {
      return res.status(404).json({ error: 'Destination account not found' });
    }

    const toAccount = toAccountResult.records[0].get('a').properties;

    const transactionResult = await session.run(
      `MATCH (from:Account {id: $fromAccountId})
       MATCH (to:Account {id: $toAccountId})
       CREATE (t:Transaction {
         id: randomUUID(),
         amount: $amount,
         description: $description,
         type: 'TRANSFER',
         timestamp: datetime()
       })
       CREATE (from)-[:SENT]->(t)-[:RECEIVED]->(to)
       WITH t
       MATCH (from:Account {id: $fromAccountId})
       SET from.balance = from.balance - $amount
       MATCH (to:Account {id: $toAccountId})
       SET to.balance = to.balance + $amount
       RETURN t`,
      {
        fromAccountId,
        toAccountId: toAccount.id,
        amount: parseFloat(amount),
        description: description || 'Transfer'
      }
    );

    const transaction = transactionResult.records[0].get('t').properties;

    res.json({
      message: 'Transfer successful',
      transaction: {
        ...transaction,
        fromAccount: fromAccount.accountNumber,
        toAccount: toAccount.accountNumber
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
};

module.exports = { getTransactions, transfer };

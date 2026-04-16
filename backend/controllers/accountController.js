const { withSession, toNumber } = require('../config/neo4j');

const ACCOUNT_TYPES = Object.freeze({
  SAVINGS: 'SAVINGS',
  CURRENT: 'CURRENT',
  FIXED: 'FIXED'
});

const VALID_ACCOUNT_TYPES = Object.values(ACCOUNT_TYPES);

const getAccounts = async (req, res) => {
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
      balance: toNumber(r.get('a').properties.balance)
    }));

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
};

const createAccount = async (req, res) => {
  try {
    const { accountType, initialDeposit } = req.body;

    if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
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
        balance: toNumber(account.balance)
      }
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

const getAccountStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json', from, to } = req.query;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let dateFilter = '';
    if (from && to) {
      dateFilter = 'AND t.timestamp >= datetime($from) AND t.timestamp <= datetime($to)';
    } else if (from) {
      dateFilter = 'AND t.timestamp >= datetime($from)';
    } else if (to) {
      dateFilter = 'AND t.timestamp <= datetime($to)';
    }

    const result = await withSession(async (session) => {
      return await session.executeRead(async (tx) => {
        const accountResult = await tx.run(
          `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account {id: $accountId})
           RETURN a`,
          { userId: req.user.userId, accountId: id }
        );

        if (accountResult.records.length === 0) {
          return { accessDenied: true };
        }

        const transactionsResult = await tx.run(
          `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account {id: $accountId})-[:SENT|:RECEIVED]->(t:Transaction)
           WHERE true ${dateFilter}
           RETURN t ORDER BY t.timestamp DESC`,
          { userId: req.user.userId, accountId: id, from, to }
        );

        return {
          account: accountResult.records[0].get('a'),
          transactions: transactionsResult.records
        };
      });
    });

    if (result.accessDenied) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const account = result.account.properties;
    const transactions = result.transactions.map(r => {
      const props = r.get('t').properties;
      let timestamp = props.timestamp;
      if (timestamp && typeof timestamp === 'object') {
        const t = timestamp;
        timestamp = `${t.year.low || t.year}-${String(t.month.low || t.month).padStart(2, '0')}-${String(t.day.low || t.day).padStart(2, '0')}T${String(t.hour.low || t.hour || 0).padStart(2, '0')}:${String(t.minute.low || t.minute || 0).padStart(2, '0')}:${String(t.second.low || t.second || 0).padStart(2, '0')}`;
      }
      return {
        id: props.id,
        amount: toNumber(props.amount),
        description: props.description,
        timestamp
      };
    });

    let totalCredits = 0;
    let totalDebits = 0;
    transactions.forEach(t => {
      if (t.amount > 0) {
        totalCredits += t.amount;
      } else {
        totalDebits += Math.abs(t.amount);
      }
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
        accountId: id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        fromDate: from,
        toDate: to,
        generatedAt: new Date().toISOString(),
        totalCredits,
        totalDebits,
        transactions
      });
    }
  } catch (error) {
    console.error('Get statement error:', error);
    res.status(500).json({ error: 'Failed to get statement' });
  }
};

module.exports = { getAccounts, createAccount, getAccountStatement, ACCOUNT_TYPES };

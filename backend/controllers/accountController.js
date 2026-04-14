const neo4j = require('neo4j-driver');
const { driver } = require('../config/neo4j');

const withSession = async (callback) => {
  const session = driver.session();
  try {
    return await callback(session);
  } finally {
    await session.close();
  }
};

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
      balance: neo4j.isInt(r.get('a').properties.balance)
        ? r.get('a').properties.balance.toNumber()
        : r.get('a').properties.balance
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
};

const getAccountStatement = async (req, res) => {
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
};

module.exports = { getAccounts, createAccount, getAccountStatement };

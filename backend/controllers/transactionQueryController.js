const { withSession, toNumber } = require('../config/neo4j');

const getTransactions = async (req, res) => {
  try {
    const { accountId, page = 1, limit = 20 } = req.query;
    
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }
    
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const userAccountsResult = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account)
         RETURN a.id as accountId`,
        { userId: req.user.userId }
      )
    );

    const userAccountIds = userAccountsResult.records.map(r => r.get('accountId'));
    if (!userAccountIds.includes(accountId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const txResult = await withSession(session =>
      session.run(
        `MATCH (a:Account {id: $accountId})-[:SENT|:RECEIVED]->(t:Transaction)
         WITH t ORDER BY t.timestamp DESC
         WITH collect(t) as txns, count(t) as total
         RETURN txns, total`,
        { accountId }
      )
    );
    
    let total = 0;
    let txns = [];
    if (txResult.records.length > 0) {
      const record = txResult.records[0];
      const totalVal = record.get('total');
      total = toNumber(totalVal) || 0;
      txns = record.get('txns') || [];
    }

    const paginatedTxns = txns.slice(skip, skip + limitNum);
    
    const transactions = paginatedTxns.map(t => {
      const props = t.properties;
      let timestamp = props.timestamp;
      if (timestamp && typeof timestamp === 'object') {
        const tm = timestamp;
        timestamp = `${tm.year.low || tm.year}-${String(tm.month.low || tm.month).padStart(2, '0')}-${String(tm.day.low || tm.day).padStart(2, '0')}T${String(tm.hour.low || tm.hour || 0).padStart(2, '0')}:${String(tm.minute.low || tm.minute || 0).padStart(2, '0')}:${String(tm.second.low || tm.second || 0).padStart(2, '0')}`;
      }
      return {
        id: props.id,
        amount: toNumber(props.amount),
        description: props.description,
        timestamp
      };
    });

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: skip + transactions.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get transactions' });
  }
};

module.exports = { getTransactions };

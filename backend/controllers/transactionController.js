const neo4j = require('neo4j-driver');
const crypto = require('crypto');
const xss = require('xss');
const logger = require('../config/logger');
const { createOtpEntry, verifyOtpEntry } = require('../config/otp');
const { driver } = require('../config/neo4j');

const sanitizeDescription = (description) => {
  if (!description) return 'Transfer';
  return xss(description.trim());
};

const withSession = async (callback) => {
  const session = driver.session();
  try {
    return await callback(session);
  } finally {
    await session.close();
  }
};

const getTransactions = async (req, res) => {
  try {
    const { accountId, page = 1, limit = 20 } = req.query;
    
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }
    
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

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
      total = neo4j.isInt(totalVal) ? totalVal.toNumber() : (totalVal || 0);
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
        amount: neo4j.isInt(props.amount) ? props.amount.toNumber() : props.amount,
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
    logger.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
};

const transfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description } = req.body;

    if (!/^\d{10,14}$/.test(toAccountNumber)) {
      return res.status(400).json({ error: 'toAccountNumber must be 10-14 digits' });
    }

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
        { fromId: fromAccountId, toId: toAccount.id, amount: parseFloat(amount), description: sanitizeDescription(description) }
      );
      return writeResult;
    });

    res.json({ message: 'Transfer successful' });
  } catch (error) {
    logger.error('Transfer error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
};

const createOTP = async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount } = req.body;

    if (!fromAccountId || !toAccountNumber) {
      return res.status(400).json({ error: 'fromAccountId and toAccountNumber are required' });
    }

    const isBatchTransfer = toAccountNumber === 'BATCH_TRANSFER';

    if (!isBatchTransfer && !/^\d{10,14}$/.test(toAccountNumber)) {
      return res.status(400).json({ error: 'toAccountNumber must be 10-14 digits' });
    }

    if (!isBatchTransfer && !amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const { otpId, expiresAt } = await createOtpEntry({
      transferData: { fromAccountId, toAccountNumber, amount: amount || 0 },
      userId: req.user.userId
    });

    res.json({ message: 'OTP sent', otpId, expiresIn: 300 });
  } catch (error) {
    logger.error('Generate OTP error:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { otpId, otp, fromAccountId, toAccountNumber, amount, description } = req.body;

    const result = await verifyOtpEntry(otpId, otp);

    if (!result.valid) {
      if (result.reason === 'locked_out') {
        return res.status(429).json({
          error: 'Too many failed attempts. OTP has been locked.',
          attempts: result.attempts
        });
      }
      if (result.reason === 'expired') {
        return res.status(400).json({ error: 'OTP expired or invalid' });
      }
      return res.status(400).json({
        error: 'Invalid OTP',
        attempts: result.attempts || 1
      });
    }

    const isBatchTransfer = toAccountNumber === 'BATCH_TRANSFER';

    if (isBatchTransfer) {
      return res.json({ success: true, batchVerified: true });
    }

    if (result.data.transferData.fromAccountId !== fromAccountId ||
        result.data.transferData.toAccountNumber !== toAccountNumber ||
        result.data.transferData.amount !== amount) {
      return res.status(400).json({ error: 'Transfer details mismatch' });
    }

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
        { fromId: fromAccountId, toId: toAccount.id, txnId, amount: parseFloat(amount), description: sanitizeDescription(description) }
      );
    });

    res.json({ success: true, transactionId: txnId });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
};

module.exports = { getTransactions, transfer, createOTP, verifyOTP };
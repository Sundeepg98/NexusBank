const crypto = require('crypto');
const xss = require('xss');
const logger = require('../config/logger');
const { createOtpEntry, verifyOtpEntry, OTP_PURPOSE } = require('../config/otp');
const { withSession } = require('../config/neo4j');
const { TransferService, TransferError, InsufficientFundsError } = require('../domain/services/TransferService');

const transferService = new TransferService();

const mapTransferError = (error) => {
  if (error instanceof InsufficientFundsError) {
    return { status: 400, message: 'Insufficient funds' };
  }
  if (error instanceof TransferError) {
    const statusMap = { ACCOUNT_NOT_FOUND: 404 };
    return { status: statusMap[error.code] || 400, message: error.message };
  }
  return { status: 500, message: 'Transfer failed' };
};

const BATCH_TRANSFER_ACCOUNT = 'BATCH_TRANSFER';

const sanitizeDescription = (description) => {
  if (!description) return 'Transfer';
  return xss(description.trim());
};

const transfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount, description } = req.body;

    if (!/^[A-Za-z0-9-]{6,20}$/.test(toAccountNumber)) {
      return res.status(400).json({ error: 'toAccountNumber must be 6-20 alphanumeric characters' });
    }

    await transferService.transfer({
      fromAccountId,
      toAccountNumber,
      amount,
      description: sanitizeDescription(description),
      userId: req.user.userId
    });

    res.json({ message: 'Transfer successful' });
  } catch (error) {
    const { status, message } = mapTransferError(error);
    logger.error('Transfer error:', error);
    res.status(status).json({ error: message });
  }
};

const createOTP = async (req, res) => {
  try {
    const { fromAccountId, toAccountNumber, amount } = req.body;

    if (!fromAccountId || !toAccountNumber) {
      return res.status(400).json({ error: 'fromAccountId and toAccountNumber are required' });
    }

    const isBatchTransfer = toAccountNumber === BATCH_TRANSFER_ACCOUNT;

    if (!isBatchTransfer && !/^[A-Za-z0-9-]{6,20}$/.test(toAccountNumber)) {
      return res.status(400).json({ error: 'toAccountNumber must be 6-20 alphanumeric characters' });
    }

    if (!isBatchTransfer && !amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const otpResult = await createOtpEntry({
      purpose: isBatchTransfer ? OTP_PURPOSE.BATCH_TRANSFER : OTP_PURPOSE.TRANSFER,
      transferData: { fromAccountId, toAccountNumber, amount: amount || 0 },
      userId: req.user.userId
    });

    const response = { message: 'OTP sent', otpId: otpResult.otpId, expiresIn: 300 };
    if (otpResult.otp) {
      response.otp = otpResult.otp;
    }
    res.json(response);
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

    const isBatchTransfer = result.data.purpose === OTP_PURPOSE.BATCH_TRANSFER;

    if (isBatchTransfer) {
      if (toAccountNumber !== BATCH_TRANSFER_ACCOUNT) {
        return res.status(400).json({ error: 'OTP purpose mismatch for batch transfer' });
      }
      return res.json({ success: true, batchVerified: true, transactionId: null });
    }

    if (String(result.data.transferData.fromAccountId) !== String(fromAccountId) ||
        String(result.data.transferData.toAccountNumber) !== String(toAccountNumber) ||
        Number(result.data.transferData.amount) !== Number(amount)) {
      return res.status(400).json({ error: 'Transfer details mismatch' });
    }

    const txnId = crypto.randomUUID();

    await transferService.transfer({
      fromAccountId,
      toAccountNumber,
      amount,
      description: sanitizeDescription(description),
      userId: req.user.userId
    });

    res.json({ success: true, transactionId: txnId });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Transfer failed' });
  }
};

const batchTransfer = async (req, res) => {
  try {
    const { fromAccountId, transfers } = req.body;

    if (!fromAccountId || !Array.isArray(transfers) || transfers.length === 0) {
      return res.status(400).json({ error: 'fromAccountId and transfers array are required' });
    }

    const result = await withSession(async (session) => {
      return session.executeWrite(async (tx) => {
        const accountResult = await tx.run(
          `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account {id: $accountId})
           RETURN a`,
          { userId: req.user.userId, accountId: fromAccountId }
        );

        if (accountResult.records.length === 0) {
          throw { status: 404, message: 'Source account not found' };
        }

        const fromAccount = accountResult.records[0].get('a').properties;
        const totalAmount = transfers.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        if (fromAccount.balance < totalAmount) {
          throw { status: 400, message: 'Insufficient funds for batch transfer' };
        }

        const transferQueries = [];
        for (const transfer of transfers) {
          const amount = parseFloat(transfer.amount);
          if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
            throw { status: 400, message: 'Invalid transfer amount' };
          }
          const toResult = await tx.run(
            `MATCH (a:Account {accountNumber: $accountNumber}) RETURN a`,
            { accountNumber: transfer.toAccountNumber }
          );

          if (toResult.records.length === 0) {
            throw { status: 404, message: `Destination account ${transfer.toAccountNumber} not found` };
          }

          const toAccount = toResult.records[0].get('a').properties;
          const txnId = crypto.randomUUID();

          await tx.run(
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
             SET to.balance = to.balance + $amount`,
            {
              fromId: fromAccountId,
              toId: toAccount.id,
              txnId,
              amount: parseFloat(transfer.amount),
              description: sanitizeDescription(transfer.description)
            }
          );
          transferQueries.push({ txnId, toAccountNumber: transfer.toAccountNumber });
        }

        return {
          success: true,
          message: `Successfully executed ${transfers.length} transfers`,
          transfers: transferQueries
        };
      });
    });
    res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    logger.error('Batch transfer error:', error);
    res.status(500).json({ error: 'Batch transfer failed - all transfers rolled back' });
  }
};

module.exports = { transfer, createOTP, verifyOTP, batchTransfer };

const { withSession } = require('../../config/neo4j');
const { Money } = require('../valueObjects/Money');
const { AccountNumber } = require('../valueObjects/AccountNumber');

class TransferError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

class InsufficientFundsError extends TransferError {
  constructor() {
    super('Insufficient funds', 'INSUFFICIENT_FUNDS');
  }
}

class TransferService {
  async transfer({ fromAccountId, toAccountNumber, amount, description, userId }) {
    const toAccount = new AccountNumber(toAccountNumber);
    const transferAmount = Money.fromNumber(amount);

    // Validate balance
    const fromAccount = await this.#getAccount(fromAccountId, userId);
    if (!fromAccount) {
      throw new TransferError('Source account not found', 'ACCOUNT_NOT_FOUND');
    }

    const balance = Money.fromNumber(fromAccount.balance);
    if (!balance.isGreaterThanOrEqual(transferAmount)) {
      throw new InsufficientFundsError();
    }

    // Execute transfer
    await this.#executeTransfer({
      fromAccountId: fromAccount.id,
      toAccountNumber: toAccount.value,
      amount: transferAmount.toNumber(),
      description: description || 'Transfer'
    });

    return { success: true };
  }

  async #getAccount(accountId, userId) {
    const result = await withSession(session =>
      session.run(
        `MATCH (u:User {id: $userId})-[:HAS_ACCOUNT]->(a:Account {id: $accountId})
         RETURN a`,
        { userId, accountId }
      )
    );
    if (result.records.length === 0) return null;
    return result.records[0].get('a').properties;
  }

  async #executeTransfer({ fromAccountId, toAccountNumber, amount, description }) {
    await withSession(session =>
      session.executeWrite(async (tx) => {
        await tx.run(
          `MATCH (from:Account {id: $fromAccountId}), (to:Account {accountNumber: $toAccountNumber})
           CREATE (t:Transaction {id: randomUUID(), amount: $amount, description: $description, createdAt: datetime()})
           CREATE (from)-[:SENT]->(t)-[:RECEIVED]->(to)
           SET from.balance = from.balance - $amount
           SET to.balance = to.balance + $amount`,
          { fromAccountId, toAccountNumber, amount, description }
        );
      })
    );
  }
}

module.exports = { TransferService, TransferError, InsufficientFundsError };

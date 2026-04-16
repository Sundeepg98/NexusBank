/**
 * Port interface for transaction operations
 */
class ITransactionRepository {
  async create(transaction) { throw new Error('Not implemented'); }
  async findByAccount(accountId) { throw new Error('Not implemented'); }
  async findById(transactionId) { throw new Error('Not implemented'); }
}

module.exports = { ITransactionRepository };

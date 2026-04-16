/**
 * Port interface for account operations
 * Implementations: Neo4jAccountRepository, MockAccountRepository
 */
class IAccountRepository {
  async findById(accountId) { throw new Error('Not implemented'); }
  async findByAccountNumber(accountNumber) { throw new Error('Not implemented'); }
  async findByUser(userId) { throw new Error('Not implemented'); }
  async updateBalance(accountId, newBalance) { throw new Error('Not implemented'); }
}

module.exports = { IAccountRepository };

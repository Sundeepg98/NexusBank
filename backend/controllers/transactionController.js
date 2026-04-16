const { getTransactions } = require('./transactionQueryController');
const { transfer, createOTP, verifyOTP, batchTransfer } = require('./transactionCommandController');

module.exports = { getTransactions, transfer, createOTP, verifyOTP, batchTransfer };

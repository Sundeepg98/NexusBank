const transactionController = require('./transactionController');

jest.mock('../config/neo4j', () => ({
  withSession: jest.fn()
}));

const mockRequest = (body = {}, query = {}, user = {}) => ({
  body,
  query,
  user,
  headers: {}
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const { withSession } = require('../config/neo4j');

describe('transactionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should be defined', () => {
      expect(transactionController.getTransactions).toBeDefined();
    });

    it('should call res.json on success', async () => {
      withSession.mockResolvedValue({ records: [] });

      const req = mockRequest({}, { accountId: 'acc-1', limit: 10 }, { userId: 'user-1' });
      const res = mockResponse();
      await transactionController.getTransactions(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('transfer', () => {
    it('should be defined', () => {
      expect(transactionController.transfer).toBeDefined();
    });

    it('should return 400 for invalid amount', async () => {
      const req = mockRequest({ fromAccountId: 'acc-1', toAccountNumber: 'acc-2', amount: -100 }, {}, { userId: 'user-1' });
      const res = mockResponse();
      await transactionController.transfer(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for same account transfer', async () => {
      const req = mockRequest({ fromAccountId: 'acc-1', toAccountNumber: 'acc-1', amount: 100 }, {}, { userId: 'user-1' });
      const res = mockResponse();
      await transactionController.transfer(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

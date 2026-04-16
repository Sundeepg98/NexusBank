beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-12345';
});

jest.mock('../config/neo4j', () => ({
  withSession: jest.fn()
}));

jest.mock('../config/otp', () => ({
  createOtpEntry: jest.fn(),
  verifyOtpEntry: jest.fn()
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const sessionController = require('./sessionController');
const { withSession } = require('../config/neo4j');

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should be defined', () => {
      const authController = require('./authController');
      expect(authController.register).toBeDefined();
    });

    it('should throw if passwords do not match', async () => {
      const authController = require('./authController');
      await expect(authController.register({
        email: 'test@test.com',
        password: 'pass1',
        confirmPassword: 'pass2',
        username: 'test',
        firstName: 'Test',
        lastName: 'User'
      })).rejects.toThrow('Passwords do not match');
    });
  });

  describe('login', () => {
    it('should be defined', () => {
      expect(sessionController.login).toBeDefined();
    });
  });
});

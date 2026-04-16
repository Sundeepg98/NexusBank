let mockStoredOTPs = new Map();
let mockBcryptCompare = jest.fn();

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockImplementation((data, salt) =>
    Promise.resolve('$2a$10$hashed_mock')
  ),
  compare: jest.fn().mockImplementation((plain, hash) => mockBcryptCompare(plain, hash)),
}));

jest.mock('./neo4j', () => ({
  withSession: jest.fn().mockImplementation(async (callback) => {
    return callback({
      run: jest.fn().mockImplementation((query, params) => {
        if (query.includes('CREATE') && query.includes('OTP')) {
          const nodeProps = {
            otpId: params.otpId,
            otp: params.hashedOtp,
            plainOtp: params.plainOtp,
            expiresAt: params.expiresAt,
            createdAt: params.createdAt,
            userId: params.userId,
            purpose: params.purpose,
            transferData: params.transferData,
            failedAttempts: 0
          };
          mockStoredOTPs.set(params.otpId, nodeProps);
          return { records: [{ get: () => ({ properties: nodeProps }) }] };
        }
        if (query.includes('MATCH') && query.includes('OTP') && !query.includes('DELETE')) {
          const stored = mockStoredOTPs.get(params.otpId);
          if (stored) {
            return { records: [{ get: () => ({ properties: stored }) }] };
          }
          return { records: [] };
        }
        if (query.includes('DELETE') && query.includes('OTP')) {
          mockStoredOTPs.delete(params.otpId);
          return { records: [] };
        }
        return { records: [] };
      }),
      close: jest.fn()
    });
  })
}));

const { createOtpEntry, verifyOtpEntry, generateOTP } = require('./otp');

describe('OTP utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockStoredOTPs.clear();
    mockBcryptCompare.mockImplementation((plain, hash) => {
      for (const entry of mockStoredOTPs.values()) {
        if (entry.otp === hash && entry.plainOtp !== undefined) {
          return Promise.resolve(entry.plainOtp === plain);
        }
      }
      return Promise.resolve(true);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs on subsequent calls', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('createOtpEntry', () => {
    it('should create an OTP entry with correct structure', async () => {
      const data = { purpose: 'test', userId: 'user123' };
      const result = await createOtpEntry(data);

      expect(result).toHaveProperty('otpId');
      expect(result).toHaveProperty('expiresAt');
      expect(result.otpId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should store OTP with provided data', async () => {
      const data = { purpose: 'password_change', userId: 'user123', newPassword: 'newPass123' };
      const { otpId, otp } = await createOtpEntry(data);

      const stored = await verifyOtpEntry(otpId, otp);
      expect(stored.valid).toBe(true);
      expect(stored.data.purpose).toBe('password_change');
      expect(stored.data.userId).toBe('user123');
    });
  });

  describe('verifyOtpEntry', () => {
    it('should verify valid OTP', async () => {
      const { otpId, otp } = await createOtpEntry({ purpose: 'test' });
      const result = await verifyOtpEntry(otpId, otp);

      expect(result.valid).toBe(true);
      expect(result.data.purpose).toBe('test');
    });

    it('should reject invalid OTP', async () => {
      const { otpId } = await createOtpEntry({ purpose: 'test' });
      const result = await verifyOtpEntry(otpId, '000000');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid');
    });

    it('should reject non-existent OTP ID', async () => {
      const result = await verifyOtpEntry('non-existent-id', '123456');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid');
    });
  });
});

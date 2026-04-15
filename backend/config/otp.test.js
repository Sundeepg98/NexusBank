const { createOtpEntry, verifyOtpEntry, generateOTP } = require('./otp');

describe('OTP utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
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

    it('should delete OTP after successful verification', async () => {
      const { otpId, otp } = await createOtpEntry({ purpose: 'test' });

      await verifyOtpEntry(otpId, otp);

      const secondVerify = await verifyOtpEntry(otpId, otp);
      expect(secondVerify.valid).toBe(false);
      expect(secondVerify.reason).toBe('invalid');
    });
  });
});
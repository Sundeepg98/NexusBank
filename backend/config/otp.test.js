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
    it('should create an OTP entry with correct structure', () => {
      const data = { purpose: 'test', userId: 'user123' };
      const result = createOtpEntry(data);

      expect(result).toHaveProperty('otpId');
      expect(result).toHaveProperty('otp');
      expect(result).toHaveProperty('expiresAt');
      expect(result.otp).toMatch(/^\d{6}$/);
      expect(result.otpId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should store OTP with provided data', () => {
      const data = { purpose: 'password_change', userId: 'user123', newPassword: 'newPass123' };
      const { otpId, otp } = createOtpEntry(data);

      const stored = verifyOtpEntry(otpId, otp);
      expect(stored.valid).toBe(true);
      expect(stored.data.purpose).toBe('password_change');
      expect(stored.data.userId).toBe('user123');
      expect(stored.data.newPassword).toBe('newPass123');
    });
  });

  describe('verifyOtpEntry', () => {
    it('should verify valid OTP', () => {
      const { otpId, otp } = createOtpEntry({ purpose: 'test' });
      const result = verifyOtpEntry(otpId, otp);

      expect(result.valid).toBe(true);
      expect(result.data.purpose).toBe('test');
    });

    it('should reject invalid OTP', () => {
      const { otpId } = createOtpEntry({ purpose: 'test' });
      const result = verifyOtpEntry(otpId, '000000');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid');
    });

    it('should reject expired OTP', () => {
      const { otpId, otp } = createOtpEntry({ purpose: 'test' });

      jest.advanceTimersByTime(6 * 60 * 1000 + 1);

      const result = verifyOtpEntry(otpId, otp);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should reject non-existent OTP ID', () => {
      const result = verifyOtpEntry('non-existent-id', '123456');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should delete OTP after successful verification', () => {
      const { otpId, otp } = createOtpEntry({ purpose: 'test' });

      verifyOtpEntry(otpId, otp);

      const secondVerify = verifyOtpEntry(otpId, otp);
      expect(secondVerify.valid).toBe(false);
      expect(secondVerify.reason).toBe('expired');
    });
  });
});

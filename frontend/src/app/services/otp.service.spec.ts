import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OtpService } from './otp.service';
import { HttpClient } from '@angular/common/http';

describe('OtpService', () => {
  let service: OtpService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = {
      post: vi.fn(),
    } as unknown as HttpClient;
    service = new OtpService(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate 6-digit OTP', () => {
    const otp = service.generateOtpCode();
    expect(otp).toMatch(/^\d{6}$/);
    expect(otp.length).toBe(6);
  });

  it('should generate OTP within valid range', () => {
    for (let i = 0; i < 10; i++) {
      const otp = service.generateOtpCode();
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it('should validate correct OTP format', () => {
    expect(service.validateOtpFormat('123456')).toBe(true);
    expect(service.validateOtpFormat('000000')).toBe(true);
    expect(service.validateOtpFormat('999999')).toBe(true);
  });

  it('should reject invalid OTP format', () => {
    expect(service.validateOtpFormat('12345')).toBe(false);
    expect(service.validateOtpFormat('1234567')).toBe(false);
    expect(service.validateOtpFormat('12345a')).toBe(false);
    expect(service.validateOtpFormat('')).toBe(false);
    expect(service.validateOtpFormat('abcdef')).toBe(false);
  });

  it('should detect expired OTP', () => {
    const pastTime = Date.now() - 300000;
    expect(service.isOtpExpired(pastTime)).toBe(true);
  });

  it('should detect non-expired OTP', () => {
    const futureTime = Date.now() + 300000;
    expect(service.isOtpExpired(futureTime)).toBe(false);
  });

  it('should call generateOtp endpoint', () => {
    const mockResponse = { message: 'OTP sent', otpId: '123', otp: '123456' };
    vi.mocked(httpClient.post).mockReturnValue(mockResponse as any);

    service.generateOtp({
      fromAccountId: 'acc1',
      toAccountNumber: '1234567890',
      amount: 100,
    });

    expect(httpClient.post).toHaveBeenCalled();
    const callArgs = vi.mocked(httpClient.post).mock.calls[0];
    expect(callArgs[0]).toContain('/transfer/generate-otp');
  });

  it('should call verifyOtp endpoint', () => {
    const mockResponse = { success: true, transactionId: 'tx123' };
    vi.mocked(httpClient.post).mockReturnValue(mockResponse as any);

    service.verifyOtp({
      otpId: '123',
      otp: '123456',
      fromAccountId: 'acc1',
      toAccountNumber: '1234567890',
      amount: 100,
    });

    expect(httpClient.post).toHaveBeenCalled();
    const callArgs = vi.mocked(httpClient.post).mock.calls[0];
    expect(callArgs[0]).toContain('/transfer/verify-otp');
  });

  it('should generate unique OTPs', () => {
    const otps = new Set<string>();
    for (let i = 0; i < 100; i++) {
      otps.add(service.generateOtpCode());
    }
    expect(otps.size).toBe(100);
  });
});

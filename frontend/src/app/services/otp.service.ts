import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OtpResponse {
  message: string;
  otpId: string;
  otp: string;
}

export interface OtpVerifyRequest {
  otpId: string;
  otp: string;
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  description?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  transactionId: string;
}

@Injectable({
  providedIn: 'root',
})
export class OtpService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  generateOtp(data: {
    fromAccountId: string;
    toAccountNumber: string;
    amount: number;
  }): Observable<OtpResponse> {
    return this.http.post<OtpResponse>(`${this.baseUrl}/transfer/generate-otp`, data);
  }

  verifyOtp(data: OtpVerifyRequest): Observable<OtpVerifyResponse> {
    return this.http.post<OtpVerifyResponse>(`${this.baseUrl}/transfer/verify-otp`, data);
  }

  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  validateOtpFormat(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  isOtpExpired(expiryTime: number): boolean {
    return Date.now() > expiryTime;
  }
}

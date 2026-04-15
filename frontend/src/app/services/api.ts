import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  User,
  Account,
  Transaction,
  AuthResponse,
  AccountsResponse,
  TransactionsResponse,
  TransferRequest,
} from '../models';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  message: string;
  token: string;
  refreshToken: string;
  refreshTokenExpiry: number;
  user: User;
}

export interface ForgotPasswordResponse {
  message: string;
  otpId: string;
}

export interface ResetPasswordResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private handleError(error: any): Observable<never> {
    let message = 'An error occurred';
    if (error.error?.error) {
      message = error.error.error;
    } else if (error.message) {
      message = error.message;
    }
    return throwError(() => new Error(message));
  }

  register(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, data)
      .pipe(catchError((err) => this.handleError(err)));
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, { email, password })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getProfile(): Observable<{ user: User }> {
    return this.http
      .get<{ user: User }>(`${this.baseUrl}/profile`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  getAccounts(): Observable<Account[]> {
    return this.http
      .get<AccountsResponse>(`${this.baseUrl}/accounts`)
      .pipe(
        map((response) => response.accounts),
        catchError((err) => this.handleError(err))
      );
  }

  createAccount(accountType: string, initialDeposit?: number): Observable<{ message: string; account: Account }> {
    return this.http
      .post<{ message: string; account: Account }>(
        `${this.baseUrl}/accounts`,
        { accountType, initialDeposit: initialDeposit || 0 }
      )
      .pipe(catchError((err) => this.handleError(err)));
  }

  getTransactions(accountId: string, limit = 20): Observable<Transaction[]> {
    return this.http
      .get<TransactionsResponse>(
        `${this.baseUrl}/transactions?accountId=${accountId}&limit=${limit}`
      )
      .pipe(
        map((response) => response.transactions),
        catchError((err) => this.handleError(err))
      );
  }

  transfer(data: TransferRequest): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/transactions/transfer`, data)
      .pipe(catchError((err) => this.handleError(err)));
  }

  generateOTP(data: { fromAccountId: string; toAccountNumber: string; amount: number }): Observable<{ message: string; otpId: string; expiresIn: number }> {
    return this.http
      .post<{ message: string; otpId: string; expiresIn: number }>(`${this.baseUrl}/transactions/generate-otp`, data)
      .pipe(catchError((err) => this.handleError(err)));
  }

  verifyOTP(data: {
    otpId: string;
    otp: string;
    fromAccountId: string;
    toAccountNumber: string;
    amount: number;
    description?: string;
  }): Observable<{ success: boolean; transactionId: string }> {
    return this.http
      .post<{ success: boolean; transactionId: string }>(`${this.baseUrl}/transactions/verify-otp`, data)
      .pipe(catchError((err) => this.handleError(err)));
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/auth/change-password`, data)
      .pipe(catchError((err) => this.handleError(err)));
  }

  requestPasswordChangeOTP(data: { currentPassword: string; newPassword: string }): Observable<{ message: string; otpId: string }> {
    return this.http
      .post<{ message: string; otpId: string }>(`${this.baseUrl}/auth/request-password-otp`, data)
      .pipe(catchError((err) => this.handleError(err)));
  }

  changePasswordWithOTP(data: { otpId: string; otp: string; newPassword: string }): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/auth/change-password-with-otp`, data)
      .pipe(catchError((err) => this.handleError(err)));
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http
      .post<ForgotPasswordResponse>(`${this.baseUrl}/auth/forgot-password`, { email })
      .pipe(catchError((err) => this.handleError(err)));
  }

  resetPassword(email: string, otpId: string, otp: string, newPassword: string): Observable<ResetPasswordResponse> {
    return this.http
      .post<ResetPasswordResponse>(`${this.baseUrl}/auth/reset-password`, { email, otpId, otp, newPassword })
      .pipe(catchError((err) => this.handleError(err)));
  }

  deleteProfile(): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/profile/user`)
      .pipe(catchError((err) => this.handleError(err)));
  }

  updateAvatar(avatar: string): Observable<{ message: string; user: User }> {
    return this.http
      .put<{ message: string; user: User }>(`${this.baseUrl}/profile`, { avatar })
      .pipe(catchError((err) => this.handleError(err)));
  }
}

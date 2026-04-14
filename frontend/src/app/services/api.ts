import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth';
import {
  User,
  Account,
  Transaction,
  AuthResponse,
  AccountsResponse,
  TransactionsResponse,
  TransferRequest,
  ApiError,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  private handleError(error: any): Observable<never> {
    let message = 'An error occurred';
    if (error.error?.error) {
      message = error.error.error;
    } else if (error.message) {
      message = error.message;
    }
    return throwError(() => new Error(message));
  }

  // Auth endpoints
  register(data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, data, {
        headers: this.getHeaders(),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, { email, password }, {
        headers: this.getHeaders(),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getProfile(): Observable<{ user: User; accounts: Account[] }> {
    return this.http
      .get<{ user: User; accounts: Account[] }>(`${this.baseUrl}/auth/profile`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  // Account endpoints
  getAccounts(): Observable<Account[]> {
    return this.http
      .get<AccountsResponse>(`${this.baseUrl}/accounts`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.accounts),
        catchError((err) => this.handleError(err))
      );
  }

  createAccount(accountType: string, initialDeposit?: number): Observable<{ message: string; account: Account }> {
    return this.http
      .post<{ message: string; account: Account }>(
        `${this.baseUrl}/accounts`,
        { accountType, initialDeposit: initialDeposit || 0 },
        { headers: this.getHeaders() }
      )
      .pipe(catchError((err) => this.handleError(err)));
  }

  getAccountBalance(accountId: string): Observable<{ balance: number }> {
    return this.http
      .get<{ balance: number }>(`${this.baseUrl}/accounts/${accountId}/balance`, {
        headers: this.getHeaders(),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }

  // Transaction endpoints
  getTransactions(accountId: string, limit = 20): Observable<Transaction[]> {
    return this.http
      .get<TransactionsResponse>(
        `${this.baseUrl}/transactions?accountId=${accountId}&limit=${limit}`,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => response.transactions),
        catchError((err) => this.handleError(err))
      );
  }

  transfer(data: TransferRequest): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/transactions/transfer`, data, {
        headers: this.getHeaders(),
      })
      .pipe(catchError((err) => this.handleError(err)));
  }
}

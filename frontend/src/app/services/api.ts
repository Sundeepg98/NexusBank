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

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';

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
    firstName: string;
    lastName: string;
    phone?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, data)
      .pipe(catchError((err) => this.handleError(err)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, { email, password })
      .pipe(catchError((err) => this.handleError(err)));
  }

  getProfile(): Observable<{ user: User; accounts: Account[] }> {
    return this.http
      .get<{ user: User; accounts: Account[] }>(`${this.baseUrl}/auth/profile`)
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

  getAccountBalance(accountId: string): Observable<{ balance: number }> {
    return this.http
      .get<{ balance: number }>(`${this.baseUrl}/accounts/${accountId}/balance`)
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
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'nexusbank_token';
  private readonly userKey = 'nexusbank_user';
  private readonly refreshTokenKey = 'nexusbank_refresh_token';
  private readonly refreshTokenExpiryKey = 'nexusbank_refresh_token_expiry';
  private sessionTimeout = 30 * 60 * 1000;
  private lastActivity: number = Date.now();
  private refreshInProgress = false;
  private refreshSubject: Observable<{ token: string; refreshToken: string; refreshTokenExpiry: number }> | null = null;

  private http = inject(HttpClient);
  private router = inject(Router);

  private tokenSignal = signal<string | null>(this.getTokenFromStorage());
  private userSignal = signal<User | null>(this.getUserFromStorage());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.checkAuth());

  login(token: string, user: User, refreshToken?: string, refreshTokenExpiry?: number): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
    if (refreshTokenExpiry) {
      localStorage.setItem(this.refreshTokenExpiryKey, refreshTokenExpiry.toString());
    }
    this.tokenSignal.set(token);
    this.userSignal.set(user);
    this.updateActivity();
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        error: () => {}
      });
    }
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.refreshTokenExpiryKey);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getUser(): User | null {
    return this.userSignal();
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  getRefreshTokenExpiry(): number | null {
    if (typeof window === 'undefined') return null;
    const expiry = localStorage.getItem(this.refreshTokenExpiryKey);
    return expiry ? parseInt(expiry, 10) : null;
  }

  isRefreshTokenValid(): boolean {
    const expiry = this.getRefreshTokenExpiry();
    if (!expiry) return false;
    return Date.now() < expiry;
  }

  refreshToken(): Observable<{ token: string; refreshToken: string; refreshTokenExpiry: number }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.refreshInProgress && this.refreshSubject) {
      return this.refreshSubject;
    }

    this.refreshInProgress = true;
    this.refreshSubject = this.http.post<{ token: string; refreshToken: string; refreshTokenExpiry: number }>(
      `${environment.apiUrl}/auth/refresh-token`,
      { refreshToken }
    ).pipe(
      catchError((error) => {
        this.refreshInProgress = false;
        this.refreshSubject = null;
        this.logout();
        this.router.navigate(['/welcome']);
        return throwError(() => new Error(error.error?.error || 'Session expired'));
      })
    );

    return this.refreshSubject;
  }

  onTokenRefreshed(token: string, refreshToken: string, refreshTokenExpiry: number): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.refreshTokenExpiryKey, refreshTokenExpiry.toString());
    this.tokenSignal.set(token);
    this.refreshInProgress = false;
    this.refreshSubject = null;
  }

  checkSession(): boolean {
    if (this.isAuthenticated()) {
      const idle = Date.now() - this.lastActivity;
      if (idle > this.sessionTimeout) {
        this.logout();
        return false;
      }
    }
    return true;
  }

  updateActivity(): void {
    this.lastActivity = Date.now();
  }

  private getTokenFromStorage(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  private getUserFromStorage(): User | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  private checkAuth(): boolean {
    const token = this.tokenSignal();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}

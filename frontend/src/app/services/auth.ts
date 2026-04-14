import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'nexusbank_token';
  private readonly userKey = 'nexusbank_user';

  private tokenSignal = signal<string | null>(this.getTokenFromStorage());
  private userSignal = signal<User | null>(this.getUserFromStorage());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.checkAuth());

  login(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.tokenSignal.set(token);
    this.userSignal.set(user);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getUser(): User | null {
    return this.userSignal();
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

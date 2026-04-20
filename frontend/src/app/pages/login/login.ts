import { Component, signal, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { ToastComponent } from '../../components/toast';
import { LoadingComponent } from '../../components/loading';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastComponent, LoadingComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login implements OnDestroy {
  loginForm: FormGroup;
  isLoading = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'warning'>('error');
  showToast = signal(false);
  showPassword = signal(false);
  protected destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    this.apiService.login(email, password).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.authService.login(response.token, response.user, response.refreshToken, response.refreshTokenExpiry);
        this.isLoading.set(false);
        this.showToastMessage('Login successful!', 'success');
this.router.navigate(['/netbanking']);  // Navigate immediately
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.showToastMessage(err.message || 'Login failed', 'error');
      },
    });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  hasError(field: string, errorCode: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.touched && control?.hasError(errorCode));
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);

    setTimeout(() => {
      this.showToast.set(false);
    }, 5000);
  }

  closeToast(): void {
    this.showToast.set(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

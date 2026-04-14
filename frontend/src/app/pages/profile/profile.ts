import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api';
import { ToastComponent } from '../../components/toast';
import { LoadingComponent } from '../../components/loading';
import { CurrencyPipe } from '../../pipes/currency.pipe';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { User } from '../../models';

type LoadState = 'idle' | 'loading' | 'error' | 'success';
type ChangePasswordState = 'idle' | 'loading' | 'error' | 'success';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastComponent,
    LoadingComponent,
    CurrencyPipe,
    DateFormatPipe
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  user = signal<User | null>(null);
  loadState = signal<LoadState>('idle');
  showPasswordForm = signal(false);
  changePasswordState = signal<ChangePasswordState>('idle');
  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'warning'>('success');
  showToast = signal(false);

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    ]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  userName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  loadProfile(): void {
    this.loadState.set('loading');
    this.apiService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.user.set(response.user);
          this.loadState.set('success');
        },
        error: (err: Error) => {
          this.loadState.set('error');
          this.showToastMessage(err.message || 'Failed to load profile', 'error');
        }
      });
  }

  togglePasswordForm(): void {
    this.showPasswordForm.set(!this.showPasswordForm());
    this.passwordForm.reset();
    this.changePasswordState.set('idle');
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.changePasswordState.set('loading');
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.apiService.changePassword({ currentPassword, newPassword })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.changePasswordState.set('success');
          this.showToastMessage(response.message || 'Password changed successfully', 'success');
          this.passwordForm.reset();
          this.showPasswordForm.set(false);
        },
        error: (err: Error) => {
          this.changePasswordState.set('error');
          this.showToastMessage(err.message || 'Failed to change password', 'error');
        }
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/welcome']);
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

  hasError(field: string, errorCode: string): boolean {
    const control = this.passwordForm.get(field);
    return !!(control?.touched && control?.hasError(errorCode));
  }
}
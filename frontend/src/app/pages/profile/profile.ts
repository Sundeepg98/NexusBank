import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api';
import { ToastComponent } from '../../components/toast';
import { LoadingComponent } from '../../components/loading';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { User } from '../../models';

type LoadState = 'idle' | 'loading' | 'error' | 'success';
type ChangePasswordState = 'idle' | 'loading' | 'error' | 'success';
type DeleteAccountState = 'idle' | 'loading' | 'error' | 'success';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastComponent,
    LoadingComponent,
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
  otpRequested = signal(false);
  otpId = signal('');
  otpError = signal('');
  showDeleteModal = signal(false);
  deleteAccountState = signal<DeleteAccountState>('idle');

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    ]],
    confirmPassword: ['', [Validators.required]],
    otp: ['']
  }, { validators: this.passwordMatchValidator });

  userName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  userInitials = computed(() => {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
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
    this.otpRequested.set(false);
    this.otpId.set('');
    this.otpError.set('');
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, otp } = this.passwordForm.value;

    if (!this.otpRequested()) {
      this.requestOtp(currentPassword, newPassword);
    } else {
      this.verifyOtpAndChangePassword(otp);
    }
  }

  requestOtp(currentPassword: string, newPassword: string): void {
    this.changePasswordState.set('loading');
    this.otpError.set('');

    this.apiService.requestPasswordChangeOTP({ currentPassword, newPassword })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.otpId.set(response.otpId);
          this.otpRequested.set(true);
          this.changePasswordState.set('idle');
          this.showToastMessage(`OTP sent: ${response.otp}`, 'success');
        },
        error: (err: Error) => {
          this.changePasswordState.set('error');
          this.otpError.set(err.message);
          this.showToastMessage(err.message || 'Failed to request OTP', 'error');
        }
      });
  }

  verifyOtpAndChangePassword(otp: string): void {
    if (!otp || otp.length !== 6) {
      this.otpError.set('OTP must be 6 digits');
      this.changePasswordState.set('error');
      return;
    }

    this.changePasswordState.set('loading');
    this.otpError.set('');

    this.apiService.changePasswordWithOTP({ otpId: this.otpId(), otp })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.changePasswordState.set('success');
          this.showToastMessage(response.message || 'Password changed successfully', 'success');
          this.passwordForm.reset();
          this.showPasswordForm.set(false);
          this.otpRequested.set(false);
          this.otpId.set('');
        },
        error: (err: Error) => {
          this.changePasswordState.set('error');
          this.otpError.set(err.message);
          this.showToastMessage(err.message || 'Failed to change password', 'error');
        }
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }

  openDeleteModal(): void {
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteAccountState.set('idle');
  }

  confirmDelete(): void {
    this.deleteAccountState.set('loading');
    this.apiService.deleteProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleteAccountState.set('success');
          this.showToastMessage('Account deleted successfully', 'success');
          this.closeDeleteModal();
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/welcome']);
          }, 1000);
        },
        error: (err: Error) => {
          this.deleteAccountState.set('error');
          this.showToastMessage(err.message || 'Failed to delete account', 'error');
        }
      });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.showToastMessage('Please select an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.updateAvatar(result);
    };
    reader.readAsDataURL(file);
  }

  private updateAvatar(avatar: string): void {
    this.apiService.updateAvatar(avatar)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.user.set(response.user);
          this.showToastMessage('Avatar updated successfully', 'success');
        },
        error: (err: Error) => {
          this.showToastMessage(err.message || 'Failed to update avatar', 'error');
        }
      });
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
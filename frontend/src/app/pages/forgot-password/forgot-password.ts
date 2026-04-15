import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { ToastComponent } from '../../components/toast';
import { LoadingComponent } from '../../components/loading';

type Step = 'email' | 'otp' | 'password' | 'success';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastComponent, LoadingComponent],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  emailForm: FormGroup;
  otpForm: FormGroup;
  passwordForm: FormGroup;
  currentStep = signal<Step>('email');
  isLoading = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'warning'>('error');
  showToast = signal(false);
  otpId = signal('');
  email = signal('');

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onSubmitEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const emailValue = this.emailForm.value.email;
    this.email.set(emailValue);

    this.apiService.forgotPassword(emailValue).subscribe({
      next: (response) => {
        this.otpId.set(response.otpId);
        this.currentStep.set('otp');
        this.isLoading.set(false);
        this.showToastMessage('OTP sent to your email', 'success');
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.showToastMessage(err.message || 'Failed to send OTP', 'error');
      }
    });
  }

  onSubmitOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.currentStep.set('password');
  }

  onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.showToastMessage('Passwords do not match', 'error');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      this.showToastMessage('Password must contain uppercase, lowercase, number, and special character', 'error');
      return;
    }

    this.isLoading.set(true);

    this.apiService.resetPassword(this.email(), this.otpId(), this.otpForm.value.otp, newPassword).subscribe({
      next: () => {
        this.currentStep.set('success');
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.showToastMessage(err.message || 'Failed to reset password', 'error');
      }
    });
  }

  goBack(): void {
    if (this.currentStep() === 'otp') {
      this.currentStep.set('email');
    } else if (this.currentStep() === 'password') {
      this.currentStep.set('otp');
    }
  }

  goToLogin(): void {
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

  hasError(form: FormGroup, field: string, errorCode: string): boolean {
    const control = form.get(field);
    return !!(control?.touched && control?.hasError(errorCode));
  }
}
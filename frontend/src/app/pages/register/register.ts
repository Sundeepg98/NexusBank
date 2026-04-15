import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { ToastComponent } from '../../components/toast';
import { LoadingComponent } from '../../components/loading';
import { AuthResponse } from '../../models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastComponent, LoadingComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  registerForm: FormGroup;
  isLoading = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'warning'>('error');
  showToast = signal(false);
  showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.pattern(/^\+?[\d\s-]{10,}$/)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
      ]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { firstName, lastName, email, username, phone, password, confirmPassword } = this.registerForm.value;

    this.apiService.register({
      firstName,
      lastName,
      email,
      username,
      phone: phone || undefined,
      password,
      confirmPassword,
    }).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading.set(false);
        this.showToastMessage('Registration successful! Please login.', 'success');
        setTimeout(() => {
          this.router.navigate(['/welcome']);
        }, 2000);
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.showToastMessage(err.message || 'Registration failed', 'error');
      },
    });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  hasError(field: string, errorCode: string): boolean {
    const control = this.registerForm.get(field);
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
}

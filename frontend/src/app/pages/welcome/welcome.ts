import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../services/api';
import { ToastComponent } from '../../components/toast';
import { LoadingComponent } from '../../components/loading';
import { AuthResponse } from '../../models';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastComponent, LoadingComponent],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss'
})
export class Welcome {
  loginForm: FormGroup;
  isLoading = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'warning'>('error');
  showToast = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    this.apiService.login(email, password).subscribe({
      next: (response: AuthResponse) => {
        this.authService.login(response.token, response.user);
        this.router.navigate(['/netbanking']);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.showToastMessage(err.message || 'Login failed', 'error');
      },
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
    const control = this.loginForm.get(field);
    return !!(control?.touched && control?.hasError(errorCode));
  }
}

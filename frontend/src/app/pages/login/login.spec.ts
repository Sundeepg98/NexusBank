import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from './login';
import { ApiService } from '../../services/api';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

describe('Login', () => {
  let component: Login;
  let mockApiService: Partial<ApiService>;
  let mockRouter: Partial<Router>;
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
    mockApiService = {
      login: vi.fn().mockReturnValue({ pipe: () => ({ subscribe: () => {} }) })
    };
    mockRouter = {
      navigate: vi.fn()
    };
    component = new Login(fb, mockApiService as ApiService, mockRouter as Router);
  });

  it('should create Login component', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty form initially', () => {
    expect(component.loginForm.value.email).toBe('');
    expect(component.loginForm.value.password).toBe('');
  });

  it('should update form values on input', () => {
    component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
    expect(component.loginForm.value.email).toBe('test@example.com');
    expect(component.loginForm.value.password).toBe('password123');
  });

  it('should show password toggle state', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
  });

  it('should have required validators on email and password', () => {
    component.loginForm.setValue({ email: '', password: '' });
    expect(component.loginForm.valid).toBe(false);
  });

  it('should validate email format', () => {
    component.loginForm.setValue({ email: 'invalid-email', password: 'password123' });
    expect(component.loginForm.hasError('email', 'email')).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Register } from './register';
import { ApiService } from '../../services/api';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

describe('Register', () => {
  let component: Register;
  let mockApiService: Partial<ApiService>;
  let mockRouter: Partial<Router>;
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
    mockApiService = {
      register: vi.fn().mockReturnValue({ pipe: () => ({ subscribe: () => {} }) })
    };
    mockRouter = {
      navigate: vi.fn()
    };
    component = new Register(fb, mockApiService as ApiService, mockRouter as Router);
  });

  it('should create Register component', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty form initially', () => {
    expect(component.registerForm.value.firstName).toBe('');
    expect(component.registerForm.value.lastName).toBe('');
    expect(component.registerForm.value.email).toBe('');
    expect(component.registerForm.value.password).toBe('');
    expect(component.registerForm.value.confirmPassword).toBe('');
  });

  it('should validate password match', () => {
    component.registerForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      phone: '+1234567890',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    expect(component.registerForm.errors).toBeNull();
  });

  it('should set passwordMismatch error when passwords do not match', () => {
    component.registerForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      phone: '+1234567890',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!'
    });
    expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
  });

  it('should call apiService.register on form submit', () => {
    const registerSpy = vi.fn().mockReturnValue({ pipe: () => ({ subscribe: () => {} }) });
    (mockApiService as any).register = registerSpy;

    component.registerForm.setValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      phone: '+1234567890',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    component.onRegister();
    expect(registerSpy).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      username: 'johndoe',
      phone: '+1234567890',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
  });

  it('should not call apiService.register if form is invalid', () => {
    const registerSpy = vi.fn().mockReturnValue({ pipe: () => ({ subscribe: () => {} }) });
    (mockApiService as any).register = registerSpy;

    component.registerForm.setValue({
      firstName: '',
      lastName: '',
      email: 'invalid',
      username: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });

    component.onRegister();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
  });
});

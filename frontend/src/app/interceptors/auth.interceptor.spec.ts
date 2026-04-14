import { describe, it, expect } from 'vitest';
import { authInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  it('should be defined', () => {
    expect(authInterceptor).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof authInterceptor).toBe('function');
  });
});
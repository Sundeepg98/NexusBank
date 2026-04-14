import { describe, it, expect } from 'vitest';
import { errorInterceptor } from './error.interceptor';

describe('ErrorInterceptor', () => {
  it('should be defined', () => {
    expect(errorInterceptor).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof errorInterceptor).toBe('function');
  });
});